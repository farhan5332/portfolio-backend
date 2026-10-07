// API checks: response shapes, validation, auth guards, uploads and security headers.
//   npm test
// Runs the real app against the database in .env. Public content is only read. The admin
// tests create one draft project and one image, and delete both again when they finish.
import { after, before, describe, test } from 'node:test';
import assert from 'node:assert/strict';
import sharp from 'sharp';
import app from '../src/app.js';
import { env } from '../src/config/env.js';
import { connectDB, disconnectDB } from '../src/config/db.js';
import { Media, Message, Project, User } from '../src/models/index.js';
import { deleteFile } from '../src/services/storage.service.js';
import { signAccessToken } from '../src/utils/tokens.js';

let server;
let base;
let token; // access token of an existing admin (null when no admin has been created yet)
const cleanup = { projectIds: [], media: [] };

const call = async (path, { method = 'GET', body, headers = {}, auth = false } = {}) => {
  const isForm = body instanceof FormData;
  const res = await fetch(`${base}${path}`, {
    method,
    headers: {
      ...(body !== undefined && !isForm && { 'Content-Type': 'application/json' }),
      ...(auth && { Authorization: `Bearer ${token}` }),
      ...headers,
    },
    body: body === undefined || isForm || typeof body === 'string' ? body : JSON.stringify(body),
  });
  const text = await res.text();
  let json = null;
  try {
    json = JSON.parse(text);
  } catch {
    // not JSON (files, HTML)
  }
  return { res, status: res.status, json, text };
};

const imageForm = (buffer, name, type) => {
  const form = new FormData();
  form.append('file', new Blob([buffer], { type }), name);
  form.append('alt', 'API test image');
  return form;
};

before(async () => {
  await connectDB();
  server = app.listen(0);
  await new Promise((resolve) => server.once('listening', resolve));
  base = `http://localhost:${server.address().port}`;

  const admin = await User.findOne({ role: 'admin' });
  token = admin ? signAccessToken(admin) : null;
});

after(async () => {
  await Project.deleteMany({ _id: { $in: cleanup.projectIds } });
  for (const media of cleanup.media) {
    await Media.deleteOne({ _id: media._id });
    await deleteFile(media.filename).catch(() => {});
  }
  await new Promise((resolve) => server.close(resolve));
  await disconnectDB();
});

describe('public API', () => {
  test('health check reports a connected database', async () => {
    const { status, json } = await call('/api/health');
    assert.equal(status, 200);
    assert.equal(json.db, 'connected');
  });

  for (const resource of ['skills', 'projects', 'blogs', 'experience', 'testimonials', 'services']) {
    test(`GET /api/${resource} returns a paginated list`, async () => {
      const { status, json } = await call(`/api/${resource}?limit=5`);
      assert.equal(status, 200);
      assert.equal(json.success, true);
      assert.ok(Array.isArray(json.data));
      assert.ok(json.data.length <= 5);
      assert.deepEqual(Object.keys(json.meta).sort(), ['limit', 'page', 'total', 'totalPages']);
    });
  }

  test('limit is capped at 100 and bad paging values fall back to defaults', async () => {
    const { json } = await call('/api/skills?limit=99999&page=-3');
    assert.equal(json.meta.limit, 100);
    assert.equal(json.meta.page, 1);
  });

  test('visitors never see drafts, even when asking for them', async () => {
    for (const resource of ['projects', 'blogs']) {
      const { json } = await call(`/api/${resource}?status=draft&limit=100`);
      assert.ok(json.data.every((item) => item.status === 'published'));
    }
  });

  test('query operators in the URL are not passed to the database', async () => {
    const { status, json } = await call('/api/projects?status[$ne]=published&category[$gt]=');
    assert.equal(status, 200);
    assert.ok(json.data.every((item) => item.status === 'published'));
  });

  test('an invalid id is a 400, an unknown slug a 404', async () => {
    assert.equal((await call('/api/skills/not-an-id')).status, 400);
    assert.equal((await call('/api/projects/this-slug-does-not-exist')).status, 404);
  });

  test('unknown routes return a JSON 404', async () => {
    const { status, json } = await call('/api/nope');
    assert.equal(status, 404);
    assert.equal(json.success, false);
  });

  test('malformed JSON is a 400, not a crash', async () => {
    const { status, json } = await call('/api/contact', {
      method: 'POST',
      body: '{"name": ',
      headers: { 'Content-Type': 'application/json' },
    });
    assert.equal(status, 400);
    assert.equal(json.message, 'Invalid JSON in request body');
  });
});

describe('contact form', () => {
  test('rejects an empty form with one error per field', async () => {
    const { status, json } = await call('/api/contact', { method: 'POST', body: {} });
    assert.equal(status, 400);
    assert.deepEqual(json.details.map((d) => d.field).sort(), ['email', 'message', 'name']);
  });

  test('rejects a bad email and a too-short message', async () => {
    const { status, json } = await call('/api/contact', {
      method: 'POST',
      body: { name: 'Test', email: 'not-an-email', message: 'short' },
    });
    assert.equal(status, 400);
    assert.deepEqual(json.details.map((d) => d.field).sort(), ['email', 'message']);
  });

  test('a filled honeypot looks successful but stores nothing', async () => {
    const before = await Message.countDocuments();
    const { status } = await call('/api/contact', {
      method: 'POST',
      body: { name: 'Bot', email: 'bot@example.com', message: 'Buy cheap things now', website: 'http://spam.example' },
    });
    assert.equal(status, 201);
    assert.equal(await Message.countDocuments(), before);
  });
});

describe('security', () => {
  test('admin routes need a token', async () => {
    const guarded = [
      ['POST', '/api/skills'],
      ['PUT', '/api/about'],
      ['DELETE', '/api/projects/000000000000000000000000'],
      ['GET', '/api/contact'],
      ['GET', '/api/media'],
      ['GET', '/api/stats'],
      ['POST', '/api/upload/image'],
      ['GET', '/api/auth/me'],
    ];
    for (const [method, path] of guarded) {
      const { status, json } = await call(path, { method, body: method === 'GET' ? undefined : {} });
      assert.equal(status, 401, `${method} ${path}`);
      assert.equal(json.code, 'NO_TOKEN');
    }
  });

  test('a forged token is rejected', async () => {
    const { status, json } = await call('/api/stats', { headers: { Authorization: 'Bearer abc.def.ghi' } });
    assert.equal(status, 401);
    assert.equal(json.code, 'INVALID_TOKEN');
  });

  test('wrong login details are a 401 that does not reveal which part was wrong', async () => {
    const { status, json } = await call('/api/auth/login', {
      method: 'POST',
      body: { email: 'nobody@example.com', password: 'WrongPassword1' },
    });
    assert.equal(status, 401);
    assert.doesNotMatch(json.message, /not found|no user|no account/i);
  });

  test('refresh without a cookie is a 401', async () => {
    assert.equal((await call('/api/auth/refresh', { method: 'POST' })).status, 401);
  });

  test('CORS only allows the configured origins', async () => {
    const blocked = await call('/api/skills', { headers: { Origin: 'https://evil.example' } });
    assert.equal(blocked.status, 403);
    assert.equal(blocked.res.headers.get('access-control-allow-origin'), null);

    const allowed = await call('/api/skills', { headers: { Origin: env.clientUrls[0] } });
    assert.equal(allowed.status, 200);
    assert.equal(allowed.res.headers.get('access-control-allow-origin'), env.clientUrls[0]);
  });

  test('security headers are set', async () => {
    const { res } = await call('/api/health');
    assert.equal(res.headers.get('x-content-type-options'), 'nosniff');
    assert.equal(res.headers.get('x-powered-by'), null);
    assert.ok(res.headers.get('content-security-policy'));
    assert.ok(res.headers.get('ratelimit'));
  });

  test('uploads folder cannot be listed or escaped', async () => {
    assert.equal((await call('/uploads/')).status, 404);
    assert.equal((await call('/uploads/..%2F.env')).status, 404);
    assert.equal((await call('/uploads/%2e%2e/package.json')).status, 404);
  });
});

describe('admin API', () => {
  test('project: validate, create as draft, hide from visitors, update, delete', async (t) => {
    if (!token) return t.skip('no admin user yet (npm run create-admin)');

    const invalid = await call('/api/projects', { method: 'POST', auth: true, body: { liveUrl: 'not a url' } });
    assert.equal(invalid.status, 400);
    assert.deepEqual(invalid.json.details.map((d) => d.field).sort(), ['liveUrl', 'title']);

    const created = await call('/api/projects', {
      method: 'POST',
      auth: true,
      body: { title: 'API test project (safe to delete)', role: 'admin', slug: '' },
    });
    assert.equal(created.status, 201);
    const project = created.json.data;
    cleanup.projectIds.push(project._id);
    assert.equal(project.status, 'draft');
    assert.ok(project.slug.startsWith('api-test-project'));
    assert.equal(project.role, undefined, 'unknown fields are stripped');

    assert.equal((await call(`/api/projects/${project.slug}`)).status, 404, 'draft is hidden from visitors');
    assert.equal((await call(`/api/projects/${project.slug}`, { auth: true })).status, 200);

    const updated = await call(`/api/projects/${project._id}`, { method: 'PUT', auth: true, body: { summary: 'Updated' } });
    assert.equal(updated.status, 200);
    assert.equal(updated.json.data.summary, 'Updated');
    assert.equal(updated.json.data.title, project.title, 'fields that were not sent are kept');

    assert.equal((await call(`/api/projects/${project._id}`, { method: 'DELETE', auth: true })).status, 200);
    assert.equal((await call(`/api/projects/${project._id}`, { auth: true })).status, 404);
  });

  test('image upload is optimized, served, and removed with its media entry', async (t) => {
    if (!token) return t.skip('no admin user yet (npm run create-admin)');

    const original = await sharp({ create: { width: 3000, height: 1500, channels: 3, background: '#4f46e5' } })
      .png()
      .toBuffer();

    const uploaded = await call('/api/upload/image', {
      method: 'POST',
      auth: true,
      body: imageForm(original, 'Big Photo.png', 'image/png'),
    });
    assert.equal(uploaded.status, 201);
    const media = uploaded.json.data;
    cleanup.media.push(media);

    assert.equal(media.mimeType, 'image/webp');
    assert.match(media.url, /^\/uploads\/[\w-]+\.webp$/);
    assert.equal(media.width, 2000);
    assert.equal(media.height, 1000);

    const file = await fetch(`${base}${media.url}`);
    assert.equal(file.status, 200);
    assert.equal(file.headers.get('content-type'), 'image/webp');
    assert.match(file.headers.get('cache-control'), /immutable/);
    assert.equal((await file.arrayBuffer()).byteLength, media.size);

    assert.equal((await call(`/api/media/${media._id}`, { method: 'DELETE', auth: true })).status, 200);
    assert.equal((await fetch(`${base}${media.url}`)).status, 404);
  });

  test('a file that only pretends to be an image is rejected', async (t) => {
    if (!token) return t.skip('no admin user yet (npm run create-admin)');

    const fake = await call('/api/upload/image', {
      method: 'POST',
      auth: true,
      body: imageForm(Buffer.from('<script>alert(1)</script>'), 'photo.png', 'image/png'),
    });
    assert.equal(fake.status, 400);

    const svg = await call('/api/upload/image', {
      method: 'POST',
      auth: true,
      body: imageForm(Buffer.from('<svg xmlns="http://www.w3.org/2000/svg"/>'), 'logo.svg', 'image/svg+xml'),
    });
    assert.equal(svg.status, 400);
  });
});

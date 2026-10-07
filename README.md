# Portfolio Backend — Custom CMS + REST API

Node.js + Express 5 + MongoDB (Mongoose). Serves content to the portfolio frontend and powers the admin panel.

## Quick start

```bash
npm install
cp .env.example .env      # Windows PowerShell: Copy-Item .env.example .env
# edit .env -> set MONGODB_URI
npm run dev
```

Open http://localhost:4000/api/health — you should see `"db": "connected"`.

### Create your admin account (once)

1. Generate two JWT secrets (run twice, paste one into each variable in `.env`):
   ```bash
   node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
   ```
2. Set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in `.env`
3. `npm run create-admin`
4. Delete the `ADMIN_PASSWORD` line from `.env`

Forgot your password? Put a new one in `ADMIN_PASSWORD` and run `npm run reset-admin`.

## Auth API

| Method | Route                       | Auth         | Description                                |
| ------ | --------------------------- | ------------ | ------------------------------------------ |
| POST   | `/api/auth/login`           | public       | Returns `accessToken` + sets refresh cookie |
| POST   | `/api/auth/refresh`         | cookie       | New access token when the old one expires  |
| POST   | `/api/auth/logout`          | cookie       | Ends all sessions, clears cookie           |
| GET    | `/api/auth/me`              | Bearer token | Current admin                              |
| PUT    | `/api/auth/change-password` | Bearer token | Logs out other sessions                    |

Protect any route with `protect` (and optionally `authorize('admin')`) from `src/middleware/auth.js`.

## Content API

`GET` routes are public (visitors only see `published` projects/blogs). Everything else needs the Bearer token.

| Route               | Methods                                   |
| ------------------- | ----------------------------------------- |
| `/api/about`        | GET, PUT (single document)                |
| `/api/skills`       | GET, POST, PUT `/:id`, DELETE `/:id`, PUT `/reorder` |
| `/api/projects`     | same as skills, plus GET `/:slug`         |
| `/api/blogs`        | GET, POST, PUT `/:id`, DELETE `/:id`, GET `/:slug` |
| `/api/experience`   | GET, POST, PUT `/:id`, DELETE `/:id`      |
| `/api/testimonials` | same as skills                            |
| `/api/services`     | same as skills                            |
| `/api/stats`        | GET (admin dashboard counts)              |

List routes support `?page=&limit=&q=&sort=` plus per-type filters (see each file in `src/routes`).

## Uploads & media library

Files are served at `/uploads/<filename>`. Every upload is also saved in the `media` collection so
the admin panel can browse and reuse it. Where the file itself is kept depends on `UPLOAD_STORAGE`:

| Value      | Files live in                | Use for                                              |
| ---------- | ---------------------------- | ---------------------------------------------------- |
| `local`    | the `uploads/` folder        | development (or a host with a persistent disk)       |
| `database` | MongoDB (GridFS)             | Render / Railway, whose disks are wiped on every deploy |

Images are optimized when they are uploaded: rotated upright, shrunk to fit 2000 × 2000 px, stripped of
metadata (camera EXIF can include GPS coordinates) and saved as WebP. GIFs are kept as they are.

| Method | Route                   | Body (multipart/form-data)       | Limits                        |
| ------ | ----------------------- | -------------------------------- | ----------------------------- |
| POST   | `/api/upload/image`     | `file`, optional `alt`           | jpg, png, webp, gif, avif · 5 MB · saved as WebP |
| POST   | `/api/upload/document`  | `file`                           | pdf · 10 MB                   |
| GET    | `/api/media`            | `?kind=image\|document&q=&page=` |                               |
| PUT    | `/api/media/:id`        | `{ "alt": "..." }`               |                               |
| DELETE | `/api/media/:id`        | deletes the file too             |                               |

Uploads are checked twice: extension + mime type, then the file's first bytes, so a renamed
`.exe` can't pass as a `.png`. SVG is not allowed because it can contain scripts.

Already uploaded files while developing? `npm run media:to-db` copies everything in `uploads/` into
MongoDB so those files keep working after you deploy with `UPLOAD_STORAGE=database`.

## Contact form

| Method | Route               | Auth   | Description                                         |
| ------ | ------------------- | ------ | --------------------------------------------------- |
| POST   | `/api/contact`      | public | `{ name, email, subject?, message }` · 5 per hour per IP |
| GET    | `/api/contact`      | admin  | Inbox, newest first. `?read=false&q=&page=`         |
| PUT    | `/api/contact/:id`  | admin  | `{ "read": true }`                                  |
| DELETE | `/api/contact/:id`  | admin  |                                                     |

Every message is saved in the `messages` collection and shown under **Messages** in the admin panel.
To also get an email for each one, fill in the `SMTP_*` variables in `.env` (see `.env.example`;
a Gmail account with an App password works). Without them the API still works, it just skips the email.

## Portfolio frontend

The public website lives in its own repo, `project-frontend` (Next.js). It reads from this API and
must be listed in `CLIENT_URLS` so the contact form is allowed by CORS.

## Admin panel (`admin/`)

React 19 + Vite + Tailwind CSS 4. Login, dashboard, CRUD screens for every content type, a contact
form inbox, a media library, and password change.

```bash
npm run admin:install   # once
npm run dev             # terminal 1: API on :4000
npm run admin:dev       # terminal 2: admin on http://localhost:5173
```

In development Vite proxies `/api` and `/uploads` to `:4000`, so no CORS setup is needed.

In production the API serves the built admin panel itself at `/admin` (`npm run build` creates
`admin/dist`). One deployment, one domain, so the login cookie is first-party and works in every
browser. Hosting the admin on its own domain is still possible: see `admin/.env.example`.

Content types are described once in `admin/src/resources.jsx` (fields, list columns, filters). The list
page and edit form are generic, so adding a field is usually a one-line change there.

## Folder structure

```
src/
  config/        env loading + validation, DB connection, upload settings
  controllers/   request handlers (thin: read req, call service, send res)
  middleware/    auth guard, validation, uploads, rate limits, error handler, 404
  models/        Mongoose schemas
  routes/        Express routers, all mounted under /api
  services/      business logic (auth, email, file storage)
  utils/         ApiError, asyncHandler, query parsing, helpers
  validators/    request body validation (zod)
  app.js         Express app: security, CORS, parsers, routes
  server.js      connects DB, starts server, graceful shutdown
admin/           admin panel (React + Vite)
  src/resources.jsx   field config for every content type
  src/pages/          dashboard, generic list/edit pages, about, media, settings
  src/components/     UI kit, form fields, media picker, layout
  src/lib/api.js      fetch wrapper with automatic token refresh
scripts/         one-off scripts (create-admin, seed, uploads -> database)
tests/           API tests (npm test)
uploads/         local file storage
render.yaml      Render deployment blueprint
requests.http    API requests for the VS Code REST Client extension
```

## Scripts

| Command       | What it does                     |
| ------------- | -------------------------------- |
| `npm run dev` | Start with auto-reload (nodemon) |
| `npm start`   | Start for production             |
| `npm run create-admin` | Create the first admin user |
| `npm run reset-admin`  | Reset the admin password    |
| `npm run seed`         | Add sample content (empty collections only) |
| `npm run seed:profile` | Replace About, Skills, Projects and Experience with the profile in `scripts/profile.js` |
| `npm run admin:dev`    | Start the admin panel       |
| `npm run admin:build`  | Build the admin panel to `admin/dist` |
| `npm run build`        | Production build: installs the admin's packages and builds it |
| `npm test`             | API tests (validation, auth guards, uploads, security headers) |
| `npm run media:to-db`  | Copy the files in `uploads/` into MongoDB |

## Error response format

```json
{ "success": false, "message": "Validation failed", "details": [{ "field": "title", "message": "..." }] }
```

## Tests

```bash
npm test
```

Runs the real app against the database in `.env`: response shapes, validation errors, drafts hidden
from visitors, every admin route rejecting requests without a token, CORS, security headers, and the
upload pipeline. Content is only read. The admin tests create one draft project and one image and
delete both again.

## Deployment (Render)

One Render web service runs the API and the admin panel. Files and content live in MongoDB Atlas.

1. **Atlas** → Network Access → allow `0.0.0.0/0` (Render has no fixed IP address).
2. Push this repo to GitHub.
3. **Render** → New → Blueprint → choose the repo. `render.yaml` configures everything and asks for:
   - `MONGODB_URI`: the same connection string as in your `.env`
   - `CLIENT_URLS`: the portfolio's URL (e.g. `https://your-site.vercel.app`). Not deployed yet?
     Enter a placeholder and change it under Environment afterwards.
4. When the deploy is green, open:
   - `https://<service>.onrender.com/api/health` → `"db": "connected"`
   - `https://<service>.onrender.com/admin` → log in with your existing admin account

The JWT secrets are generated by Render, so they differ from your local ones. That only means
sessions from your computer are not valid on the server.

Optional environment variables: the `SMTP_*` group (emails for contact messages) and anything else
listed in `.env.example`.

Things to know:

- **Free plan sleeps** after 15 minutes without traffic; the next request takes up to a minute.
  The portfolio keeps showing its cached pages meanwhile. A paid instance or an uptime pinger on
  `/api/health` avoids the wait.
- **New admin on a fresh database:** set `ADMIN_NAME`, `ADMIN_EMAIL`, `ADMIN_PASSWORD` in your local
  `.env` (pointing at the production database) and run `npm run create-admin`.
- **Railway** works the same way: build `npm ci && npm run build`, start `npm start`, and set the
  variables from `render.yaml` by hand.

## Security checklist

| Area            | What is in place                                                                 |
| --------------- | -------------------------------------------------------------------------------- |
| Passwords       | bcrypt (12 rounds), never returned by the API                                    |
| Sessions        | 15 min access token in memory, refresh token in an httpOnly cookie, logout/password change invalidate all tokens |
| Brute force     | 10 failed logins / 15 min per IP, 5 contact messages / hour, 600 requests / 15 min overall |
| Input           | every body validated with zod, unknown fields dropped, query filters whitelisted |
| Uploads         | type + extension allow list, file signature check, re-encoded by sharp, random filenames, no SVG |
| Browser         | helmet headers + content security policy, CORS limited to `CLIENT_URLS`          |
| Errors          | production responses never include stack traces or internal messages             |
| Dependencies    | `npm audit` clean                                                                |

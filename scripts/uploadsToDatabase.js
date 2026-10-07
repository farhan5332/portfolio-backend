// Copies the files in uploads/ into MongoDB (GridFS), so media uploaded during local
// development keeps working after switching to UPLOAD_STORAGE=database for deployment.
//   npm run media:to-db
// Safe to run more than once: files that are already in the database are skipped.
import fs from 'node:fs/promises';
import path from 'node:path';

process.env.UPLOAD_STORAGE = 'database'; // must be set before the storage service loads

const { connectDB, disconnectDB } = await import('../src/config/db.js');
const { UPLOAD_DIR } = await import('../src/config/uploads.js');
const { Media } = await import('../src/models/index.js');
const { saveFile, fileExists } = await import('../src/services/storage.service.js');

await connectDB();

try {
  const counts = { copied: 0, skipped: 0, missing: 0 };

  for (const media of await Media.find()) {
    if (await fileExists(media.filename)) {
      counts.skipped += 1;
      continue;
    }

    const buffer = await fs.readFile(path.join(UPLOAD_DIR, path.basename(media.filename))).catch(() => null);
    if (!buffer) {
      counts.missing += 1;
      console.warn(`⚠️  Not in uploads/: ${media.filename} (${media.originalName})`);
      continue;
    }

    await saveFile(media.filename, buffer, media.mimeType);
    counts.copied += 1;
    console.log(`✅ ${media.filename}`);
  }

  console.log(`Done: ${counts.copied} copied, ${counts.skipped} already in the database, ${counts.missing} missing.`);
} catch (err) {
  console.error('❌ Failed:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}

import fs from 'node:fs';
import path from 'node:path';
import mongoose from 'mongoose';
import { env } from '../config/env.js';
import { UPLOAD_DIR } from '../config/uploads.js';

// Where uploaded files are kept. Either way they are served at /uploads/<filename>.
//   local    -> the uploads/ folder (development, or a host with a persistent disk)
//   database -> MongoDB GridFS. Hosts like Render wipe the disk on every deploy,
//               so in production files live next to the rest of the content.
const useDatabase = env.uploadStorage === 'database';

// basename() guarantees we only ever touch files inside the uploads folder
const diskPath = (filename) => path.join(UPLOAD_DIR, path.basename(filename));

let bucket;
const getBucket = () => {
  bucket ??= new mongoose.mongo.GridFSBucket(mongoose.connection.db, { bucketName: 'uploads' });
  return bucket;
};

const findInDatabase = (filename) => getBucket().find({ filename }).next();

export const saveFile = async (filename, buffer, mimeType) => {
  if (!useDatabase) {
    await fs.promises.mkdir(UPLOAD_DIR, { recursive: true });
    return fs.promises.writeFile(diskPath(filename), buffer);
  }

  await new Promise((resolve, reject) => {
    getBucket()
      .openUploadStream(filename, { metadata: { mimeType } })
      .on('error', reject)
      .on('finish', resolve)
      .end(buffer);
  });
};

// Deleting a file that is already gone is not an error.
export const deleteFile = async (filename) => {
  if (!useDatabase) {
    return fs.promises.unlink(diskPath(filename)).catch((err) => {
      if (err.code !== 'ENOENT') throw err;
    });
  }

  const file = await findInDatabase(filename);
  if (file) await getBucket().delete(file._id);
};

export const fileExists = async (filename) =>
  useDatabase ? Boolean(await findInDatabase(filename)) : fs.existsSync(diskPath(filename));

// Database storage only: { size, mimeType, etag, stream() } or null when there is no such file.
export const openStoredFile = async (filename) => {
  const file = await findInDatabase(filename);
  if (!file) return null;

  return {
    size: file.length,
    mimeType: file.metadata?.mimeType || 'application/octet-stream',
    etag: `"${file._id}"`,
    stream: () => getBucket().openDownloadStream(file._id),
  };
};

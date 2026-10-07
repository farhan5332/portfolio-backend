import crypto from 'node:crypto';
import { Media } from '../models/index.js';
import { UPLOAD_URL_PREFIX } from '../config/uploads.js';
import { saveFile, deleteFile, openStoredFile } from '../services/storage.service.js';
import { ApiError } from '../utils/ApiError.js';
import { isObjectId } from '../utils/objectId.js';
import { createCrudController } from './crud.factory.js';

// list / getOne / update (alt text) come from the shared CRUD factory.
const crud = createCrudController({
  model: Media,
  name: 'Media',
  filters: { kind: { type: 'string' } },
  searchFields: ['originalName', 'alt'],
  sortFields: ['createdAt', 'size', 'originalName'],
  defaultSort: { createdAt: -1 },
  defaultLimit: 24,
});

export const { list, getOne, update } = crud;

// POST /api/upload/image  and  /api/upload/document   (multipart, field "file")
export const create = (kind) => async (req, res) => {
  const { file } = req;

  // Files get a random name so uploads can't overwrite each other or use odd characters.
  // e.g. "1727712345678-9f86d081884c7d65.webp"
  const filename = `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${file.ext}`;
  await saveFile(filename, file.buffer, file.mimetype);

  try {
    const media = await Media.create({
      kind,
      filename,
      originalName: file.originalname,
      url: `${UPLOAD_URL_PREFIX}/${filename}`,
      mimeType: file.mimetype,
      size: file.size,
      width: file.width,
      height: file.height,
      alt: typeof req.body?.alt === 'string' ? req.body.alt.slice(0, 200) : '',
      uploadedBy: req.user?._id,
    });
    res.status(201).json({ success: true, message: 'File uploaded', data: media });
  } catch (err) {
    await deleteFile(filename).catch(() => {}); // don't leave orphan files behind
    throw err;
  }
};

// DELETE /api/media/:id  - removes the database entry AND the stored file
export const remove = async (req, res) => {
  const media = isObjectId(req.params.id) ? await Media.findByIdAndDelete(req.params.id) : null;
  if (!media) throw new ApiError(404, 'Media not found');

  await deleteFile(media.filename);

  res.json({ success: true, message: 'Media deleted', data: { _id: media._id } });
};

// GET /uploads/:filename  (public) - only used with UPLOAD_STORAGE=database.
// With local storage, express.static serves the uploads folder instead (see app.js).
export const serve = async (req, res) => {
  const file = await openStoredFile(req.params.filename);
  if (!file) throw new ApiError(404, 'File not found');

  // Filenames are unique and never reused, so browsers may cache them for a long time.
  res.set({
    'Content-Type': file.mimeType,
    'Cache-Control': 'public, max-age=2592000, immutable',
    ETag: file.etag,
  });
  if (req.headers['if-none-match'] === file.etag) return res.status(304).end();

  res.set('Content-Length', String(file.size));
  file.stream().on('error', () => res.destroy()).pipe(res);
};

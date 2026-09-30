import fs from 'node:fs/promises';
import path from 'node:path';
import { Media } from '../models/index.js';
import { UPLOAD_DIR, UPLOAD_URL_PREFIX } from '../config/uploads.js';
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

  try {
    const media = await Media.create({
      kind,
      filename: file.filename,
      originalName: file.originalname,
      url: `${UPLOAD_URL_PREFIX}/${file.filename}`,
      mimeType: file.mimetype,
      size: file.size,
      alt: typeof req.body?.alt === 'string' ? req.body.alt.slice(0, 200) : '',
      uploadedBy: req.user?._id,
    });
    res.status(201).json({ success: true, message: 'File uploaded', data: media });
  } catch (err) {
    await fs.unlink(file.path).catch(() => {}); // don't leave orphan files behind
    throw err;
  }
};

// DELETE /api/media/:id  - removes the database entry AND the file on disk
export const remove = async (req, res) => {
  const media = isObjectId(req.params.id) ? await Media.findByIdAndDelete(req.params.id) : null;
  if (!media) throw new ApiError(404, 'Media not found');

  // basename() guarantees we only ever delete inside the uploads folder
  await fs.unlink(path.join(UPLOAD_DIR, path.basename(media.filename))).catch((err) => {
    if (err.code !== 'ENOENT') throw err;
  });

  res.json({ success: true, message: 'Media deleted', data: { _id: media._id } });
};

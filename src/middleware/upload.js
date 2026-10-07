import path from 'node:path';
import multer from 'multer';
import sharp from 'sharp';
import {
  ALLOWED_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
  MAX_IMAGE_DIMENSION,
  IMAGE_QUALITY,
} from '../config/uploads.js';
import { ApiError } from '../utils/ApiError.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// Files are held in memory (they are small, see the size limits) so they can be
// checked and optimized before anything is stored.
const storage = multer.memoryStorage();

// First check: mime type and extension must both be on the allow list.
const fileFilter = (kind) => (req, file, cb) => {
  const allowed = ALLOWED_TYPES[kind];
  const ext = path.extname(file.originalname).toLowerCase();

  if (!allowed[file.mimetype]?.includes(ext)) {
    const list = Object.values(allowed).flat().join(', ');
    return cb(new ApiError(400, `Only these file types are allowed: ${list}`));
  }
  cb(null, true);
};

// Second check: the browser-reported mime type can be faked, so look at the
// file's first bytes ("magic numbers") to confirm it really is what it claims.
const SIGNATURES = {
  'image/jpeg': (b) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff,
  'image/png': (b) => b.subarray(0, 8).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])),
  'image/gif': (b) => b.subarray(0, 4).toString('latin1') === 'GIF8',
  'image/webp': (b) =>
    b.subarray(0, 4).toString('latin1') === 'RIFF' && b.subarray(8, 12).toString('latin1') === 'WEBP',
  'image/avif': (b) => b.subarray(4, 8).toString('latin1') === 'ftyp',
  'application/pdf': (b) => b.subarray(0, 5).toString('latin1') === '%PDF-',
};

const verifySignature = (req, res, next) => {
  if (!req.file) return next(new ApiError(400, 'No file uploaded. Send it in a field named "file".'));

  if (!SIGNATURES[req.file.mimetype]?.(req.file.buffer)) {
    return next(new ApiError(400, 'File content does not match its type'));
  }
  next();
};

// Photos straight from a camera are far bigger than a web page needs. Every image is
// rotated upright, shrunk to fit MAX_IMAGE_DIMENSION, stripped of metadata (EXIF can hold
// GPS coordinates) and saved as WebP. GIFs are left alone so animations keep working.
const optimizeImage = asyncHandler(async (req, res, next) => {
  const { file } = req;
  file.ext = path.extname(file.originalname).toLowerCase();

  if (!file.mimetype.startsWith('image/')) return next();

  try {
    if (file.mimetype === 'image/gif') {
      const { width, height } = await sharp(file.buffer).metadata();
      Object.assign(file, { width, height });
      return next();
    }

    const { data, info } = await sharp(file.buffer)
      .rotate() // apply the EXIF orientation before the metadata is dropped
      .resize({
        width: MAX_IMAGE_DIMENSION,
        height: MAX_IMAGE_DIMENSION,
        fit: 'inside',
        withoutEnlargement: true,
      })
      .webp({ quality: IMAGE_QUALITY })
      .toBuffer({ resolveWithObject: true });

    Object.assign(file, {
      buffer: data,
      size: info.size,
      mimetype: 'image/webp',
      ext: '.webp',
      width: info.width,
      height: info.height,
    });
  } catch {
    throw new ApiError(400, 'This image could not be read. It may be damaged.');
  }
  next();
});

const uploader = (kind, maxSize) => [
  multer({ storage, fileFilter: fileFilter(kind), limits: { fileSize: maxSize, files: 1 } }).single('file'),
  verifySignature,
  optimizeImage,
];

// Usage: router.post('/image', protect, ...uploadImage, handler)
export const uploadImage = uploader('image', MAX_IMAGE_SIZE);
export const uploadDocument = uploader('document', MAX_DOCUMENT_SIZE);

import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import multer from 'multer';
import {
  UPLOAD_DIR,
  ALLOWED_TYPES,
  MAX_IMAGE_SIZE,
  MAX_DOCUMENT_SIZE,
} from '../config/uploads.js';
import { ApiError } from '../utils/ApiError.js';

fs.mkdirSync(UPLOAD_DIR, { recursive: true });

// Files get a random name so uploads can't overwrite each other or use odd characters.
// e.g. "1727712345678-9f86d081884c7d65.png"
const storage = multer.diskStorage({
  destination: UPLOAD_DIR,
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase();
    cb(null, `${Date.now()}-${crypto.randomBytes(8).toString('hex')}${ext}`);
  },
});

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

const verifySignature = async (req, res, next) => {
  if (!req.file) return next(new ApiError(400, 'No file uploaded. Send it in a field named "file".'));

  const handle = await fs.promises.open(req.file.path, 'r');
  const header = Buffer.alloc(16);
  try {
    await handle.read(header, 0, 16, 0);
  } finally {
    await handle.close();
  }

  if (!SIGNATURES[req.file.mimetype]?.(header)) {
    await fs.promises.unlink(req.file.path).catch(() => {});
    return next(new ApiError(400, 'File content does not match its type'));
  }
  next();
};

const uploader = (kind, maxSize) => [
  multer({ storage, fileFilter: fileFilter(kind), limits: { fileSize: maxSize, files: 1 } }).single('file'),
  verifySignature,
];

// Usage: router.post('/image', protect, ...uploadImage, handler)
export const uploadImage = uploader('image', MAX_IMAGE_SIZE);
export const uploadDocument = uploader('document', MAX_DOCUMENT_SIZE);

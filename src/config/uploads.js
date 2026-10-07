import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Uploads are served publicly at /uploads/<filename>. With UPLOAD_STORAGE=local the files
// live in <repo>/uploads (UPLOAD_DIR can point at a persistent disk instead).
export const UPLOAD_DIR = process.env.UPLOAD_DIR
  ? path.resolve(process.env.UPLOAD_DIR)
  : path.join(__dirname, '..', '..', 'uploads');
export const UPLOAD_URL_PREFIX = '/uploads';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB

// Uploaded images are shrunk to fit inside this many pixels and saved as WebP.
export const MAX_IMAGE_DIMENSION = 2000;
export const IMAGE_QUALITY = 82;

// What each upload endpoint accepts: mime type -> allowed file extensions.
// SVG is left out on purpose: it can contain JavaScript (XSS).
export const ALLOWED_TYPES = {
  image: {
    'image/jpeg': ['.jpg', '.jpeg'],
    'image/png': ['.png'],
    'image/webp': ['.webp'],
    'image/gif': ['.gif'],
    'image/avif': ['.avif'],
  },
  document: {
    'application/pdf': ['.pdf'],
  },
};

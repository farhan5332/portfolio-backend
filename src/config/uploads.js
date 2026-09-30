import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Local file storage: <repo>/uploads, served publicly at /uploads/<filename>
export const UPLOAD_DIR = path.join(__dirname, '..', '..', 'uploads');
export const UPLOAD_URL_PREFIX = '/uploads';

export const MAX_IMAGE_SIZE = 5 * 1024 * 1024; // 5 MB
export const MAX_DOCUMENT_SIZE = 10 * 1024 * 1024; // 10 MB

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

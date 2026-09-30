import { Router } from 'express';
import * as mediaController from '../controllers/media.controller.js';
import { protect } from '../middleware/auth.js';
import { uploadImage, uploadDocument } from '../middleware/upload.js';
import { asyncHandler } from '../utils/asyncHandler.js';

// multipart/form-data with the file in a field named "file" (optional field "alt")
//   POST /api/upload/image      jpg, png, webp, gif, avif  (max 5 MB)
//   POST /api/upload/document   pdf, e.g. a resume          (max 10 MB)
const router = Router();

router.post('/image', protect, ...uploadImage, asyncHandler(mediaController.create('image')));
router.post('/document', protect, ...uploadDocument, asyncHandler(mediaController.create('document')));

export default router;

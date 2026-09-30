import { Router } from 'express';
import { z } from 'zod';
import * as mediaController from '../controllers/media.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { text } from '../validators/common.js';

// Media library for the admin panel (all admin only).
//   GET    /api/media?kind=image&q=logo&page=2
//   GET    /api/media/:id
//   PUT    /api/media/:id      { alt }
//   DELETE /api/media/:id      also deletes the file
const router = Router();

router.use(protect);

router.get('/', asyncHandler(mediaController.list));
router.get('/:idOrSlug', asyncHandler(mediaController.getOne));
router.put('/:id', validate(z.object({ alt: text(200, 'Alt text') })), asyncHandler(mediaController.update));
router.delete('/:id', asyncHandler(mediaController.remove));

export default router;

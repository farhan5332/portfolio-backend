import { Router } from 'express';
import { getStats } from '../controllers/stats.controller.js';
import { protect } from '../middleware/auth.js';
import { asyncHandler } from '../utils/asyncHandler.js';

const router = Router();

router.get('/', protect, asyncHandler(getStats));

export default router;

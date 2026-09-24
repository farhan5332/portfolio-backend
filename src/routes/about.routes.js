import { Router } from 'express';
import * as aboutController from '../controllers/about.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { updateAboutSchema } from '../validators/about.validator.js';

// About is a singleton: no list, no ids, no delete.
const router = Router();

router.get('/', asyncHandler(aboutController.getAbout));
router.put('/', protect, validate(updateAboutSchema), asyncHandler(aboutController.updateAbout));

export default router;

import { Router } from 'express';
import * as contactController from '../controllers/contact.controller.js';
import { protect } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { contactLimiter } from '../middleware/rateLimiter.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { contactSchema, updateMessageSchema } from '../validators/contact.validator.js';

// Contact form + admin inbox.
//   POST   /api/contact                public   { name, email, subject?, message }
//   GET    /api/contact?read=false&q=  admin    list messages, newest first
//   GET    /api/contact/:id            admin
//   PUT    /api/contact/:id            admin    { read: true }
//   DELETE /api/contact/:id            admin
const router = Router();

router.post('/', contactLimiter, validate(contactSchema), asyncHandler(contactController.submit));

router.use(protect);

router.get('/', asyncHandler(contactController.list));
router.get('/:idOrSlug', asyncHandler(contactController.getOne));
router.put('/:id', validate(updateMessageSchema), asyncHandler(contactController.update));
router.delete('/:id', asyncHandler(contactController.remove));

export default router;

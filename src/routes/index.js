import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';
import aboutRoutes from './about.routes.js';
import skillRoutes from './skill.routes.js';
import projectRoutes from './project.routes.js';
import blogRoutes from './blog.routes.js';
import experienceRoutes from './experience.routes.js';
import testimonialRoutes from './testimonial.routes.js';
import serviceRoutes from './service.routes.js';
import statsRoutes from './stats.routes.js';
import uploadRoutes from './upload.routes.js';
import mediaRoutes from './media.routes.js';
import contactRoutes from './contact.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Content (GET = public, POST/PUT/DELETE = admin only)
router.use('/about', aboutRoutes);
router.use('/skills', skillRoutes);
router.use('/projects', projectRoutes);
router.use('/blogs', blogRoutes);
router.use('/experience', experienceRoutes);
router.use('/testimonials', testimonialRoutes);
router.use('/services', serviceRoutes);

// Admin dashboard
router.use('/stats', statsRoutes);

// File uploads + media library (admin only)
router.use('/upload', uploadRoutes);
router.use('/media', mediaRoutes);

// Contact form (POST = public, inbox = admin only)
router.use('/contact', contactRoutes);

export default router;

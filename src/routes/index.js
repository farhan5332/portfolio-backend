import { Router } from 'express';
import healthRoutes from './health.routes.js';
import authRoutes from './auth.routes.js';

const router = Router();

router.use('/health', healthRoutes);
router.use('/auth', authRoutes);

// Day 3:  router.use('/about', aboutRoutes);
//         router.use('/skills', skillRoutes);
//         router.use('/projects', projectRoutes);
//         router.use('/blogs', blogRoutes);
//         router.use('/experience', experienceRoutes);
//         router.use('/testimonials', testimonialRoutes);
//         router.use('/services', serviceRoutes);
// Day 4:  router.use('/upload', uploadRoutes);
// Day 11: router.use('/contact', contactRoutes);

export default router;

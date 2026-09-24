import { z } from 'zod';
import { text, requiredText, image, order } from './common.js';

export const createTestimonialSchema = z.object({
  name: requiredText(100, 'Name'),
  role: text(100, 'Role').optional(),
  company: text(100, 'Company').optional(),
  avatar: image.optional(),
  content: requiredText(1000, 'Content'),
  rating: z.coerce.number().int().min(1).max(5, 'Rating must be between 1 and 5').optional(),
  featured: z.boolean().optional(),
  order: order.optional(),
});

export const updateTestimonialSchema = createTestimonialSchema.partial();

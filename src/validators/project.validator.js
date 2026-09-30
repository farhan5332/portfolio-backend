import { z } from 'zod';
import { text, requiredText, url, image, stringList, order, nullableDate } from './common.js';

export const createProjectSchema = z.object({
  title: requiredText(120, 'Title'),
  summary: text(300, 'Summary').optional(),
  description: z.string().max(20000, 'Description is too long').optional(),
  coverImage: image.optional(),
  gallery: z.array(image).max(20).optional(),
  techStack: stringList(30, 40).optional(),
  category: text(40, 'Category').optional(),
  liveUrl: url.optional(),
  repoUrl: url.optional(),
  featured: z.boolean().optional(),
  status: z.enum(['draft', 'published']).optional(),
  startDate: nullableDate.optional(), // null clears the date
  endDate: nullableDate.optional(),
  order: order.optional(),
});

export const updateProjectSchema = createProjectSchema.partial();

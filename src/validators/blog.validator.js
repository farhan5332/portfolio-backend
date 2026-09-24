import { z } from 'zod';
import { text, requiredText, image, stringList, date } from './common.js';

export const createBlogSchema = z.object({
  title: requiredText(150, 'Title'),
  excerpt: text(300, 'Excerpt').optional(),
  content: z.string().max(100000, 'Content is too long').optional(),
  coverImage: image.optional(),
  tags: stringList(20, 30).optional(),
  featured: z.boolean().optional(),
  status: z.enum(['draft', 'published']).optional(),
  publishedAt: date.optional(),
});

export const updateBlogSchema = createBlogSchema.partial();

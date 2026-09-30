import { z } from 'zod';
import { text, requiredText, stringList, order, date, nullableDate } from './common.js';

export const createExperienceSchema = z.object({
  type: z.enum(['work', 'education']).optional(),
  title: requiredText(120, 'Title'),
  organization: requiredText(120, 'Organization'),
  location: text(100, 'Location').optional(),
  description: z.string().max(5000, 'Description is too long').optional(),
  highlights: stringList(20, 200).optional(),
  startDate: date,
  endDate: nullableDate.optional(), // null = still there ("Present")
  current: z.boolean().optional(),
  order: order.optional(),
});

export const updateExperienceSchema = createExperienceSchema.partial();

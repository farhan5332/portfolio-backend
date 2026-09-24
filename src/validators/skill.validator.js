import { z } from 'zod';
import { text, requiredText, order } from './common.js';

export const createSkillSchema = z.object({
  name: requiredText(50, 'Name'),
  category: text(40, 'Category').optional(),
  level: z.coerce.number().min(0).max(100, 'Level must be between 0 and 100').optional(),
  icon: text(100, 'Icon').optional(),
  order: order.optional(),
});

export const updateSkillSchema = createSkillSchema.partial();

import { z } from 'zod';
import { text, requiredText, stringList, order } from './common.js';

export const createServiceSchema = z.object({
  title: requiredText(100, 'Title'),
  description: text(1000, 'Description').optional(),
  icon: text(100, 'Icon').optional(),
  features: stringList(20, 100).optional(),
  priceLabel: text(50, 'Price label').optional(),
  order: order.optional(),
});

export const updateServiceSchema = createServiceSchema.partial();

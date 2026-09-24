import { z } from 'zod';
import { isObjectId } from '../utils/objectId.js';

// NOTE: no .default() here on purpose - Mongoose applies defaults, and update
// schemas use .partial(), where defaults would overwrite fields the client didn't send.

export const objectId = z.string().refine(isObjectId, 'Invalid id');

export const text = (max, label = 'This field') =>
  z.string().trim().max(max, `${label} must be at most ${max} characters`);

export const requiredText = (max, label) =>
  z
    .string({ error: `${label} is required` })
    .trim()
    .min(1, `${label} is required`)
    .max(max, `${label} must be at most ${max} characters`);

// Empty string is allowed so a link can be cleared from the admin panel.
export const url = z
  .string()
  .trim()
  .refine((v) => v === '' || URL.canParse(v), 'Must be a valid URL (https://...)');

// Images may also be local uploads like "/uploads/abc.png"
export const imageUrl = z
  .string()
  .trim()
  .refine((v) => v === '' || v.startsWith('/') || URL.canParse(v), 'Must be a valid image URL');

export const image = z.object({
  url: imageUrl.optional(),
  alt: text(200, 'Alt text').optional(),
});

export const stringList = (maxItems = 30, maxLength = 50) =>
  z.array(z.string().trim().min(1).max(maxLength)).max(maxItems);

export const order = z.coerce.number().int().min(0);

export const date = z.coerce.date({ error: 'Invalid date' });

// PUT /api/<resource>/reorder   body: { items: [{ id, order }] }
export const reorderSchema = z.object({
  items: z
    .array(z.object({ id: objectId, order }))
    .min(1, 'Nothing to reorder')
    .max(500),
});

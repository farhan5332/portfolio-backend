import { z } from 'zod';
import { text, requiredText, url, image } from './common.js';

// About is a singleton, so there is only an "update" (upsert) schema.
// name is required only when the document is first created (checked in the controller).
export const updateAboutSchema = z.object({
  name: requiredText(100, 'Name').optional(),
  headline: text(150, 'Headline').optional(),
  shortBio: text(300, 'Short bio').optional(),
  bio: z.string().max(10000, 'Bio is too long').optional(),
  avatar: image.optional(),
  resumeUrl: z
    .string()
    .trim()
    .refine((v) => v === '' || v.startsWith('/') || URL.canParse(v), 'Must be a valid URL')
    .optional(),
  email: z
    .string()
    .trim()
    .toLowerCase()
    .refine((v) => v === '' || z.email().safeParse(v).success, 'Enter a valid email address')
    .optional(),
  phone: text(30, 'Phone').optional(),
  location: text(100, 'Location').optional(),
  availableForWork: z.boolean().optional(),
  socials: z
    .array(z.object({ platform: requiredText(30, 'Platform'), url }))
    .max(20)
    .optional(),
  stats: z
    .array(z.object({ label: requiredText(50, 'Label'), value: requiredText(20, 'Value') }))
    .max(10)
    .optional(),
});

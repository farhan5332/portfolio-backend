import { z } from 'zod';
import { text, requiredText } from './common.js';

// POST /api/contact  (public contact form)
export const contactSchema = z.object({
  name: requiredText(100, 'Name'),
  email: z.email({ error: 'Enter a valid email address' }).max(200),
  subject: text(150, 'Subject').optional(),
  message: requiredText(5000, 'Message').min(10, 'Message must be at least 10 characters'),
  // Honeypot: hidden in the form, so real visitors leave it empty. Bots fill it in.
  website: z.string().max(500).optional(),
});

// PUT /api/contact/:id  (admin: mark as read / unread)
export const updateMessageSchema = z.object({
  read: z.boolean({ error: 'read must be true or false' }),
});

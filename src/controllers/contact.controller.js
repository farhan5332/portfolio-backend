import { Message } from '../models/index.js';
import { sendContactNotification } from '../services/email.service.js';
import { createCrudController } from './crud.factory.js';

// list / getOne / update (read flag) / remove for the admin inbox come from the shared CRUD factory.
const crud = createCrudController({
  model: Message,
  name: 'Message',
  filters: { read: { type: 'boolean' } },
  searchFields: ['name', 'email', 'subject', 'message'],
  sortFields: ['createdAt'],
  defaultSort: { createdAt: -1 },
  defaultLimit: 20,
});

export const { list, getOne, update, remove } = crud;

// POST /api/contact  (public) - saves the message, then emails the site owner
export const submit = async (req, res) => {
  const { website, ...data } = req.body;
  const reply = { success: true, message: "Thanks! Your message has been sent. I'll get back to you soon." };

  // Honeypot was filled in -> a bot. Pretend it worked so it doesn't try again.
  if (website) return res.status(201).json(reply);

  const message = await Message.create(data);
  res.status(201).json(reply);

  // The visitor doesn't wait for the email. If it fails, the message is still in the inbox.
  try {
    if (await sendContactNotification(message)) {
      await Message.updateOne({ _id: message._id }, { emailSent: true });
    }
  } catch (err) {
    console.error('📧 Could not send contact notification:', err.message);
  }
};

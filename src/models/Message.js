import mongoose from 'mongoose';
import { schemaOptions } from './shared.js';

// One document per contact form submission.
const messageSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, 'Name is required'], maxlength: 100 },
    email: { type: String, trim: true, lowercase: true, required: [true, 'Email is required'] },
    subject: { type: String, trim: true, default: '', maxlength: 150 },
    message: { type: String, trim: true, required: [true, 'Message is required'], maxlength: 5000 },
    read: { type: Boolean, default: false },
    emailSent: { type: Boolean, default: false }, // did the notification email go out?
  },
  schemaOptions
);

messageSchema.index({ read: 1, createdAt: -1 });

export const Message = mongoose.model('Message', messageSchema);

import mongoose from 'mongoose';
import { imageSchema, schemaOptions } from './shared.js';

const testimonialSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, 'Name is required'], maxlength: 100 },
    role: { type: String, trim: true, default: '', maxlength: 100 },
    company: { type: String, trim: true, default: '', maxlength: 100 },
    avatar: { type: imageSchema, default: () => ({}) },
    content: { type: String, trim: true, required: [true, 'Content is required'], maxlength: 1000 },
    rating: { type: Number, min: 1, max: 5, default: 5 },
    featured: { type: Boolean, default: false },
    order: { type: Number, default: 0 },
  },
  schemaOptions
);

testimonialSchema.index({ featured: -1, order: 1 });

export const Testimonial = mongoose.model('Testimonial', testimonialSchema);

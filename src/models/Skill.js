import mongoose from 'mongoose';
import { schemaOptions } from './shared.js';

const skillSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, 'Name is required'], maxlength: 50 },
    category: { type: String, trim: true, default: 'Other', maxlength: 40 }, // Frontend, Backend...
    level: { type: Number, min: 0, max: 100, default: 50 }, // percentage for progress bars
    icon: { type: String, trim: true, default: '' },
    order: { type: Number, default: 0 },
  },
  schemaOptions
);

skillSchema.index({ category: 1, order: 1 });

export const Skill = mongoose.model('Skill', skillSchema);

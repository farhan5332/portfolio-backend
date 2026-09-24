import mongoose from 'mongoose';
import { schemaOptions } from './shared.js';

const experienceSchema = new mongoose.Schema(
  {
    type: { type: String, enum: ['work', 'education'], default: 'work' },
    title: { type: String, trim: true, required: [true, 'Title is required'], maxlength: 120 },
    organization: {
      type: String,
      trim: true,
      required: [true, 'Organization is required'],
      maxlength: 120,
    },
    location: { type: String, trim: true, default: '' },
    description: { type: String, default: '', maxlength: 5000 },
    highlights: { type: [String], default: [] },
    startDate: { type: Date, required: [true, 'Start date is required'] },
    endDate: Date,
    current: { type: Boolean, default: false }, // "Present"
    order: { type: Number, default: 0 },
  },
  schemaOptions
);

experienceSchema.index({ type: 1, startDate: -1 });

export const Experience = mongoose.model('Experience', experienceSchema);

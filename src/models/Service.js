import mongoose from 'mongoose';
import { schemaOptions } from './shared.js';

const serviceSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: [true, 'Title is required'], maxlength: 100 },
    description: { type: String, trim: true, default: '', maxlength: 1000 },
    icon: { type: String, trim: true, default: '' }, // icon name, e.g. "code"
    features: { type: [String], default: [] },
    priceLabel: { type: String, trim: true, default: '' }, // "From $499"
    order: { type: Number, default: 0 },
  },
  schemaOptions
);

serviceSchema.index({ order: 1 });

export const Service = mongoose.model('Service', serviceSchema);

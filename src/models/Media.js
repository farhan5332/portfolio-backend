import mongoose from 'mongoose';
import { schemaOptions } from './shared.js';

// One document per uploaded file. The file itself is kept by services/storage.service.js.
const mediaSchema = new mongoose.Schema(
  {
    kind: { type: String, enum: ['image', 'document'], required: true },
    filename: { type: String, required: true, unique: true }, // name in storage
    originalName: { type: String, trim: true, default: '' }, // name on the admin's computer
    url: { type: String, required: true }, // "/uploads/<filename>"
    mimeType: { type: String, required: true },
    size: { type: Number, required: true }, // bytes
    width: Number, // pixels (images only)
    height: Number,
    alt: { type: String, trim: true, default: '', maxlength: 200 },
    uploadedBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  },
  schemaOptions
);

mediaSchema.index({ kind: 1, createdAt: -1 });

export const Media = mongoose.model('Media', mediaSchema, 'media');

import mongoose from 'mongoose';

// Reusable image sub-document: { url, alt }
export const imageSchema = new mongoose.Schema(
  {
    url: { type: String, trim: true, default: '' },
    alt: { type: String, trim: true, default: '', maxlength: 200 },
  },
  { _id: false }
);

// Common options for every content model
export const schemaOptions = {
  timestamps: true, // adds createdAt + updatedAt automatically
  toJSON: {
    virtuals: true,
    transform(doc, ret) {
      delete ret.__v;
      delete ret.id; // keep only _id
      return ret;
    },
  },
};

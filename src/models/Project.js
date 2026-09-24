import mongoose from 'mongoose';
import { imageSchema, schemaOptions } from './shared.js';
import { slugPlugin } from './plugins/slug.plugin.js';

const projectSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: [true, 'Title is required'], maxlength: 120 },
    summary: { type: String, trim: true, default: '', maxlength: 300 }, // card text
    description: { type: String, default: '', maxlength: 20000 }, // detail page (markdown)
    coverImage: { type: imageSchema, default: () => ({}) },
    gallery: { type: [imageSchema], default: [] },
    techStack: { type: [String], default: [] },
    category: { type: String, trim: true, default: '', maxlength: 40 }, // Web App, Mobile...
    liveUrl: { type: String, trim: true, default: '' },
    repoUrl: { type: String, trim: true, default: '' },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    startDate: Date,
    endDate: Date,
    order: { type: Number, default: 0 },
  },
  schemaOptions
);

projectSchema.plugin(slugPlugin, { source: 'title' });
projectSchema.index({ status: 1, order: 1 });

export const Project = mongoose.model('Project', projectSchema);

import mongoose from 'mongoose';
import { imageSchema, schemaOptions } from './shared.js';
import { slugPlugin } from './plugins/slug.plugin.js';

const blogSchema = new mongoose.Schema(
  {
    title: { type: String, trim: true, required: [true, 'Title is required'], maxlength: 150 },
    excerpt: { type: String, trim: true, default: '', maxlength: 300 }, // list/card text
    content: { type: String, default: '', maxlength: 100000 }, // markdown
    coverImage: { type: imageSchema, default: () => ({}) },
    tags: { type: [String], default: [] },
    featured: { type: Boolean, default: false },
    status: { type: String, enum: ['draft', 'published'], default: 'draft' },
    publishedAt: Date,
    readingTime: { type: Number, default: 1 }, // minutes
  },
  schemaOptions
);

blogSchema.plugin(slugPlugin, { source: 'title' });
blogSchema.index({ status: 1, publishedAt: -1 });

blogSchema.pre('save', function () {
  if (this.isModified('content')) {
    const words = this.content.trim().split(/\s+/).filter(Boolean).length;
    this.readingTime = Math.max(1, Math.ceil(words / 200));
  }
  // first time it goes live, remember when
  if (this.status === 'published' && !this.publishedAt) this.publishedAt = new Date();
});

export const Blog = mongoose.model('Blog', blogSchema);

import mongoose from 'mongoose';
import { imageSchema, schemaOptions } from './shared.js';

// Singleton: there is only ever ONE About document.
const aboutSchema = new mongoose.Schema(
  {
    name: { type: String, trim: true, required: [true, 'Name is required'], maxlength: 100 },
    headline: { type: String, trim: true, default: '', maxlength: 150 }, // "Full-Stack Developer"
    shortBio: { type: String, trim: true, default: '', maxlength: 300 }, // hero section
    bio: { type: String, default: '', maxlength: 10000 }, // about page (markdown allowed)
    avatar: { type: imageSchema, default: () => ({}) },
    resumeUrl: { type: String, trim: true, default: '' },
    email: { type: String, trim: true, lowercase: true, default: '' },
    phone: { type: String, trim: true, default: '' },
    location: { type: String, trim: true, default: '' },
    availableForWork: { type: Boolean, default: true },
    socials: [
      {
        _id: false,
        platform: { type: String, trim: true, required: true }, // github, linkedin, x...
        url: { type: String, trim: true, required: true },
      },
    ],
    stats: [
      {
        _id: false,
        label: { type: String, trim: true, required: true }, // "Years experience"
        value: { type: String, trim: true, required: true }, // "3+"
      },
    ],
  },
  schemaOptions
);

export const About = mongoose.model('About', aboutSchema, 'about');

import { createCrudRouter } from './crud.router.js';
import { Testimonial } from '../models/index.js';
import {
  createTestimonialSchema,
  updateTestimonialSchema,
} from '../validators/testimonial.validator.js';

// GET /api/testimonials?featured=true
export default createCrudRouter({
  model: Testimonial,
  name: 'Testimonial',
  createSchema: createTestimonialSchema,
  updateSchema: updateTestimonialSchema,
  reorderable: true,
  filters: {
    featured: { type: 'boolean' },
  },
  searchFields: ['name', 'company', 'content'],
  sortFields: ['order', 'rating', 'createdAt'],
  defaultSort: { featured: -1, order: 1 },
  defaultLimit: 50,
});

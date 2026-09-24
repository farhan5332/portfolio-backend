import { createCrudRouter } from './crud.router.js';
import { Experience } from '../models/index.js';
import {
  createExperienceSchema,
  updateExperienceSchema,
} from '../validators/experience.validator.js';

// GET /api/experience?type=work
export default createCrudRouter({
  model: Experience,
  name: 'Experience',
  createSchema: createExperienceSchema,
  updateSchema: updateExperienceSchema,
  reorderable: true,
  filters: {
    type: { type: 'string' },
    current: { type: 'boolean' },
  },
  searchFields: ['title', 'organization'],
  sortFields: ['startDate', 'endDate', 'order', 'createdAt'],
  defaultSort: { startDate: -1 }, // newest first, like a CV
  defaultLimit: 50,
});

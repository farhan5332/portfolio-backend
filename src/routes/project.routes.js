import { createCrudRouter } from './crud.router.js';
import { Project } from '../models/index.js';
import { createProjectSchema, updateProjectSchema } from '../validators/project.validator.js';

// GET /api/projects?featured=true&category=Web%20App&tech=react&q=cms
// GET /api/projects/portfolio-cms
export default createCrudRouter({
  model: Project,
  name: 'Project',
  createSchema: createProjectSchema,
  updateSchema: updateProjectSchema,
  reorderable: true,
  publicFilter: { status: 'published' },
  filters: {
    category: { type: 'lowercase' },
    tech: { field: 'techStack', type: 'lowercase' },
    featured: { type: 'boolean' },
    status: { type: 'string', adminOnly: true },
  },
  searchFields: ['title', 'summary', 'techStack'],
  sortFields: ['order', 'createdAt', 'updatedAt', 'title', 'startDate'],
  defaultSort: { order: 1, createdAt: -1 },
  defaultLimit: 12,
  listSelect: '-description', // full description only on the detail page
  slugLookup: true,
});

import { createCrudRouter } from './crud.router.js';
import { Service } from '../models/index.js';
import { createServiceSchema, updateServiceSchema } from '../validators/service.validator.js';

// GET /api/services
export default createCrudRouter({
  model: Service,
  name: 'Service',
  createSchema: createServiceSchema,
  updateSchema: updateServiceSchema,
  reorderable: true,
  searchFields: ['title', 'description'],
  sortFields: ['order', 'title', 'createdAt'],
  defaultSort: { order: 1 },
  defaultLimit: 50,
});

import { createCrudRouter } from './crud.router.js';
import { Skill } from '../models/index.js';
import { createSkillSchema, updateSkillSchema } from '../validators/skill.validator.js';

// GET /api/skills?category=Frontend
export default createCrudRouter({
  model: Skill,
  name: 'Skill',
  createSchema: createSkillSchema,
  updateSchema: updateSkillSchema,
  reorderable: true,
  filters: {
    category: { type: 'lowercase' },
  },
  searchFields: ['name', 'category'],
  sortFields: ['order', 'category', 'name', 'level', 'createdAt'],
  defaultSort: { category: 1, order: 1 },
  defaultLimit: 100, // the site usually shows all skills at once
});

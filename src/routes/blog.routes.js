import { createCrudRouter } from './crud.router.js';
import { Blog } from '../models/index.js';
import { createBlogSchema, updateBlogSchema } from '../validators/blog.validator.js';

// GET /api/blogs?page=2&limit=10&tag=react&q=nextjs
// GET /api/blogs/my-first-post
export default createCrudRouter({
  model: Blog,
  name: 'Blog post',
  createSchema: createBlogSchema,
  updateSchema: updateBlogSchema,
  publicFilter: { status: 'published' },
  filters: {
    tag: { field: 'tags', type: 'lowercase' },
    featured: { type: 'boolean' },
    status: { type: 'string', adminOnly: true },
  },
  searchFields: ['title', 'excerpt', 'tags'],
  sortFields: ['publishedAt', 'createdAt', 'updatedAt', 'title'],
  defaultSort: { publishedAt: -1, createdAt: -1 },
  defaultLimit: 10,
  listSelect: '-content', // full content only on the detail page
  slugLookup: true,
});

import { Router } from 'express';
import { createCrudController } from '../controllers/crud.factory.js';
import { protect, optionalAuth } from '../middleware/auth.js';
import { validate } from '../middleware/validate.js';
import { asyncHandler } from '../utils/asyncHandler.js';
import { reorderSchema } from '../validators/common.js';

/**
 * Standard REST routes for one content type:
 *   GET    /             public   list (published/visible only, unless admin)
 *   GET    /:idOrSlug    public   one item
 *   POST   /             admin    create
 *   PUT    /reorder      admin    bulk update "order" (only if reorderable)
 *   PUT    /:id          admin    update
 *   DELETE /:id          admin    delete
 */
export const createCrudRouter = ({
  createSchema,
  updateSchema,
  reorderable = false,
  ...config
}) => {
  const router = Router();
  const c = createCrudController(config);

  router.get('/', optionalAuth, asyncHandler(c.list));
  router.post('/', protect, validate(createSchema), asyncHandler(c.create));

  // Must come before "/:id" so "reorder" isn't treated as an id
  if (reorderable) {
    router.put('/reorder', protect, validate(reorderSchema), asyncHandler(c.reorder));
  }

  router.get('/:idOrSlug', optionalAuth, asyncHandler(c.getOne));
  router.put('/:id', protect, validate(updateSchema), asyncHandler(c.update));
  router.delete('/:id', protect, asyncHandler(c.remove));

  return router;
};

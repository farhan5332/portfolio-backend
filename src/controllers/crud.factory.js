import { ApiError } from '../utils/ApiError.js';
import { isObjectId } from '../utils/objectId.js';
import { parsePagination, parseSort, parseFilters, parseSearch } from '../utils/queryParser.js';

/**
 * Builds list / getOne / create / update / remove / reorder handlers for a model.
 *
 * config = {
 *   model,           Mongoose model
 *   name,            "Project" (used in messages)
 *   publicFilter,    what visitors may see, e.g. { status: 'published' }
 *   filters,         allowed query filters (see utils/queryParser.js)
 *   searchFields,    fields searched by ?q=
 *   sortFields,      fields allowed in ?sort=
 *   defaultSort,     e.g. { order: 1, createdAt: -1 }
 *   defaultLimit,    page size when ?limit is not given
 *   listSelect,      fields to hide in lists, e.g. '-content' (heavy fields)
 *   slugLookup,      true -> GET /:idOrSlug also accepts a slug
 * }
 */
export const createCrudController = (config) => {
  const {
    model: Model,
    name,
    publicFilter = {},
    filters = {},
    searchFields = [],
    sortFields = ['createdAt'],
    defaultSort = { createdAt: -1 },
    defaultLimit = 20,
    listSelect = '',
    slugLookup = false,
  } = config;

  // Visitors only see public items; the logged-in admin sees everything.
  const visibility = (req) => (req.user ? {} : publicFilter);

  // GET /api/<resource>
  const list = async (req, res) => {
    const { page, limit, skip } = parsePagination(req.query, defaultLimit);
    const filter = {
      ...parseFilters(req.query, filters, Boolean(req.user)),
      ...parseSearch(req.query.q, searchFields),
      ...visibility(req),
    };
    // _id as a final tiebreaker keeps pagination stable when items share the same order value
    const sort = { ...parseSort(req.query.sort, sortFields, defaultSort), _id: 1 };

    const [items, total] = await Promise.all([
      Model.find(filter).sort(sort).skip(skip).limit(limit).select(listSelect),
      Model.countDocuments(filter),
    ]);

    res.json({
      success: true,
      data: items,
      meta: { page, limit, total, totalPages: Math.max(1, Math.ceil(total / limit)) },
    });
  };

  // GET /api/<resource>/:idOrSlug
  const getOne = async (req, res) => {
    const { idOrSlug } = req.params;
    let filter;

    if (isObjectId(idOrSlug)) filter = { _id: idOrSlug };
    else if (slugLookup) filter = { slug: idOrSlug.toLowerCase() };
    else throw new ApiError(400, `Invalid ${name.toLowerCase()} id`);

    const item = await Model.findOne({ ...filter, ...visibility(req) });
    if (!item) throw new ApiError(404, `${name} not found`);

    res.json({ success: true, data: item });
  };

  // POST /api/<resource>
  const create = async (req, res) => {
    const item = await Model.create(req.body);
    res.status(201).json({ success: true, message: `${name} created`, data: item });
  };

  // PUT /api/<resource>/:id  (partial update: only the fields you send change)
  const update = async (req, res) => {
    const item = isObjectId(req.params.id) ? await Model.findById(req.params.id) : null;
    if (!item) throw new ApiError(404, `${name} not found`);

    item.set(req.body);
    await item.save(); // runs validation + hooks (slug, reading time...)

    res.json({ success: true, message: `${name} updated`, data: item });
  };

  // DELETE /api/<resource>/:id
  const remove = async (req, res) => {
    const item = isObjectId(req.params.id) ? await Model.findByIdAndDelete(req.params.id) : null;
    if (!item) throw new ApiError(404, `${name} not found`);

    res.json({ success: true, message: `${name} deleted`, data: { _id: item._id } });
  };

  // PUT /api/<resource>/reorder  body: { items: [{ id, order }] }  (drag & drop in admin)
  const reorder = async (req, res) => {
    const result = await Model.bulkWrite(
      req.body.items.map(({ id, order }) => ({
        updateOne: { filter: { _id: id }, update: { $set: { order } } },
      }))
    );
    res.json({
      success: true,
      message: `${name} order updated`,
      data: { matched: result.matchedCount, modified: result.modifiedCount },
    });
  };

  return { list, getOne, create, update, remove, reorder };
};

// Turns URL query params into safe Mongo filter / sort / pagination objects.
// Only whitelisted fields are ever used, so clients can't query arbitrary fields.

const MAX_LIMIT = 100;

// ?tag=a&tag=b arrives as an array - we only use the first value
const first = (value) => (Array.isArray(value) ? value[0] : value);

const escapeRegex = (text) => text.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');

// ?page=2&limit=10
export const parsePagination = (query, defaultLimit = 20) => {
  const page = Math.max(1, parseInt(first(query.page), 10) || 1);
  const limit = Math.min(MAX_LIMIT, Math.max(1, parseInt(first(query.limit), 10) || defaultLimit));
  return { page, limit, skip: (page - 1) * limit };
};

// ?sort=-createdAt,title   ("-" = descending). Unknown fields are ignored.
export const parseSort = (sortParam, allowedFields = [], defaultSort = { createdAt: -1 }) => {
  const raw = first(sortParam);
  if (typeof raw !== 'string' || !raw.trim()) return { ...defaultSort };

  const sort = {};
  for (const part of raw.split(',')) {
    const key = part.trim();
    const desc = key.startsWith('-');
    const field = desc ? key.slice(1) : key;
    if (allowedFields.includes(field)) sort[field] = desc ? -1 : 1;
  }
  return Object.keys(sort).length ? sort : { ...defaultSort };
};

/**
 * filters = {
 *   featured: { type: 'boolean' },                     ?featured=true
 *   tag:      { field: 'tags', type: 'lowercase' },    ?tag=React  (case-insensitive exact match)
 *   status:   { type: 'string', adminOnly: true },     ignored for visitors
 * }
 */
export const parseFilters = (query, filters = {}, isAdmin = false) => {
  const result = {};

  for (const [param, { field = param, type = 'string', adminOnly = false }] of Object.entries(filters)) {
    if (adminOnly && !isAdmin) continue;

    const raw = first(query[param]);
    if (typeof raw !== 'string' || raw.trim() === '') continue;
    const value = raw.trim();

    if (type === 'boolean') {
      if (['true', '1'].includes(value)) result[field] = true;
      else if (['false', '0'].includes(value)) result[field] = false;
    } else if (type === 'lowercase') {
      result[field] = new RegExp(`^${escapeRegex(value)}$`, 'i');
    } else {
      result[field] = value;
    }
  }
  return result;
};

// ?q=next  -> case-insensitive "contains" search across the given fields
export const parseSearch = (q, fields = []) => {
  const text = first(q);
  if (typeof text !== 'string' || !text.trim() || !fields.length) return {};

  const regex = new RegExp(escapeRegex(text.trim().slice(0, 100)), 'i');
  return { $or: fields.map((field) => ({ [field]: regex })) };
};

import { slugify } from '../../utils/slugify.js';

// Adds a unique `slug` field generated from another field (e.g. title).
// Duplicates get a number suffix: "my-post", "my-post-2", "my-post-3"...
export function slugPlugin(schema, { source = 'title' } = {}) {
  schema.add({ slug: { type: String, unique: true, index: true, lowercase: true, trim: true } });

  schema.pre('save', async function () {
    if (!this.isModified(source) && this.slug) return;

    const base = slugify(this[source]) || 'item';
    let slug = base;
    let n = 2;
    while (await this.constructor.exists({ slug, _id: { $ne: this._id } })) {
      slug = `${base}-${n++}`;
    }
    this.slug = slug;
  });
}

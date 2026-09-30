import { assetUrl } from './lib/api.js';
import { formatDate } from './lib/form.js';
import { Badge } from './components/ui.jsx';

// Every content type the CMS manages, described once.
// The generic list page and edit form read these configs, so adding a
// new content type is mostly: add a model + route in the API, add a config here.
//
// Field types: text, url, email, textarea, markdown, number, range, boolean, select,
//              date, tags, list, pairs, image, gallery, file
// half: true  -> field takes half the row on wide screens

const statusBadge = (item) =>
  item.status === 'published' ? <Badge color="green">Published</Badge> : <Badge color="yellow">Draft</Badge>;

const thumbTitle = (image, title, subtitle) => (
  <div className="flex items-center gap-3">
    {image?.url ? (
      <img src={assetUrl(image.url)} alt="" className="size-10 shrink-0 rounded-md bg-slate-100 object-cover" />
    ) : (
      <div className="size-10 shrink-0 rounded-md bg-slate-100" />
    )}
    <div className="min-w-0">
      <p className="truncate font-medium text-slate-900">{title}</p>
      {subtitle && <p className="truncate text-xs text-slate-500">{subtitle}</p>}
    </div>
  </div>
);

const statusField = {
  name: 'status',
  label: 'Status',
  type: 'select',
  half: true,
  options: [
    { value: 'draft', label: 'Draft (hidden from site)' },
    { value: 'published', label: 'Published' },
  ],
};

const orderField = {
  name: 'order',
  label: 'Order',
  type: 'number',
  half: true,
  min: 0,
  hint: 'Lower numbers show first. You can also use the arrows on the list page.',
};

export const resources = {
  about: {
    key: 'about',
    path: '/about',
    label: 'About',
    singular: 'About',
    singleton: true,
    description: 'Your name, bio, photo and contact details shown across the site.',
    sections: [
      {
        title: 'Profile',
        fields: [
          { name: 'name', label: 'Full name', type: 'text', required: true, half: true, max: 100 },
          { name: 'headline', label: 'Headline', type: 'text', half: true, max: 150, placeholder: 'Full-Stack Developer' },
          { name: 'shortBio', label: 'Short bio', type: 'textarea', rows: 3, max: 300, hint: 'Shown in the hero section of the home page.' },
          { name: 'bio', label: 'Full bio', type: 'markdown', rows: 10, hint: 'Shown on the About page.' },
          { name: 'avatar', label: 'Profile photo', type: 'image' },
        ],
      },
      {
        title: 'Contact',
        fields: [
          { name: 'email', label: 'Email', type: 'email', half: true },
          { name: 'phone', label: 'Phone', type: 'text', half: true, max: 30 },
          { name: 'location', label: 'Location', type: 'text', half: true, max: 100, placeholder: 'Bengaluru, India' },
          { name: 'availableForWork', label: 'Available for work', type: 'boolean', half: true, default: true },
          { name: 'resumeUrl', label: 'Resume', type: 'file' },
        ],
      },
      {
        title: 'Social links & stats',
        fields: [
          {
            name: 'socials',
            label: 'Social links',
            type: 'pairs',
            itemLabel: 'link',
            keys: [
              { name: 'platform', label: 'Platform', placeholder: 'github' },
              { name: 'url', label: 'URL', placeholder: 'https://github.com/you', grow: true },
            ],
          },
          {
            name: 'stats',
            label: 'Stats',
            type: 'pairs',
            itemLabel: 'stat',
            hint: 'Small numbers shown on the About section, e.g. "Years experience" → "3+".',
            keys: [
              { name: 'label', label: 'Label', placeholder: 'Years experience', grow: true },
              { name: 'value', label: 'Value', placeholder: '3+' },
            ],
          },
        ],
      },
    ],
  },

  skills: {
    key: 'skills',
    path: '/skills',
    label: 'Skills',
    singular: 'Skill',
    description: 'Technologies and tools, grouped by category.',
    titleField: 'name',
    reorderable: true,
    searchable: true,
    sections: [
      {
        title: 'Skill',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, half: true, max: 50, placeholder: 'React' },
          { name: 'category', label: 'Category', type: 'text', half: true, max: 40, placeholder: 'Frontend', default: 'Other' },
          { name: 'level', label: 'Level', type: 'range', min: 0, maxValue: 100, suffix: '%', default: 50 },
          { name: 'icon', label: 'Icon', type: 'text', half: true, max: 100, hint: 'Icon name (e.g. "react") or image URL.' },
          orderField,
        ],
      },
    ],
    columns: [
      { label: 'Name', render: (s) => <span className="font-medium text-slate-900">{s.name}</span> },
      { label: 'Category', render: (s) => <Badge color="indigo">{s.category}</Badge> },
      {
        label: 'Level',
        render: (s) => (
          <div className="flex items-center gap-2">
            <div className="h-1.5 w-24 overflow-hidden rounded-full bg-slate-200">
              <div className="h-full bg-indigo-500" style={{ width: `${s.level}%` }} />
            </div>
            <span className="text-xs text-slate-500 tabular-nums">{s.level}%</span>
          </div>
        ),
      },
    ],
  },

  projects: {
    key: 'projects',
    path: '/projects',
    label: 'Projects',
    singular: 'Project',
    description: 'Work you want to show off. Drafts are only visible here.',
    titleField: 'title',
    reorderable: true,
    searchable: true,
    statusFilter: true,
    sections: [
      {
        title: 'Basics',
        fields: [
          { name: 'title', label: 'Title', type: 'text', required: true, max: 120 },
          { name: 'summary', label: 'Summary', type: 'textarea', rows: 2, max: 300, hint: 'Short text for the project card.' },
          statusField,
          { name: 'category', label: 'Category', type: 'text', half: true, max: 40, placeholder: 'Web App' },
          { name: 'techStack', label: 'Tech stack', type: 'tags', placeholder: 'React, Node.js, MongoDB' },
          { name: 'liveUrl', label: 'Live URL', type: 'url', half: true, placeholder: 'https://...' },
          { name: 'repoUrl', label: 'Repository URL', type: 'url', half: true, placeholder: 'https://github.com/...' },
          { name: 'startDate', label: 'Start date', type: 'date', half: true, nullable: true },
          { name: 'endDate', label: 'End date', type: 'date', half: true, nullable: true },
          { name: 'featured', label: 'Featured on home page', type: 'boolean', half: true },
          orderField,
        ],
      },
      {
        title: 'Images',
        fields: [
          { name: 'coverImage', label: 'Cover image', type: 'image' },
          { name: 'gallery', label: 'Gallery', type: 'gallery' },
        ],
      },
      {
        title: 'Case study',
        fields: [{ name: 'description', label: 'Description', type: 'markdown', rows: 16, hint: 'Shown on the project detail page.' }],
      },
    ],
    columns: [
      { label: 'Project', render: (p) => thumbTitle(p.coverImage, p.title, p.category || p.techStack?.slice(0, 3).join(', ')) },
      { label: 'Status', render: statusBadge },
      { label: 'Featured', render: (p) => (p.featured ? <Badge color="indigo">★ Featured</Badge> : null) },
      { label: 'Updated', render: (p) => formatDate(p.updatedAt) },
    ],
  },

  blogs: {
    key: 'blogs',
    path: '/blogs',
    label: 'Blog',
    singular: 'Blog post',
    description: 'Articles written in Markdown.',
    titleField: 'title',
    searchable: true,
    statusFilter: true,
    sections: [
      {
        title: 'Post',
        fields: [
          { name: 'title', label: 'Title', type: 'text', required: true, max: 150 },
          { name: 'excerpt', label: 'Excerpt', type: 'textarea', rows: 2, max: 300, hint: 'Short summary shown in the post list and search results.' },
          { name: 'content', label: 'Content', type: 'markdown', rows: 20 },
        ],
      },
      {
        title: 'Publishing',
        fields: [
          statusField,
          { name: 'publishedAt', label: 'Publish date', type: 'date', half: true, hint: 'Set automatically the first time you publish.' },
          { name: 'tags', label: 'Tags', type: 'tags', placeholder: 'react, nextjs' },
          { name: 'featured', label: 'Featured post', type: 'boolean' },
          { name: 'coverImage', label: 'Cover image', type: 'image' },
        ],
      },
    ],
    columns: [
      { label: 'Post', render: (b) => thumbTitle(b.coverImage, b.title, b.tags?.map((t) => `#${t}`).join(' ')) },
      { label: 'Status', render: statusBadge },
      { label: 'Published', render: (b) => formatDate(b.publishedAt) },
      { label: 'Read', render: (b) => `${b.readingTime} min` },
    ],
  },

  experience: {
    key: 'experience',
    path: '/experience',
    label: 'Experience',
    singular: 'Experience',
    description: 'Jobs and education for your timeline. Sorted newest first.',
    titleField: 'title',
    searchable: true,
    sections: [
      {
        title: 'Role',
        fields: [
          {
            name: 'type',
            label: 'Type',
            type: 'select',
            half: true,
            options: [
              { value: 'work', label: 'Work' },
              { value: 'education', label: 'Education' },
            ],
          },
          { name: 'title', label: 'Title', type: 'text', required: true, half: true, max: 120, placeholder: 'Frontend Developer / B.Tech CSE' },
          { name: 'organization', label: 'Company / school', type: 'text', required: true, half: true, max: 120 },
          { name: 'location', label: 'Location', type: 'text', half: true, max: 100, placeholder: 'Remote' },
          { name: 'startDate', label: 'Start date', type: 'date', required: true, half: true },
          { name: 'endDate', label: 'End date', type: 'date', half: true, nullable: true, hint: 'Leave empty if you are still here.' },
          { name: 'current', label: 'I currently work / study here', type: 'boolean' },
          { name: 'description', label: 'Description', type: 'textarea', rows: 4 },
          { name: 'highlights', label: 'Highlights', type: 'list', itemLabel: 'highlight', placeholder: 'Cut page load time by 40%...' },
        ],
      },
    ],
    columns: [
      {
        label: 'Role',
        render: (e) => (
          <div>
            <p className="font-medium text-slate-900">{e.title}</p>
            <p className="text-xs text-slate-500">{e.organization}</p>
          </div>
        ),
      },
      { label: 'Type', render: (e) => <Badge color={e.type === 'work' ? 'indigo' : 'gray'}>{e.type}</Badge> },
      {
        label: 'Period',
        render: (e) =>
          `${formatDate(e.startDate, { year: 'numeric', month: 'short' })} – ${
            e.current ? 'Present' : formatDate(e.endDate, { year: 'numeric', month: 'short' })
          }`,
      },
    ],
  },

  testimonials: {
    key: 'testimonials',
    path: '/testimonials',
    label: 'Testimonials',
    singular: 'Testimonial',
    description: 'Kind words from clients and colleagues.',
    titleField: 'name',
    reorderable: true,
    searchable: true,
    sections: [
      {
        title: 'Testimonial',
        fields: [
          { name: 'name', label: 'Name', type: 'text', required: true, half: true, max: 100 },
          { name: 'role', label: 'Role', type: 'text', half: true, max: 100, placeholder: 'CTO' },
          { name: 'company', label: 'Company', type: 'text', half: true, max: 100 },
          {
            name: 'rating',
            label: 'Rating',
            type: 'select',
            half: true,
            default: '5',
            options: ['5', '4', '3', '2', '1'].map((n) => ({ value: n, label: '★'.repeat(n) + '☆'.repeat(5 - n) })),
          },
          { name: 'content', label: 'Quote', type: 'textarea', required: true, rows: 4, max: 1000 },
          { name: 'avatar', label: 'Photo', type: 'image' },
          { name: 'featured', label: 'Featured', type: 'boolean', half: true },
          orderField,
        ],
      },
    ],
    columns: [
      { label: 'Person', render: (t) => thumbTitle(t.avatar, t.name, [t.role, t.company].filter(Boolean).join(' · ')) },
      { label: 'Rating', render: (t) => <span className="text-amber-500">{'★'.repeat(t.rating)}</span> },
      { label: 'Featured', render: (t) => (t.featured ? <Badge color="indigo">★ Featured</Badge> : null) },
    ],
  },

  services: {
    key: 'services',
    path: '/services',
    label: 'Services',
    singular: 'Service',
    description: 'What you offer to clients.',
    titleField: 'title',
    reorderable: true,
    searchable: true,
    sections: [
      {
        title: 'Service',
        fields: [
          { name: 'title', label: 'Title', type: 'text', required: true, half: true, max: 100, placeholder: 'Web Development' },
          { name: 'priceLabel', label: 'Price label', type: 'text', half: true, max: 50, placeholder: 'From $499' },
          { name: 'description', label: 'Description', type: 'textarea', rows: 3, max: 1000 },
          { name: 'features', label: 'Features', type: 'list', itemLabel: 'feature', placeholder: 'Responsive design' },
          { name: 'icon', label: 'Icon', type: 'text', half: true, max: 100, hint: 'Icon name, e.g. "code".' },
          orderField,
        ],
      },
    ],
    columns: [
      { label: 'Service', render: (s) => <span className="font-medium text-slate-900">{s.title}</span> },
      { label: 'Price', render: (s) => s.priceLabel || '—' },
      { label: 'Features', render: (s) => `${s.features?.length ?? 0}` },
    ],
  },
};

// Rating is stored as a number but the select works with strings
resources.testimonials.transformOut = (body) => ({ ...body, rating: Number(body.rating) });
resources.testimonials.transformIn = (doc) => ({ ...doc, rating: doc.rating != null ? String(doc.rating) : undefined });

export const collectionResources = Object.values(resources).filter((r) => !r.singleton);

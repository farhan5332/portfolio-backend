// Fills the database with sample content.
//   npm run seed        -> only adds data to EMPTY collections (safe to run anytime)
//   npm run seed:fresh  -> DELETES all content (not users!) and re-adds the samples
import { connectDB, disconnectDB } from '../src/config/db.js';
import {
  About,
  Skill,
  Project,
  Blog,
  Experience,
  Testimonial,
  Service,
} from '../src/models/index.js';

const fresh = process.argv.includes('--fresh');
const img = (text, w = 1200, h = 630) => ({
  url: `https://placehold.co/${w}x${h}/png?text=${encodeURIComponent(text)}`,
  alt: text,
});

const samples = {
  About: [
    {
      name: 'Your Name',
      headline: 'Full-Stack Developer',
      shortBio: 'I build fast, accessible web apps with React, Next.js and Node.js.',
      bio: 'I am a full-stack developer who enjoys turning ideas into polished products.',
      avatar: img('Avatar', 400, 400),
      email: 'you@example.com',
      location: 'India',
      socials: [
        { platform: 'github', url: 'https://github.com/your-username' },
        { platform: 'linkedin', url: 'https://linkedin.com/in/your-username' },
      ],
      stats: [
        { label: 'Years experience', value: '2+' },
        { label: 'Projects completed', value: '15+' },
      ],
    },
  ],
  Skill: [
    { name: 'React', category: 'Frontend', level: 90, order: 0 },
    { name: 'Next.js', category: 'Frontend', level: 85, order: 1 },
    { name: 'Tailwind CSS', category: 'Frontend', level: 90, order: 2 },
    { name: 'Node.js', category: 'Backend', level: 85, order: 0 },
    { name: 'Express', category: 'Backend', level: 85, order: 1 },
    { name: 'MongoDB', category: 'Backend', level: 80, order: 2 },
    { name: 'Git', category: 'Tools', level: 85, order: 0 },
  ],
  Project: [
    {
      title: 'Portfolio CMS',
      summary: 'A custom headless CMS with an admin panel, JWT auth and a REST API.',
      description: '## Overview\nBuilt from scratch with Express, MongoDB and React.',
      coverImage: img('Portfolio CMS'),
      techStack: ['Node.js', 'Express', 'MongoDB', 'React'],
      category: 'Web App',
      featured: true,
      status: 'published',
      order: 0,
    },
    {
      title: 'E-commerce Store',
      summary: 'A responsive online store with cart and checkout.',
      coverImage: img('E-commerce Store'),
      techStack: ['Next.js', 'Tailwind CSS', 'Stripe'],
      category: 'Web App',
      liveUrl: 'https://example.com',
      status: 'published',
      order: 1,
    },
    {
      title: 'Weather Dashboard (Draft)',
      summary: 'Only visible in the admin panel until published.',
      techStack: ['React'],
      status: 'draft',
      order: 2,
    },
  ],
  Blog: [
    {
      title: 'How I Built My Own CMS',
      excerpt: 'Why I wrote a CMS from scratch in two weeks.',
      content:
        '# How I Built My Own CMS\n\n' + 'Writing your own CMS teaches you a lot. '.repeat(120),
      coverImage: img('How I Built My Own CMS'),
      tags: ['NodeJS', 'CMS'],
      featured: true,
      status: 'published',
    },
    { title: 'Draft: Next.js Tips', excerpt: 'Work in progress.', status: 'draft' },
  ],
  Experience: [
    {
      type: 'work',
      title: 'Full-Stack Developer',
      organization: 'Company Name',
      startDate: new Date('2025-01-01'),
      current: true,
      highlights: ['Shipped 5 client projects'],
    },
    {
      type: 'education',
      title: 'B.Tech in Computer Science',
      organization: 'University Name',
      startDate: new Date('2021-08-01'),
      endDate: new Date('2025-06-30'),
    },
  ],
  Testimonial: [
    {
      name: 'Client One',
      role: 'Founder',
      company: 'Acme Inc.',
      content: 'Delivered our website ahead of schedule. Great communication.',
      rating: 5,
      featured: true,
    },
  ],
  Service: [
    {
      title: 'Web Development',
      description: 'Fast, responsive websites built with modern tools.',
      icon: 'code',
      features: ['Responsive design', 'SEO friendly'],
      priceLabel: 'From $499',
      order: 0,
    },
    {
      title: 'Custom CMS',
      description: 'Admin panels so you can update content without a developer.',
      icon: 'layout-dashboard',
      features: ['Easy editing', 'Secure login'],
      order: 1,
    },
  ],
};

const models = { About, Skill, Project, Blog, Experience, Testimonial, Service };

await connectDB();

try {
  for (const [name, Model] of Object.entries(models)) {
    if (fresh) await Model.deleteMany({});

    const count = await Model.countDocuments();
    if (count > 0) {
      console.log(`⏭️  ${name}: already has ${count} item(s), skipped`);
      continue;
    }
    // create() (not insertMany) so hooks run: slugs, reading time, publishedAt
    for (const data of samples[name]) await Model.create(data);
    console.log(`✅ ${name}: added ${samples[name].length} sample item(s)`);
  }
  console.log('\n🌱 Seeding done.');
} catch (err) {
  console.error('❌ Seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}

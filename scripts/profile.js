// Replaces the sample About / Skills / Projects / Experience with my real profile (from my resume).
//   npm run seed:profile
// WARNING: deletes everything in those four collections first. Blog posts, testimonials,
// services, media and messages are not touched. The profile photo and resume file are kept.
import { connectDB, disconnectDB } from '../src/config/db.js';
import { About, Skill, Project, Experience } from '../src/models/index.js';

const about = {
  name: 'Mohd Farhan Ali',
  headline: 'Full-Stack Software Engineer',
  shortBio:
    'I build production-ready web applications with React, Next.js, TypeScript, Node.js and Express, including AI-powered, agentic features with the Anthropic Claude API.',
  bio: `I'm a Full-Stack Software Engineer with two software internships and a B.Tech in Information Technology. I build production-ready web applications with React, Next.js, TypeScript, Node.js and Express.

I'm comfortable across the stack: REST API design, PostgreSQL and MongoDB data modeling, automated testing, and CI/CD deployment on Vercel and Render. I also build AI-powered, agentic features with the Anthropic Claude API.

## Certifications

- **Azure AI Document Intelligence** — Microsoft
- **Prompt Engineering** — One Million Prompters, Dubai Future Foundation
- **Java Programming** — Coursera
- **Python for Data Science & AI** — Coursera
- **Web Development** — Internshala
- **Salesforce Development** — Techmatrix Consulting`,
  email: 'farhanali78618@gmail.com',
  location: 'Noida, India',
  availableForWork: true,
  socials: [
    { platform: 'github', url: 'https://github.com/farhan5332' },
    { platform: 'linkedin', url: 'https://linkedin.com/in/mohd-farhan-ali56' },
  ],
  stats: [
    { label: 'Software internships', value: '2' },
    { label: 'Projects shipped', value: '4' },
    { label: 'Certifications', value: '6' },
  ],
};

// [category, [[name, level], ...]]
const skills = [
  ['Languages', [['JavaScript', 90], ['TypeScript', 85], ['Java', 70], ['SQL', 80], ['HTML', 90], ['CSS', 85]]],
  ['Frontend', [['React.js', 90], ['Next.js', 85], ['Vite', 80], ['Tailwind CSS', 90], ['Responsive Design', 85]]],
  ['Backend', [['Node.js', 85], ['Express.js', 85], ['REST APIs', 85], ['OAuth 2.0 (NextAuth)', 75]]],
  ['Databases', [['PostgreSQL (Supabase)', 80], ['MongoDB', 80]]],
  ['AI / LLM', [['Anthropic Claude API', 85], ['Agentic Workflows', 80], ['Prompt Engineering', 85]]],
  ['Tools & Concepts', [['Git', 85], ['GitHub', 85], ['Vercel', 80], ['Object-Oriented Programming', 80]]],
];

const projects = [
  {
    title: 'SpeakEasy — Text-to-Speech Web App',
    summary:
      'Full-stack text-to-speech app with 9 languages, 19 neural voices, auto-translation and MP3 export.',
    description: `## Overview

SpeakEasy turns text into natural-sounding speech in the browser.

## Highlights

- Built a full-stack text-to-speech app with 9 languages, 19 neural voices, auto-translation, and MP3 export.
- Designed a secure Express REST API with input validation, rate limiting, CORS, and robust error handling.
- Wrote API and UI tests with GitHub Actions CI; deployed the API on Render and the frontend on Vercel.`,
    techStack: ['React', 'Vite', 'Node.js', 'Express'],
    category: 'Web App',
    liveUrl: 'https://text-to-speech-farhan07.vercel.app',
    repoUrl: 'https://github.com/farhan5332/Text-to-Speech',
    startDate: new Date('2026-09-01'),
    featured: true,
  },
  {
    title: 'MailWright — AI-Powered Gmail Client',
    summary:
      'A Gmail client where an AI assistant drives the UI to compose, reply, search and filter mail.',
    description: `## Overview

MailWright is a Gmail client with a built-in AI assistant that operates the interface for you.

## Highlights

- Built a Gmail client where an AI assistant drives the UI to compose, reply, search, and filter mail.
- Implemented a Claude agentic loop emitting typed UI actions, decoupling AI reasoning from the DOM.
- Added Google OAuth and a human-in-the-loop design: the assistant never sends mail without approval.`,
    techStack: ['Next.js', 'TypeScript', 'Claude API', 'Gmail API'],
    category: 'AI',
    repoUrl: 'https://github.com/farhan5332/MailWright',
    startDate: new Date('2026-08-01'),
    featured: true,
  },
  {
    title: 'Employee Attendance & Payroll System',
    summary:
      'Full-stack HR platform with Admin, HR and Employee roles, attendance, leave approvals and payroll.',
    description: `## Overview

An HR platform that covers the monthly cycle from attendance to pay slips.

## Highlights

- Developed a full-stack HR platform with Admin, HR, and Employee roles secured by Row Level Security.
- Delivered attendance tracking, leave approvals, and monthly payroll with PDF pay-slip generation.
- Built dashboard analytics and automatic audit logging via database triggers.`,
    techStack: ['React', 'Supabase', 'PostgreSQL'],
    category: 'Web App',
    liveUrl: 'https://attendance-management-and-payroll-s.vercel.app',
    repoUrl: 'https://github.com/farhan5332/Attendance-Management-and-Payroll-System',
    startDate: new Date('2026-07-01'),
    featured: true,
  },
  {
    title: 'Portfolio CMS',
    summary:
      'The custom CMS behind this site: REST API, JWT auth, media library and a React admin panel.',
    description: `## Overview

This website runs on a CMS I wrote from scratch instead of using a hosted headless CMS.

## Highlights

- REST API with Express and MongoDB for every content type, validated with Zod.
- JWT authentication with refresh-token rotation for the admin panel.
- File uploads with type and signature checks, plus a reusable media library.
- React admin panel with config-driven CRUD screens, and a Next.js frontend that reads from the API.`,
    techStack: ['Node.js', 'Express', 'MongoDB', 'React', 'Next.js', 'Tailwind CSS'],
    category: 'Web App',
    startDate: new Date('2026-09-01'),
  },
];

const experience = [
  {
    type: 'work',
    title: 'Full-Stack Developer Intern',
    organization: 'Cortexity AI',
    location: 'Remote',
    startDate: new Date('2026-02-01'),
    endDate: new Date('2026-08-31'),
    highlights: [
      'Developed, tested, and shipped features for an AI-powered web app using Next.js and TypeScript.',
      'Integrated the Claude API into an in-app chat assistant, designing prompt workflows and streaming responses.',
      'Applied code-review feedback from senior engineers and used AI-assisted tooling to ship faster.',
    ],
  },
  {
    type: 'work',
    title: 'Salesforce Developer Intern',
    organization: 'Techmatrix Consulting',
    location: 'On-site',
    startDate: new Date('2025-09-01'),
    endDate: new Date('2026-01-31'),
    highlights: [
      'Built reusable Lightning Web Components (LWC) for a Hotel Management System, integrated with Apex logic.',
      'Configured data models, object permissions, and workflow automation across multiple business use cases.',
      'Translated business requirements into working solutions, applying mentor feedback.',
    ],
  },
  {
    type: 'education',
    title: 'B.Tech, Information Technology',
    organization: 'NIET',
    location: 'Greater Noida',
    startDate: new Date('2021-10-01'),
    endDate: new Date('2025-06-30'),
  },
];

await connectDB();

try {
  // About is a single document: update it in place so the photo and resume file stay attached.
  const doc = (await About.findOne()) ?? new About();
  doc.set(about);
  await doc.save();
  console.log('✅ About updated');

  await Skill.deleteMany({});
  for (const [category, items] of skills) {
    for (const [order, [name, level]] of items.entries()) await Skill.create({ name, category, level, order });
  }
  console.log(`✅ Skills: ${await Skill.countDocuments()}`);

  // create() (not insertMany) so the slug hook runs
  await Project.deleteMany({});
  for (const [order, project] of projects.entries()) {
    await Project.create({ ...project, order, status: 'published' });
  }
  console.log(`✅ Projects: ${projects.length}`);

  await Experience.deleteMany({});
  await Experience.create(experience);
  console.log(`✅ Experience: ${experience.length}`);
} catch (err) {
  console.error('❌ Profile seeding failed:', err.message);
  process.exitCode = 1;
} finally {
  await disconnectDB();
}

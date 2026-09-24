import { Project, Blog, Skill, Experience, Testimonial, Service } from '../models/index.js';

// GET /api/stats  (admin) - counts for the dashboard cards
export const getStats = async (req, res) => {
  const [
    projectsPublished,
    projectsDraft,
    blogsPublished,
    blogsDraft,
    skills,
    experience,
    testimonials,
    services,
    recentBlogs,
    recentProjects,
  ] = await Promise.all([
    Project.countDocuments({ status: 'published' }),
    Project.countDocuments({ status: 'draft' }),
    Blog.countDocuments({ status: 'published' }),
    Blog.countDocuments({ status: 'draft' }),
    Skill.countDocuments(),
    Experience.countDocuments(),
    Testimonial.countDocuments(),
    Service.countDocuments(),
    Blog.find().sort({ updatedAt: -1 }).limit(5).select('title slug status updatedAt'),
    Project.find().sort({ updatedAt: -1 }).limit(5).select('title slug status updatedAt'),
  ]);

  res.json({
    success: true,
    data: {
      counts: {
        projects: { total: projectsPublished + projectsDraft, published: projectsPublished, draft: projectsDraft },
        blogs: { total: blogsPublished + blogsDraft, published: blogsPublished, draft: blogsDraft },
        skills,
        experience,
        testimonials,
        services,
      },
      recent: { blogs: recentBlogs, projects: recentProjects },
    },
  });
};

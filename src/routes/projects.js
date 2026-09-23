import { Router } from 'express';
import Project from '../models/Project.js';

const router = Router();

router.get('/', async (req, res) => {
  const projects = await Project.find().sort({ createdAt: -1 });
  res.json(projects);
});

router.get('/:id', async (req, res) => {
  const project = await Project.findById(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

router.post('/', async (req, res) => {
  const project = await Project.create(req.body);
  res.status(201).json(project);
});

router.put('/:id', async (req, res) => {
  const project = await Project.findByIdAndUpdate(req.params.id, req.body, {
    new: true,
    runValidators: true,
  });
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.json(project);
});

router.delete('/:id', async (req, res) => {
  const project = await Project.findByIdAndDelete(req.params.id);
  if (!project) return res.status(404).json({ message: 'Project not found' });
  res.status(204).end();
});

export default router;

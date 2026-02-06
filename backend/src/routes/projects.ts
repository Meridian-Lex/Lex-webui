import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { ProjectMapService } from '../services/projectMap';

const router = Router();
const projectMapService = new ProjectMapService();

// GET /api/projects
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const projects = await projectMapService.getProjects();

    // Optional filtering
    const { status, sort } = req.query;

    let filtered = projects;

    if (status && typeof status === 'string') {
      filtered = filtered.filter(p => p.status === status);
    }

    if (sort === 'name') {
      filtered.sort((a, b) => a.name.localeCompare(b.name));
    } else if (sort === 'activity') {
      filtered.sort((a, b) => {
        if (!a.lastActivity) return 1;
        if (!b.lastActivity) return -1;
        return b.lastActivity.getTime() - a.lastActivity.getTime();
      });
    }

    res.json({ projects: filtered });
  } catch (err) {
    console.error('Get projects error:', err);
    res.status(500).json({ error: 'Failed to get projects' });
  }
});

// GET /api/projects/:name
router.get('/:name', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name } = req.params;
    const projects = await projectMapService.getProjects();

    const project = projects.find(p => p.name === name);

    if (!project) {
      res.status(404).json({ error: 'Project not found' });
      return;
    }

    res.json({ project });
  } catch (err) {
    console.error('Get project error:', err);
    res.status(500).json({ error: 'Failed to get project' });
  }
});

export default router;

import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { requireAuth } from '../middleware/auth';
import { TaskService } from '../services/taskService';

const router = Router();
const taskService = new TaskService();

// Validation schemas
const createTaskSchema = Joi.object({
  subject: Joi.string().min(1).max(255).required(),
  description: Joi.string().min(1).required(),
  activeForm: Joi.string().max(255).optional(),
  metadata: Joi.object().optional(),
});

const updateTaskSchema = Joi.object({
  status: Joi.string().valid('pending', 'in_progress', 'completed', 'deleted').optional(),
  subject: Joi.string().min(1).max(255).optional(),
  description: Joi.string().min(1).optional(),
  activeForm: Joi.string().max(255).optional(),
  metadata: Joi.object().optional(),
}).min(1);

// GET /api/tasks - List all tasks
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const status = req.query.status as string | undefined;
    const limit = req.query.limit ? parseInt(req.query.limit as string, 10) : undefined;

    const tasks = await taskService.getAllTasks({ status, limit });
    res.json({ tasks });
  } catch (error) {
    console.error('Get tasks error:', error);
    res.status(500).json({ error: 'Failed to retrieve tasks' });
  }
});

// GET /api/tasks/stats - Get task statistics
router.get('/stats', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const stats = await taskService.getTaskStats();
    res.json(stats);
  } catch (error) {
    console.error('Get task stats error:', error);
    res.status(500).json({ error: 'Failed to retrieve task statistics' });
  }
});

// GET /api/tasks/:id - Get single task
router.get('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const task = await taskService.getTaskById(req.params.id);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(task);
  } catch (error) {
    console.error('Get task error:', error);
    res.status(500).json({ error: 'Failed to retrieve task' });
  }
});

// POST /api/tasks - Create new task
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = createTaskSchema.validate(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const task = await taskService.createTask(value);
    res.status(201).json(task);
  } catch (error) {
    console.error('Create task error:', error);
    res.status(500).json({ error: 'Failed to create task' });
  }
});

// PUT /api/tasks/:id - Update task
router.put('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = updateTaskSchema.validate(req.body);

    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const task = await taskService.updateTask(req.params.id, value);

    if (!task) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json(task);
  } catch (error) {
    console.error('Update task error:', error);
    res.status(500).json({ error: 'Failed to update task' });
  }
});

// DELETE /api/tasks/:id - Delete task
router.delete('/:id', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const success = await taskService.deleteTask(req.params.id);

    if (!success) {
      res.status(404).json({ error: 'Task not found' });
      return;
    }

    res.json({ success: true });
  } catch (error) {
    console.error('Delete task error:', error);
    res.status(500).json({ error: 'Failed to delete task' });
  }
});

export default router;

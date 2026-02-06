import { Router, Request, Response } from 'express';
import Joi from 'joi';
import { requireAuth } from '../middleware/auth';
import { auditLog } from '../middleware/audit';
import { StateManager } from '../services/stateManager';
import { TokenBudgetService } from '../services/tokenBudget';

const router = Router();
const stateManager = new StateManager();
const tokenBudget = new TokenBudgetService();

const modeSchema = Joi.object({
  mode: Joi.string().valid('IDLE', 'AUTONOMOUS', 'DIRECTED', 'COLLABORATIVE').required(),
});

// GET /api/status
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const status = await stateManager.getStatus();
    const budget = await tokenBudget.getBudget();

    res.json({
      ...status,
      tokenBudget: budget,
    });
  } catch (err) {
    console.error('Get status error:', err);
    res.status(500).json({ error: 'Failed to get status' });
  }
});

// POST /api/status/mode
router.post('/mode', requireAuth, auditLog('status:mode_change'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = modeSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { mode } = value;
    await stateManager.setMode(mode);

    res.json({ mode, success: true });
  } catch (err) {
    console.error('Set mode error:', err);
    res.status(500).json({ error: 'Failed to set mode' });
  }
});

// GET /api/status/health
router.get('/health', async (req: Request, res: Response): Promise<void> => {
  // No auth required - public health check
  res.json({
    api: 'healthy',
    database: 'healthy', // TODO: Actual DB health check
    redis: 'healthy', // TODO: Actual Redis health check
    filesystem: 'healthy', // TODO: Actual filesystem check
  });
});

export default router;

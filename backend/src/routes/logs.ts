import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { LexFileSystem } from '../services/lexFileSystem';
import { LogEntry } from '../types';

const router = Router();
const lexFs = new LexFileSystem();

// GET /api/logs
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const lines = parseInt(req.query.lines as string) || 100;
    const level = req.query.level as string;

    // TODO: Read actual Lex logs - for now, return stub data
    const logs: LogEntry[] = [
      {
        timestamp: new Date().toISOString(),
        level: 'info',
        message: 'Lex system initialized',
        context: { mode: 'IDLE' },
      },
      {
        timestamp: new Date(Date.now() - 60000).toISOString(),
        level: 'info',
        message: 'Token budget updated',
        context: { remaining: 50000 },
      },
    ];

    let filtered = logs;

    if (level) {
      filtered = filtered.filter(log => log.level === level);
    }

    // Limit to requested lines
    filtered = filtered.slice(0, lines);

    res.json({ logs: filtered });
  } catch (err) {
    console.error('Get logs error:', err);
    res.status(500).json({ error: 'Failed to get logs' });
  }
});

export default router;

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

    // Read actual Lex logs
    const logs: LogEntry[] = [];

    // Read state check logs
    const stateCheckLogs = await lexFs.readLogs('state-checks.log');
    logs.push(...stateCheckLogs);

    // Read session tracking logs
    const sessionLogs = await lexFs.readLogs('session-tracking.log');
    logs.push(...sessionLogs);

    // Sort by timestamp descending (newest first)
    logs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

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

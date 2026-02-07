import { Router, Request, Response } from 'express';
import { configService } from '../services/configService';

const router = Router();

// Get LEX configuration
router.get('/lex-config', async (req: Request, res: Response) => {
  try {
    const config = await configService.getLexConfig();
    res.json(config);
  } catch (error) {
    console.error('Error reading LEX config:', error);
    res.status(500).json({
      error: 'Failed to read configuration',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get STATE.md
router.get('/state', async (req: Request, res: Response) => {
  try {
    const state = await configService.getState();
    res.json({ content: state });
  } catch (error) {
    console.error('Error reading STATE:', error);
    res.status(500).json({
      error: 'Failed to read state file',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get README.md
router.get('/readme', async (req: Request, res: Response) => {
  try {
    const readme = await configService.getReadme();
    res.json({ content: readme });
  } catch (error) {
    console.error('Error reading README:', error);
    res.status(500).json({
      error: 'Failed to read README',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

// Get all configuration overview
router.get('/overview', async (req: Request, res: Response) => {
  try {
    const overview = await configService.getConfigOverview();
    res.json(overview);
  } catch (error) {
    console.error('Error reading config overview:', error);
    res.status(500).json({
      error: 'Failed to read configuration overview',
      details: error instanceof Error ? error.message : 'Unknown error',
    });
  }
});

export default router;

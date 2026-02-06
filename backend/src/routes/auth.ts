import { Router, Request, Response } from 'express';
import bcrypt from 'bcrypt';
import Joi from 'joi';
import { AppDataSource } from '../config/database';
import { User } from '../models/User';
import { requireAuth } from '../middleware/auth';
import { auditLog } from '../middleware/audit';

const router = Router();
const BCRYPT_ROUNDS = 12;

// Validation schemas
const setupSchema = Joi.object({
  username: Joi.string().min(3).max(50).required(),
  password: Joi.string().min(8).required(),
  confirmPassword: Joi.string().valid(Joi.ref('password')).required(),
});

const loginSchema = Joi.object({
  username: Joi.string().required(),
  password: Joi.string().required(),
});

// POST /api/auth/setup - First-run admin creation
router.post('/setup', auditLog('auth:setup'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = setupSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const userRepo = AppDataSource.getRepository(User);

    // Check if any users exist
    const userCount = await userRepo.count();
    if (userCount > 0) {
      res.status(403).json({ error: 'Setup already completed' });
      return;
    }

    const { username, password } = value;

    // Hash password
    const passwordHash = await bcrypt.hash(password, BCRYPT_ROUNDS);

    // Create admin user
    const user = userRepo.create({
      username,
      passwordHash,
      role: 'admin',
    });

    await userRepo.save(user);

    res.status(201).json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
      },
    });
  } catch (err) {
    console.error('Setup error:', err);
    res.status(500).json({ error: 'Setup failed' });
  }
});

// POST /api/auth/login
router.post('/login', auditLog('auth:login'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { error, value } = loginSchema.validate(req.body);
    if (error) {
      res.status(400).json({ error: error.details[0].message });
      return;
    }

    const { username, password } = value;

    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { username } });

    if (!user) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      res.status(401).json({ error: 'Invalid credentials' });
      return;
    }

    // Update last login
    user.lastLogin = new Date();
    await userRepo.save(user);

    // Set session
    req.session.userId = user.id;
    req.session.username = user.username;

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

// POST /api/auth/logout
router.post('/logout', requireAuth, auditLog('auth:logout'), async (req: Request, res: Response): Promise<void> => {
  req.session.destroy((err) => {
    if (err) {
      console.error('Logout error:', err);
      res.status(500).json({ error: 'Logout failed' });
      return;
    }
    res.json({ success: true });
  });
});

// GET /api/auth/me
router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const userRepo = AppDataSource.getRepository(User);
    const user = await userRepo.findOne({ where: { id: req.session.userId } });

    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({
      user: {
        id: user.id,
        username: user.username,
        role: user.role,
        lastLogin: user.lastLogin,
      },
    });
  } catch (err) {
    console.error('Get user error:', err);
    res.status(500).json({ error: 'Failed to get user' });
  }
});

export default router;

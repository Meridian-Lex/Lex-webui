import 'dotenv/config';
import express from 'express';
import session from 'express-session';
import RedisStore from 'connect-redis';
import cors from 'cors';
import helmet from 'helmet';
import { AppDataSource } from './config/database';
import { redisClient, initRedis } from './config/redis';
import { apiRateLimit, authRateLimit } from './middleware/rateLimit';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import statusRoutes from './routes/status';
import projectsRoutes from './routes/projects';
import logsRoutes from './routes/logs';
import configRoutes from './routes/config';
import tasksRoutes from './routes/tasks';

const app = express();
const PORT = process.env.PORT || 3001;

// Trust proxy - required for rate limiting behind NGINX
app.set('trust proxy', true);

// Middleware
app.use(helmet());
app.use(cors({
  origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session configuration
const sessionMiddleware = session({
  store: new RedisStore({ client: redisClient }),
  secret: process.env.SESSION_SECRET || 'change-me-in-production',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000, // 24 hours
    sameSite: 'strict',
  },
});

app.use(sessionMiddleware);

// Routes
// Note: Rate limiting applied at route level in auth.ts for granular control
app.use('/api/auth', authRoutes);
app.use('/api/status', apiRateLimit, statusRoutes);
app.use('/api/projects', apiRateLimit, projectsRoutes);
app.use('/api/logs', apiRateLimit, logsRoutes);
app.use('/api/config', apiRateLimit, configRoutes);
app.use('/api/tasks', apiRateLimit, tasksRoutes);

// Health check (no rate limit)
app.get('/health', (req, res) => {
  res.json({ status: 'healthy' });
});

// Error handler (must be last)
app.use(errorHandler);

// Initialize and start server
async function start(): Promise<void> {
  try {
    // Initialize Redis
    await initRedis();
    console.log('Redis connected');

    // Initialize Database
    await AppDataSource.initialize();
    console.log('Database connected');

    // Run migrations
    await AppDataSource.runMigrations();
    console.log('Migrations completed');

    // Start server
    app.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on('SIGTERM', async () => {
  console.log('SIGTERM received, shutting down gracefully');
  await AppDataSource.destroy();
  await redisClient.quit();
  process.exit(0);
});

// Start if not in test mode
if (process.env.NODE_ENV !== 'test') {
  void start();
}

export { app };

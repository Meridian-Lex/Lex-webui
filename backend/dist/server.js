"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.app = void 0;
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const express_session_1 = __importDefault(require("express-session"));
const connect_redis_1 = __importDefault(require("connect-redis"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const database_1 = require("./config/database");
const redis_1 = require("./config/redis");
const rateLimit_1 = require("./middleware/rateLimit");
const errorHandler_1 = require("./middleware/errorHandler");
// Routes
const auth_1 = __importDefault(require("./routes/auth"));
const status_1 = __importDefault(require("./routes/status"));
const projects_1 = __importDefault(require("./routes/projects"));
const logs_1 = __importDefault(require("./routes/logs"));
const app = (0, express_1.default)();
exports.app = app;
const PORT = process.env.PORT || 3001;
// Middleware
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)({
    origin: process.env.ALLOWED_ORIGINS?.split(',') || 'http://localhost:3000',
    credentials: true,
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Session configuration
const sessionMiddleware = (0, express_session_1.default)({
    store: new connect_redis_1.default({ client: redis_1.redisClient }),
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
app.use('/api/auth', rateLimit_1.authRateLimit, auth_1.default);
app.use('/api/status', rateLimit_1.apiRateLimit, status_1.default);
app.use('/api/projects', rateLimit_1.apiRateLimit, projects_1.default);
app.use('/api/logs', rateLimit_1.apiRateLimit, logs_1.default);
// Health check (no rate limit)
app.get('/health', (req, res) => {
    res.json({ status: 'healthy' });
});
// Error handler (must be last)
app.use(errorHandler_1.errorHandler);
// Initialize and start server
async function start() {
    try {
        // Initialize Redis
        await (0, redis_1.initRedis)();
        console.log('Redis connected');
        // Initialize Database
        await database_1.AppDataSource.initialize();
        console.log('Database connected');
        // Run migrations
        await database_1.AppDataSource.runMigrations();
        console.log('Migrations completed');
        // Start server
        app.listen(PORT, () => {
            console.log(`Server running on port ${PORT}`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
}
// Handle shutdown gracefully
process.on('SIGTERM', async () => {
    console.log('SIGTERM received, shutting down gracefully');
    await database_1.AppDataSource.destroy();
    await redis_1.redisClient.quit();
    process.exit(0);
});
// Start if not in test mode
if (process.env.NODE_ENV !== 'test') {
    void start();
}
//# sourceMappingURL=server.js.map
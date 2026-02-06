"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bcrypt_1 = __importDefault(require("bcrypt"));
const joi_1 = __importDefault(require("joi"));
const database_1 = require("../config/database");
const User_1 = require("../models/User");
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const router = (0, express_1.Router)();
const BCRYPT_ROUNDS = 12;
// Validation schemas
const setupSchema = joi_1.default.object({
    username: joi_1.default.string().min(3).max(50).required(),
    password: joi_1.default.string().min(8).required(),
    confirmPassword: joi_1.default.string().valid(joi_1.default.ref('password')).required(),
});
const loginSchema = joi_1.default.object({
    username: joi_1.default.string().required(),
    password: joi_1.default.string().required(),
});
// POST /api/auth/setup - First-run admin creation
router.post('/setup', (0, audit_1.auditLog)('auth:setup'), async (req, res) => {
    try {
        const { error, value } = setupSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        // Check if any users exist
        const userCount = await userRepo.count();
        if (userCount > 0) {
            res.status(403).json({ error: 'Setup already completed' });
            return;
        }
        const { username, password } = value;
        // Hash password
        const passwordHash = await bcrypt_1.default.hash(password, BCRYPT_ROUNDS);
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
    }
    catch (err) {
        console.error('Setup error:', err);
        res.status(500).json({ error: 'Setup failed' });
    }
});
// POST /api/auth/login
router.post('/login', (0, audit_1.auditLog)('auth:login'), async (req, res) => {
    try {
        const { error, value } = loginSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }
        const { username, password } = value;
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
        const user = await userRepo.findOne({ where: { username } });
        if (!user) {
            res.status(401).json({ error: 'Invalid credentials' });
            return;
        }
        const validPassword = await bcrypt_1.default.compare(password, user.passwordHash);
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
    }
    catch (err) {
        console.error('Login error:', err);
        res.status(500).json({ error: 'Login failed' });
    }
});
// POST /api/auth/logout
router.post('/logout', auth_1.requireAuth, (0, audit_1.auditLog)('auth:logout'), async (req, res) => {
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
router.get('/me', auth_1.requireAuth, async (req, res) => {
    try {
        const userRepo = database_1.AppDataSource.getRepository(User_1.User);
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
    }
    catch (err) {
        console.error('Get user error:', err);
        res.status(500).json({ error: 'Failed to get user' });
    }
});
exports.default = router;
//# sourceMappingURL=auth.js.map
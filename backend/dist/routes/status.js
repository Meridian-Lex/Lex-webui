"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const joi_1 = __importDefault(require("joi"));
const auth_1 = require("../middleware/auth");
const audit_1 = require("../middleware/audit");
const stateManager_1 = require("../services/stateManager");
const tokenBudget_1 = require("../services/tokenBudget");
const router = (0, express_1.Router)();
const stateManager = new stateManager_1.StateManager();
const tokenBudget = new tokenBudget_1.TokenBudgetService();
const modeSchema = joi_1.default.object({
    mode: joi_1.default.string().valid('IDLE', 'AUTONOMOUS', 'DIRECTED', 'COLLABORATIVE').required(),
});
// GET /api/status
router.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const status = await stateManager.getStatus();
        const budget = await tokenBudget.getBudget();
        res.json({
            ...status,
            tokenBudget: budget,
        });
    }
    catch (err) {
        console.error('Get status error:', err);
        res.status(500).json({ error: 'Failed to get status' });
    }
});
// POST /api/status/mode
router.post('/mode', auth_1.requireAuth, (0, audit_1.auditLog)('status:mode_change'), async (req, res) => {
    try {
        const { error, value } = modeSchema.validate(req.body);
        if (error) {
            res.status(400).json({ error: error.details[0].message });
            return;
        }
        const { mode } = value;
        await stateManager.setMode(mode);
        res.json({ mode, success: true });
    }
    catch (err) {
        console.error('Set mode error:', err);
        res.status(500).json({ error: 'Failed to set mode' });
    }
});
// GET /api/status/health
router.get('/health', async (req, res) => {
    // No auth required - public health check
    res.json({
        api: 'healthy',
        database: 'healthy', // TODO: Actual DB health check
        redis: 'healthy', // TODO: Actual Redis health check
        filesystem: 'healthy', // TODO: Actual filesystem check
    });
});
exports.default = router;
//# sourceMappingURL=status.js.map
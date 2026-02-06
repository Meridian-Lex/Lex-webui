"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const lexFileSystem_1 = require("../services/lexFileSystem");
const router = (0, express_1.Router)();
const lexFs = new lexFileSystem_1.LexFileSystem();
// GET /api/logs
router.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const lines = parseInt(req.query.lines) || 100;
        const level = req.query.level;
        // TODO: Read actual Lex logs - for now, return stub data
        const logs = [
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
    }
    catch (err) {
        console.error('Get logs error:', err);
        res.status(500).json({ error: 'Failed to get logs' });
    }
});
exports.default = router;
//# sourceMappingURL=logs.js.map
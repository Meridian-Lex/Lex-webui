"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const projectMap_1 = require("../services/projectMap");
const router = (0, express_1.Router)();
const projectMapService = new projectMap_1.ProjectMapService();
// GET /api/projects
router.get('/', auth_1.requireAuth, async (req, res) => {
    try {
        const projects = await projectMapService.getProjects();
        // Optional filtering
        const { status, sort } = req.query;
        let filtered = projects;
        if (status && typeof status === 'string') {
            filtered = filtered.filter(p => p.status === status);
        }
        if (sort === 'name') {
            filtered.sort((a, b) => a.name.localeCompare(b.name));
        }
        else if (sort === 'activity') {
            filtered.sort((a, b) => {
                if (!a.lastActivity)
                    return 1;
                if (!b.lastActivity)
                    return -1;
                return b.lastActivity.getTime() - a.lastActivity.getTime();
            });
        }
        res.json({ projects: filtered });
    }
    catch (err) {
        console.error('Get projects error:', err);
        res.status(500).json({ error: 'Failed to get projects' });
    }
});
// GET /api/projects/:name
router.get('/:name', auth_1.requireAuth, async (req, res) => {
    try {
        const { name } = req.params;
        const projects = await projectMapService.getProjects();
        const project = projects.find(p => p.name === name);
        if (!project) {
            res.status(404).json({ error: 'Project not found' });
            return;
        }
        res.json({ project });
    }
    catch (err) {
        console.error('Get project error:', err);
        res.status(500).json({ error: 'Failed to get project' });
    }
});
exports.default = router;
//# sourceMappingURL=projects.js.map
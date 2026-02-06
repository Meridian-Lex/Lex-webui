"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireAuth = requireAuth;
exports.optionalAuth = optionalAuth;
function requireAuth(req, res, next) {
    if (!req.session.userId) {
        res.status(401).json({ error: 'Unauthorized' });
        return;
    }
    next();
}
function optionalAuth(req, res, next) {
    // Just continue - used for endpoints that work with or without auth
    next();
}
//# sourceMappingURL=auth.js.map
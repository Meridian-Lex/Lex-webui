"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.auditLog = auditLog;
const database_1 = require("../config/database");
const AuditLog_1 = require("../models/AuditLog");
function auditLog(action) {
    return async (req, res, next) => {
        // Store original send to intercept response
        const originalSend = res.send;
        res.send = function (data) {
            res.send = originalSend; // Restore original
            // Log async without blocking response
            void (async () => {
                try {
                    const auditLogRepo = database_1.AppDataSource.getRepository(AuditLog_1.AuditLog);
                    await auditLogRepo.save({
                        userId: req.session.userId || null,
                        action,
                        resource: req.path,
                        details: {
                            method: req.method,
                            body: req.body,
                            query: req.query,
                        },
                        ipAddress: req.ip || req.socket.remoteAddress || null,
                    });
                }
                catch (error) {
                    console.error('Audit log failed:', error);
                }
            })();
            return originalSend.call(this, data);
        };
        next();
    };
}
//# sourceMappingURL=audit.js.map
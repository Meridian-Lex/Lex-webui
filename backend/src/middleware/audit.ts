import { Request, Response, NextFunction } from 'express';
import { AppDataSource } from '../config/database';
import { AuditLog } from '../models/AuditLog';

export function auditLog(action: string) {
  return async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    // Store original send to intercept response
    const originalSend = res.send;

    res.send = function (data): Response {
      res.send = originalSend; // Restore original

      // Log async without blocking response
      void (async () => {
        try {
          const auditLogRepo = AppDataSource.getRepository(AuditLog);
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
        } catch (error) {
          console.error('Audit log failed:', error);
        }
      })();

      return originalSend.call(this, data);
    };

    next();
  };
}

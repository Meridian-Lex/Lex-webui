import { Request, Response, NextFunction } from 'express';

export interface AppError extends Error {
  statusCode?: number;
  details?: unknown;
}

export function errorHandler(
  err: AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void {
  console.error('Error:', err);

  const statusCode = err.statusCode || 500;
  const message = err.message || 'Internal Server Error';

  // Don't leak internal details in production
  const response: { error: string; details?: unknown } = {
    error: message,
  };

  if (process.env.NODE_ENV === 'development' && err.details) {
    response.details = err.details;
  }

  res.status(statusCode).json(response);
}

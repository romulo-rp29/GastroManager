import { Request, Response, NextFunction } from 'express';
import { logger } from '../utils/logger';

interface HttpError extends Error {
  status?: number;
  statusCode?: number;
  code?: number;
  details?: any;
}

export function errorHandler(
  err: HttpError,
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  const status = err.status || err.statusCode || err.code || 500;
  const message = err.message || 'Internal Server Error';
  const stack = process.env.NODE_ENV === 'development' ? err.stack : undefined;
  const details = err.details || undefined;

  // Log the error
  logger.error({
    message: err.message,
    status,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    details: err.details,
  });

  // Send error response
  res.status(typeof status === 'number' ? status : 500).json({
    error: {
      message,
      ...(stack && { stack }),
      ...(details && { details }),
    },
  });
}

export function notFoundHandler(req: Request, res: Response) {
  res.status(404).json({
    error: {
      message: `Cannot ${req.method} ${req.originalUrl}`,
    },
  });
}

export function asyncHandler(fn: Function) {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
}

import pino from 'pino';
import type { Request, Response } from 'express';

// Create a logger instance
const logger = pino({
  level: process.env.LOG_LEVEL || 'info',
  transport: {
    target: 'pino-pretty',
    options: {
      colorize: true,
      translateTime: 'SYS:yyyy-mm-dd HH:MM:ss',
      ignore: 'pid,hostname',
    },
  },
  formatters: {
    level: (label) => ({ level: label }),
  },
  timestamp: () => `,"time":"${new Date().toISOString()}"`,
});

// Request logging middleware
export const requestLogger = (req: Request, res: Response, next: () => void) => {
  const start = Date.now();
  const { method, url, ip, headers } = req;
  
  // Skip logging for health checks
  if (url === '/health') {
    return next();
  }

  // Log request details
  logger.info({
    type: 'request',
    method,
    url,
    ip,
    userAgent: headers['user-agent'],
    body: method !== 'GET' ? req.body : undefined,
    query: req.query,
    params: req.params,
  }, 'Incoming request');

  // Log response details when the response is finished
  res.on('finish', () => {
    const duration = Date.now() - start;
    const { statusCode } = res;
    const contentLength = res.get('content-length');
    
    logger.info({
      type: 'response',
      method,
      url,
      status: statusCode,
      duration: `${duration}ms`,
      contentLength,
    }, 'Request completed');
  });

  next();
};

// Error logging function
export const errorLogger = (error: Error, context: Record<string, any> = {}) => {
  logger.error({
    ...context,
    error: {
      message: error.message,
      stack: process.env.NODE_ENV === 'development' ? error.stack : undefined,
      name: error.name,
    },
  }, 'Error occurred');
};

// Authentication logging
export const authLogger = (message: string, user: any = {}) => {
  logger.info({
    type: 'auth',
    userId: user.id,
    userEmail: user.email,
  }, message);
};

// Database query logging
export const dbLogger = (query: string, params: any[] = [], duration: number) => {
  logger.debug({
    type: 'database',
    query,
    params,
    duration: `${duration}ms`,
  }, 'Database query executed');
};

// Security logging
export const securityLogger = (event: string, details: Record<string, any> = {}) => {
  logger.warn({
    type: 'security',
    event,
    ...details,
  }, 'Security event');
};

export { logger };

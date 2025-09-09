import { Router } from 'express';
import { authRouter } from './auth';
import { userRouter } from './users';
import { notFoundHandler } from '../middleware/errorHandler';

export function registerRoutes(app: any) {
  const router = Router();

  // Health check endpoint
  router.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
  });

  // API routes
  router.use('/auth', authRouter);
  router.use('/users', userRouter);

  // Apply the router to the app
  app.use('/api', router);

  // 404 handler for /api/* routes
  app.use('/api/*', notFoundHandler);

  return app;
}

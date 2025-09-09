// Load environment variables first
import 'dotenv/config';

// Import other modules
import express, { type Request, Response, NextFunction, Application } from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import helmet from 'helmet';
import morgan from 'morgan';
import { createServer, Server } from 'http';
import path from 'path';
import { fileURLToPath } from 'url';
import { setupVite, serveStatic, createServer as createHttpServer } from './utils/vite';
import { supabase } from './services/supabase';
import { errorHandler, notFoundHandler } from './middleware/errorHandler';
import { registerRoutes } from './routes';
import { logger } from './utils/logger';

// Import environment variables
const PORT = process.env.PORT || 5000;
const NODE_ENV = process.env.NODE_ENV || 'development';
const FRONTEND_URL = process.env.FRONTEND_URL || 'http://localhost:3000';

// Check for required environment variables
const requiredEnvVars = [
  'SUPABASE_URL',
  'SUPABASE_ANON_KEY',
  'SUPABASE_SERVICE_ROLE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Error: The following required environment variables are missing:');
  missingVars.forEach(varName => {
    if (varName.startsWith('SUPABASE_')) {
      console.error(`- ${varName} (find at: https://app.supabase.com/project/_/settings/api)`);
    } else {
      console.error(`- ${varName}`);
    }
  });
  process.exit(1);
}

// Log environment configuration (without exposing sensitive data)
console.log('🔧 Environment configuration:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`- SUPABASE_URL: ${process.env.SUPABASE_URL?.substring(0, 30)}...`);
console.log(`- Node.js: ${process.version}`);

// Initialize Express app
const app = express();

// Middleware
app.use(cors({
  origin: process.env.NODE_ENV === 'production' 
    ? process.env.FRONTEND_URL || 'https://your-production-url.com'
    : 'http://localhost:3000',
  credentials: true
}));

app.use(cookieParser());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request logging middleware
app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on('finish', () => {
    const duration = Date.now() - start;
    if (path.startsWith('/api')) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        const responsePreview = JSON.stringify(capturedJsonResponse).substring(0, 100);
        logLine += ` :: ${responsePreview}${responsePreview.length === 100 ? '...' : ''}`;
      }
      console.log(logLine);
    }
  });

  next();
});

// Health check endpoint
app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Register API routes
app.use('/api', (() => {
  const router = express.Router();
  
  // Example protected route
  router.get('/protected', async (req, res, next) => {
    try {
      // Get the token from the Authorization header
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({ error: 'No authorization token provided' });
      }
  try {
    // Get the token from the Authorization header
    const authHeader = req.headers.authorization;
    if (!authHeader) {
      return res.status(401).json({ error: 'No authorization token provided' });
    }

    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ error: 'Invalid authorization token format' });
    }

    // Verify the token with Supabase
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }

    // If we get here, the user is authenticated
    res.json({ 
      message: 'Protected data', 
      user: {
        id: user.id,
        email: user.email,
        // Add other user fields as needed
      }
    });
  } catch (error) {
    next(error);
  }
});

// Start the server
const startServer = async () => {
  try {
    // In development, use Vite's middleware
    if (NODE_ENV === 'development') {
      await setupVite(app, server);
    }

    server.listen(PORT, () => {
      logger.info(`🚀 Server is running on port ${PORT} in ${NODE_ENV} mode`);
      logger.info(`🌐 API URL: http://localhost:${PORT}/api`);
      
      if (NODE_ENV === 'development') {
        logger.info(`🖥️  Frontend dev server: ${FRONTEND_URL}`);
      }
    });
  } catch (error) {
    logger.error('❌ Failed to start server:', error);
    process.exit(1);
  }
};

// Handle unhandled promise rejections
process.on('unhandledRejection', (reason: unknown, promise: Promise<unknown>) => {
  logger.error('Unhandled Rejection at:', { promise, reason });
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle uncaught exceptions
process.on('uncaughtException', (error: Error) => {
  logger.error('Uncaught Exception:', { error });
  // Close server & exit process
  server.close(() => process.exit(1));
});

// Handle graceful shutdown
const shutdown = (signal: string) => {
  logger.info(`🛑 ${signal} received: shutting down gracefully...`);
  
  server.close(() => {
    logger.info('💤 Server stopped');
    process.exit(0);
  });

  // Force close server after 5 seconds
  setTimeout(() => {
    logger.error('⚠️ Forcing server to stop');
    process.exit(1);
  }, 5000);
};

// Listen for shutdown signals
process.on('SIGTERM', () => shutdown('SIGTERM'));
process.on('SIGINT', () => shutdown('SIGINT'));

// Start the server
startServer();

export { app, server };

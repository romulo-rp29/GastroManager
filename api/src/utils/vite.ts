import { createServer as createViteServer } from 'vite';
import express, { Express, RequestHandler } from 'express';
import { fileURLToPath } from 'url';
import path from 'path';
import { createServer as createHttpServer, Server as HttpServer } from 'http';
import { logger } from './logger';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const isProduction = process.env.NODE_ENV === 'production';
const CLIENT_BUILD_PATH = path.resolve(__dirname, '../../../client/dist');

export async function setupVite(app: Express, server: HttpServer) {
  if (isProduction) {
    return;
  }

  try {
    // Create Vite server in middleware mode
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'custom',
      logLevel: 'info',
    });

    // Use vite's connect instance as middleware
    app.use(vite.middlewares);

    logger.info('Vite development server started');
  } catch (error) {
    logger.error('Failed to start Vite dev server:', error);
    throw error;
  }
}

export function serveStatic(app: Express) {
  if (!isProduction) {
    return;
  }

  // Serve static files from the client build directory
  app.use(express.static(CLIENT_BUILD_PATH, { index: false }));

  // Handle SPA fallback for client-side routing
  app.get('*', (req, res, next) => {
    if (req.url.startsWith('/api')) {
      return next();
    }
    
    const indexFile = path.join(CLIENT_BUILD_PATH, 'index.html');
    if (fs.existsSync(indexFile)) {
      res.sendFile(indexFile);
    } else {
      res.status(404).send('Not Found');
    }
  });

  logger.info('Serving static files from', CLIENT_BUILD_PATH);
}

export function createServer(app: Express): HttpServer {
  const server = createHttpServer(app);
  return server;
}

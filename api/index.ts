// Load environment variables first
import 'dotenv/config';

// Import other modules
import express, { type Request, Response, NextFunction } from "express";
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

// Verificar se as variáveis de ambiente necessárias estão definidas
const requiredEnvVars = [
  'DATABASE_URL',
  'SUPABASE_URL',
  'SUPABASE_KEY'
];

const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);

if (missingVars.length > 0) {
  console.error('❌ Erro: As seguintes variáveis de ambiente estão faltando:');
  missingVars.forEach(varName => {
    if (varName === 'SUPABASE_KEY') {
      console.error(`- ${varName} (encontre em: https://app.supabase.com/project/_/settings/api)`);
    } else if (varName === 'SUPABASE_URL') {
      console.error(`- ${varName} (encontre em: https://app.supabase.com/project/_/settings/api)`);
    } else {
      console.error(`- ${varName}`);
    }
  });
  process.exit(1);
}

// Exibir informações de ambiente (sem expor chaves sensíveis)
console.log('🔧 Configuração do ambiente:');
console.log(`- NODE_ENV: ${process.env.NODE_ENV || 'development'}`);
console.log(`- SUPABASE_URL: ${process.env.SUPABASE_URL?.substring(0, 30)}...`);
console.log(`- DATABASE_URL: ${process.env.DATABASE_URL?.split('@')[1] ? `...@${process.env.DATABASE_URL.split('@')[1]}` : 'não configurado'}`);

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

// Configure CORS
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

// Parse JSON bodies
app.use(express.json());

// Parse URL-encoded bodies
app.use(express.urlencoded({ extended: true }));

// Parse cookies
app.use(cookieParser());

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // ALWAYS serve the app on the port specified in the environment variable PORT
  // Other ports are firewalled. Default to 5000 if not specified.
  // this serves both the API and the client.
  // It is the only port that is not firewalled.
  const PORT = 5000;

  app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
})();

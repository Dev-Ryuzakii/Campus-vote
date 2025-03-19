import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

// Add request logging middleware
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

(async () => {
  try {
    const server = await registerRoutes(app);

    // Error handling middleware
    app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
      const status = err.status || err.statusCode || 500;
      const message = err.message || "Internal Server Error";
      log(`Error: ${message}`);
      res.status(status).json({ message });
    });

    if (app.get("env") === "development") {
      await setupVite(app, server);
    } else {
      serveStatic(app);
    }

    // Use environment port or fallback to 5000
    // Only start server if not in Vercel environment
    if (process.env.VERCEL !== '1') {
      const port = process.env.PORT || 5000;
      server.listen(port, "0.0.0.0", () => {
        log(`Server running at http://0.0.0.0:${port}`);
      }).on('error', (err: any) => {
        if (err.code === 'EADDRINUSE') {
          log(`Error: Port ${port} is already in use`);
        } else if (err.code === 'EACCES') {
          log(`Error: Need elevated privileges to bind to port ${port}`);
        } else {
          log(`Error starting server: ${err.message}`);
        }
        process.exit(1);
      });
    }
  } catch (error) {
    log(`Fatal error: ${error}`);
    process.exit(1);
  }
})();
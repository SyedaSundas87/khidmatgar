import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = process.env.PORT ? parseInt(process.env.PORT) : 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

  // ──────────────────────────────────────────────────────────
  // CORS Middleware — required for Capacitor native WebView
  // The APK loads from https://localhost (Capacitor default),
  // so cross-origin requests to Cloud Run are blocked without this.
  // ──────────────────────────────────────────────────────────
  const ALLOWED_ORIGINS = [
    'https://localhost',           // Capacitor Android (default scheme)
    'http://localhost',            // Capacitor Android (legacy / fallback)
    'capacitor://localhost',       // Capacitor iOS
    'http://localhost:3000',       // Local dev
    'http://localhost:5173',       // Vite dev server
  ];

  app.use((req, res, next) => {
    const origin = req.headers.origin;
    if (origin && ALLOWED_ORIGINS.includes(origin)) {
      res.setHeader('Access-Control-Allow-Origin', origin);
    } else if (!origin) {
      // Allow requests with no origin (e.g. server-to-server, curl, mobile apps)
      res.setHeader('Access-Control-Allow-Origin', '*');
    }
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
    res.setHeader('Access-Control-Max-Age', '86400');

    // Handle preflight OPTIONS requests immediately
    if (req.method === 'OPTIONS') {
      return res.status(204).end();
    }
    next();
  });

  // API Proxy Route for Webhooks
  app.post("/api/proxy", async (req, res) => {
    const { endpoint, ...body } = req.body;
    if (!endpoint) {
      return res.status(400).json({ error: "Endpoint is required" });
    }

    const url = `https://n8ndigitalstudio.duckdns.org/webhook/${endpoint}`;
    console.log(`[Proxy] Forwarding to: ${url}`);
    
    try {
      const response = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      console.log(`[Proxy] Success! Status: ${response.status}`);
      const text = await response.text();
      res.status(response.status).send(text);
    } catch (error: any) {
      console.error(`[Proxy] Critical Error: ${error.message} - stack: ${error.stack}`);
      res.status(500).json({ error: "Failed to forward request", details: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development (auto-detects Cloud Run environment to serve production build)
  const isProduction = process.env.NODE_ENV === "production" || !!process.env.K_SERVICE || !!process.env.PORT;
  if (!isProduction) {
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        allowedHosts: true
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

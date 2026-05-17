import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: '50mb' }));
  app.use(express.urlencoded({ limit: '50mb', extended: true }));

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
      console.error(`[Proxy] Critical Error: ${error.message}`);
      res.status(500).json({ error: "Failed to forward request", details: error.message });
    }
  });

  // Health check
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok" });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
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

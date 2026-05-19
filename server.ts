import dotenv from "dotenv";
dotenv.config();

import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import cluster from "node:cluster";
import { availableParallelism } from "node:os";
import app from "./server/app.js";

const numCPUs = availableParallelism();

async function startServer() {
  const PORT = 3000;

  // API health check - define before Vite middleware
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    console.log("Starting Vite development server...");
    const vite = await createViteServer({
      server: { 
        middlewareMode: true,
        hmr: false // Disable HMR for stability in this environment
      },
      appType: "spa",
    });
    app.use(vite.middlewares);
    console.log("Vite middleware attached.");
  } else {
    const distPath = path.join(process.cwd(), "dist");
    
    app.use(express.static(distPath, {
      maxAge: "1d",
      etag: true,
    }));

    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

// Start the server directly
startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

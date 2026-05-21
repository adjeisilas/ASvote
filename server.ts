import dotenv from "dotenv";
dotenv.config();

import express from "express";
import nextSource from "next";
import path from "path";
import app from "./server/app.js";

async function startServer() {
  const PORT = 3000;
  const dev = process.env.NODE_ENV !== "production";

  console.log(`Starting Next.js custom full-stack engine in ${dev ? 'development' : 'production'} mode...`);
  const nextApp = nextSource({ dev, dir: process.cwd() });
  const nextHandler = nextApp.getRequestHandler();

  await nextApp.prepare();
  console.log("Next.js prepared and loaded.");

  // API health check - define before Next.js routing takes over
  app.get("/api/health", (req, res) => {
    res.json({ status: "ok", env: process.env.NODE_ENV });
  });

  // Fallback to Next.js for page transitions, static serving, and layouts
  app.all("*", (req, res) => {
    return nextHandler(req, res);
  });

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server listening on port ${PORT} in ${process.env.NODE_ENV || 'development'} mode`);
  });
}

// Start the server directly
startServer().catch(err => {
  console.error("Failed to start server:", err);
  process.exit(1);
});

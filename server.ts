import dotenv from "dotenv";
dotenv.config();

import { createServer } from "http";
import { parse } from "url";
import next from "next";

const dev = process.env.NODE_ENV !== "production";
const app = next({ dev, dir: process.cwd() });
const handle = app.getRequestHandler();

app.prepare().then(() => {
  createServer((req, res) => {
    const parsedUrl = parse(req.url || "", true);
    
    // Log incoming requests for dev debugging
    console.log(`[HTTP] ${req.method} ${parsedUrl.pathname}`);
    
    const originalEnd = res.end;
    res.end = function (...args: any[]) {
      console.log(`[HTTP RESP] ${req.method} ${parsedUrl.pathname} - Status: ${res.statusCode}`);
      return originalEnd.apply(this, args);
    };

    try {
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error(`Uncaught error handling ${req.method} ${req.url}:`, err);
      res.statusCode = 500;
      res.end("Internal Server Error");
    }
  }).listen(3000, () => {
    console.log("> Next.js Server listening on port 3000 natively");
  });
}).catch((err) => {
  console.error("Failed to start custom server:", err);
  process.exit(1);
});

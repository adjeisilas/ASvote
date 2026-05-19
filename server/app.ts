import express from "express";
import dotenv from "dotenv";
import * as Sentry from "@sentry/node";
import { nodeProfilingIntegration } from "@sentry/profiling-node";
import cors from "cors";
import compression from "compression";
import { rateLimit } from "express-rate-limit";
import apiRoutes from "./routes";
import { cacheMiddleware } from "./middleware/cache";

dotenv.config();

if (process.env.SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.SENTRY_DSN,
    integrations: [
      nodeProfilingIntegration(),
    ],
    tracesSampleRate: 1.0,
    profilesSampleRate: 1.0,
  });
}

const app = express();

// Performance: Enable Gzip compression
app.use(compression());

// Trust proxy for accurate IP-based rate limiting
app.set("trust proxy", 1);

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


// General API Limiter: 100 requests per 15 minutes
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many requests, please try again later." }
});

// Cache frequently accessed data (GET requests) for 1 minute by default
app.use("/api", cacheMiddleware(60));
app.use("/api", apiLimiter);
app.use("/api", apiRoutes);

// The error handler must be registered before any other error middleware and after all controllers
if (process.env.SENTRY_DSN) {
  Sentry.setupExpressErrorHandler(app);
}

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  const message = err.message || "An unexpected server error occurred";
  
  console.error(`[SERVER ERROR] ${req.method} ${req.url}:`, {
    message: message,
    status: status,
    stack: err.stack,
    details: err.details || err.issues
  });
  
  res.status(status).json({
    success: false,
    error: err.name || "Server Error",
    message: message,
    details: process.env.NODE_ENV === "development" ? err.stack : (err.details || err.issues || "No additional details available"),
    code: status,
    path: req.path
  });
});

export default app;

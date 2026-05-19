import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import apiRoutes from "./routes";

dotenv.config();

const app = express();

app.get("/api/ping", (req, res) => {
  res.json({ 
    status: "ok", 
    message: "Server is responsive", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use("/api", apiRoutes);

// Global error handler
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  const status = err.status || err.statusCode || 500;
  let message = err.message || "An unexpected server error occurred";
  
  // Log the full error for debugging
  console.error(`[SERVER ERROR] ${req.method} ${req.url}:`, {
    message: message,
    status: status,
    stack: err.stack,
    details: err.details || err.issues || err.response?.data,
    name: err.name,
    code: err.code
  });

  // Check for common initialization errors
  if (message.includes("Supabase client not initialized")) {
    message = "Database connection error. Please ensure environment variables (SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY) are correctly configured in your hosting environment.";
  }
  
  res.status(status).json({
    success: false,
    error: err.name || "Server Error",
    message: message,
    details: process.env.NODE_ENV === "development" ? err.stack : (err.details || err.issues || "No additional details available"),
    code: status,
    path: req.path,
    timestamp: new Date().toISOString()
  });
});

export default app;

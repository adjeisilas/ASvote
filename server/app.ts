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

app.get("/api/db-status", async (req, res) => {
  try {
    const { supabase } = await import("./lib/supabase");
    const { data, error } = await supabase.from('events').select('count', { count: 'exact', head: true });
    
    res.json({
      status: error ? "error" : "success",
      url_configured: !!process.env.SUPABASE_URL,
      key_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      connection: error ? "failed" : "ok",
      error: error ? error.message : null,
      details: error
    });
  } catch (err: any) {
    res.status(500).json({
      status: "crash",
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  }
});

app.get("/api/env-check", (req, res) => {
  res.json({
    supabase_url: !!process.env.SUPABASE_URL,
    supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    paystack_key: !!process.env.PAYSTACK_SECRET_KEY,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV || "not detected"
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

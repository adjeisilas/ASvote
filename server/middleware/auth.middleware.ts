import { Request, Response, NextFunction } from "express";
import { supabase } from "../lib/supabase.js";

export const authenticateUser = async (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return res.status(401).json({ error: "Invalid or expired token." });
    }

    // Attach user to request object
    (req as any).user = user;
    next();
  } catch (err: any) {
    console.error("Auth middleware error:", err.message);
    res.status(500).json({ error: "Server authentication error." });
  }
};

export const requireAdmin = async (req: Request, res: Response, next: NextFunction) => {
  const user = (req as any).user;
  
  if (!user) {
    return res.status(401).json({ error: "Authentication required." });
  }

  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", user.id)
      .single();

    if (error || profile?.role !== "admin") {
      return res.status(403).json({ error: "Access denied. Admin role required." });
    }

    next();
  } catch (err: any) {
    console.error("Admin role check error:", err.message);
    res.status(500).json({ error: "Role verification error." });
  }
};

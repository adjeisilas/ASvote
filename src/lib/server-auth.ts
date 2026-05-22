import { NextRequest } from "next/server";
import { supabase } from "../../server/lib/supabase";

export interface AuthenticatedUser {
  id: string;
  email?: string;
}

export async function getAuthUser(req: NextRequest): Promise<{ user?: AuthenticatedUser; error?: string; status?: number }> {
  const authHeader = req.headers.get("authorization");
  
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return { error: "Access denied. No token provided.", status: 401 };
  }

  const token = authHeader.split(" ")[1];

  try {
    const { data: { user }, error } = await supabase.auth.getUser(token);
    
    if (error || !user) {
      return { error: "Invalid or expired token.", status: 401 };
    }

    return { user: user as AuthenticatedUser };
  } catch (err: any) {
    console.error("Auth helper error:", err.message);
    return { error: "Server authentication error.", status: 500 };
  }
}

export async function requireAdmin(userId: string): Promise<{ ok: boolean; error?: string; status?: number }> {
  try {
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", userId)
      .single();

    if (error || profile?.role !== "admin") {
      return { ok: false, error: "Access denied. Admin role required.", status: 403 };
    }

    return { ok: true };
  } catch (err: any) {
    console.error("Admin role check error:", err.message);
    return { ok: false, error: "Role verification error.", status: 500 };
  }
}

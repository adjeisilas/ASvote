import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let internalClient: any = null;

const getSupabase = () => {
  if (internalClient) return internalClient;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey) {
    console.warn("Supabase credentials missing. Check environment variables.");
    // We don't throw yet to allow non-Supabase parts of the app to function
    return null;
  }

  internalClient = createClient(supabaseUrl, supabaseServiceKey);
  return internalClient;
};

export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabase();
    if (!client) {
      throw new Error(`Supabase client not initialized. Missing credentials for property: ${String(prop)}`);
    }
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

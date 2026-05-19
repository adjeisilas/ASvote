import { createClient, SupabaseClient } from '@supabase/supabase-js';

let internalClient: SupabaseClient | null = null;

/**
 * Lazy-loaded Supabase client.
 * This prevents the app from crashing on startup if environment variables are missing.
 * The error will only be thrown when the client is actually accessed.
 */
export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!internalClient) {
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
      const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

      if (!supabaseUrl || !supabaseAnonKey) {
        const errorMsg = 'Supabase credentials missing. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your environment variables (Secrets panel).';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      if (!supabaseUrl.startsWith('http')) {
        const errorMsg = 'Invalid VITE_SUPABASE_URL format. It must start with http:// or https://';
        console.error(errorMsg);
        throw new Error(errorMsg);
      }

      internalClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    
    const value = (internalClient as any)[prop];
    return typeof value === 'function' ? value.bind(internalClient) : value;
  }
});

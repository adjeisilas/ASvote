import { NextResponse } from "next/server";
import { supabase } from "../../../../server/lib/supabase";

export async function GET() {
  try {
    const { error } = await supabase.from('events').select('count', { count: 'exact', head: true });
    
    return NextResponse.json({
      status: error ? "error" : "success",
      url_configured: !!process.env.SUPABASE_URL,
      key_configured: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
      connection: error ? "failed" : "ok",
      error: error ? error.message : null,
      details: error
    });
  } catch (err: any) {
    return NextResponse.json({
      status: "crash",
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    }, { status: 500 });
  }
}
export const dynamic = "force-dynamic";

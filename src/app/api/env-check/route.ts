import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({
    supabase_url: !!process.env.SUPABASE_URL,
    supabase_key: !!process.env.SUPABASE_SERVICE_ROLE_KEY,
    paystack_key: !!process.env.PAYSTACK_SECRET_KEY,
    node_env: process.env.NODE_ENV,
    vercel_env: process.env.VERCEL_ENV || "not detected"
  });
}
export const dynamic = "force-dynamic";

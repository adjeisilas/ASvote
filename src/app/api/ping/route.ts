import { NextResponse } from "next/server";

export async function GET() {
  return NextResponse.json({ 
    status: "ok", 
    message: "Server is responsive", 
    timestamp: new Date().toISOString(),
    env: process.env.NODE_ENV
  });
}

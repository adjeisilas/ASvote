import { NextRequest, NextResponse } from "next/server";
import { sendSupportEmail } from "../../../../../server/lib/email";

export async function POST(req: NextRequest) {
  try {
    const { name, email, subject, message } = await req.json();

    if (!name || !email || !subject || !message) {
      return NextResponse.json(
        { error: "All support ticket fields are required." },
        { status: 400 }
      );
    }

    await sendSupportEmail(name, email, subject, message);
    return NextResponse.json({
      success: true,
      message: "Your support ticket has been registered. Our help desk will contact you shortly."
    });
  } catch (err: any) {
    console.error("Support API route failure:", err);
    return NextResponse.json(
      { error: err.message || "Failed to process support ticket email dispatch." },
      { status: 500 }
    );
  }
}

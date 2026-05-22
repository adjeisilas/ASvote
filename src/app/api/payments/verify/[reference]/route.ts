import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackPayment } from "../../../../../../server/services/payment.service";

interface RouteProps {
  params: Promise<{ reference: string }>;
}

export async function GET(req: NextRequest, props: RouteProps) {
  try {
    const params = await props.params;
    const { reference } = params;

    if (!reference) {
      return NextResponse.json({ error: "Reference parameter is required" }, { status: 400 });
    }

    const result = await verifyPaystackPayment(reference);
    return NextResponse.json(result);
  } catch (error: any) {
    console.error("Payment verification route error:", error.message);
    return NextResponse.json({ 
      error: "Payment verification failed", 
      details: error.message 
    }, { status: 500 });
  }
}

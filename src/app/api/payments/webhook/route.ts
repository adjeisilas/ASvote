import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { processSuccessfulPayment } from "../../../../../server/services/voting.service";
import { voteDataSchema } from "../../../../../server/lib/schemas";

export async function POST(req: NextRequest) {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    return new Response("PAYSTACK_SECRET_KEY not configured", { status: 500 });
  }

  try {
    const signature = req.headers.get("x-paystack-signature") || "";
    const bodyText = await req.text();

    const hash = crypto
      .createHmac("sha512", PAYSTACK_SECRET_KEY)
      .update(bodyText)
      .digest("hex");

    if (hash !== signature) {
      console.warn("Webhook Signature Mismatch! Provided:", signature, "Calculated:", hash);
      return new Response("Invalid Signature", { status: 400 });
    }

    const event = JSON.parse(bodyText);
    
    if (event.event === "charge.success") {
      let { reference, metadata } = event.data;
      
      if (typeof metadata === 'string') {
        try { 
          metadata = JSON.parse(metadata); 
        } catch (e) {
          console.error("Error parsing string metadata:", e);
        }
      }

      if (metadata && metadata.voteData) {
        try {
          const voteDataToValidate = { ...metadata.voteData };
          if (voteDataToValidate.votes !== undefined) voteDataToValidate.votes = Number(voteDataToValidate.votes);
          if (voteDataToValidate.quantity !== undefined) voteDataToValidate.quantity = Number(voteDataToValidate.quantity);
          if (voteDataToValidate.amount !== undefined) voteDataToValidate.amount = Number(voteDataToValidate.amount);
          if (voteDataToValidate.commission !== undefined) voteDataToValidate.commission = Number(voteDataToValidate.commission);
          if (voteDataToValidate.discount_applied !== undefined) voteDataToValidate.discount_applied = Number(voteDataToValidate.discount_applied);

          const validatedVoteData = await voteDataSchema.parseAsync(voteDataToValidate);
          await processSuccessfulPayment(reference, validatedVoteData);
        } catch (err: any) {
          console.error("Webhook processing/validation error:", err.message);
        }
      }
    }

    return new Response("OK", { status: 200 });
  } catch (err: any) {
    console.error("Webhook main handler error:", err.message);
    return new Response(`Error: ${err.message}`, { status: 500 });
  }
}

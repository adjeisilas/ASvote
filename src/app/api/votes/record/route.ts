import { NextRequest, NextResponse } from "next/server";
import { verifyPaystackPayment } from "../../../../../server/services/payment.service";
import { processSuccessfulPayment } from "../../../../../server/services/voting.service";
import { voteDataSchema } from "../../../../../server/lib/schemas";

export async function POST(req: NextRequest) {
  let reference = "NO_REF";
  try {
    const body = await req.json() || {};
    const { voteData: clientVoteData, reference: ref } = body;
    reference = ref || "NO_REF";

    if (!reference || reference === "NO_REF") {
      console.warn("Reference missing in request body");
      return NextResponse.json({ success: false, error: "Payment reference is required" }, { status: 400 });
    }

    // 1. Verify Payment with Paystack
    const verifyRes = await verifyPaystackPayment(reference).catch(e => {
      console.error(`[${reference}] Paystack API crash:`, e.message);
      throw e;
    });

    if (!verifyRes || !verifyRes.status || !verifyRes.data || verifyRes.data.status !== "success") {
      console.warn(`[${reference}] Paystack verification failed or non-success status:`, verifyRes?.data?.status);
      return NextResponse.json({ 
        success: false, 
        error: "Payment verification failed",
        details: verifyRes ? (verifyRes.message || "Status not success") : "No response from Paystack"
      }, { status: 400 });
    }

    // 2. Metadata Processing
    let finalVoteData = clientVoteData;
    const paystackMetadata = verifyRes.data.metadata;
    
    if (paystackMetadata && (paystackMetadata.voteData || paystackMetadata.custom_fields)) {
      const metaVoteData = paystackMetadata.voteData || paystackMetadata;
      finalVoteData = metaVoteData;
      if (typeof finalVoteData === 'string') {
        try { 
          finalVoteData = JSON.parse(finalVoteData); 
        } catch (e) {
          console.error(`[${reference}] JSON parse error for Paystack metadata string:`, e);
        }
      }
    }
    
    if (!finalVoteData) {
      console.error(`[${reference}] CRITICAL: No voteData found in request OR Paystack metadata`);
      return NextResponse.json({ success: false, error: "Missing vote data" }, { status: 400 });
    }

    // Enforce numeric types and property mapping
    const dataToValidate = { ...finalVoteData };
    if (dataToValidate.votes !== undefined) dataToValidate.votes = Number(dataToValidate.votes);
    if (dataToValidate.quantity !== undefined) dataToValidate.quantity = Number(dataToValidate.quantity);
    if (dataToValidate.amount !== undefined) dataToValidate.amount = Number(dataToValidate.amount);
    if (dataToValidate.commission !== undefined) dataToValidate.commission = Number(dataToValidate.commission);
    if (dataToValidate.discount_applied !== undefined) dataToValidate.discount_applied = Number(dataToValidate.discount_applied);

    // 3. Validation
    const validatedVoteData = await voteDataSchema.parseAsync(dataToValidate).catch(e => {
      console.error(`[${reference}] Zod validation failed:`, e.errors || e.message);
      throw e;
    });

    // 4. Amount Verification
    const paidAmount = verifyRes.data.amount / 100;
    if (Math.abs(paidAmount - validatedVoteData.amount) > 0.05) {
      console.warn(`[${reference}] Amount mismatch: Paid ${paidAmount}, Expected ${validatedVoteData.amount}`);
      return NextResponse.json({ 
        success: false,
        error: "Amount mismatch check failed",
        expected: validatedVoteData.amount,
        paid: paidAmount
      }, { status: 400 });
    }

    // 5. Success
    const result = await processSuccessfulPayment(reference, validatedVoteData).catch(e => {
      console.error(`[${reference}] processSuccessfulPayment CRASHED:`, e);
      throw e;
    });
    
    if (!result || !result.success) {
      console.error(`[${reference}] Database recording logic returned failure structure:`, result);
      return NextResponse.json({
        success: false,
        error: "Database processing failed",
        message: (result as any)?.message || "Internal database processing error",
        details: result,
        ref: reference
      }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      message: "Payment verified and recorded successfully",
      data: result.transaction,
      ref: reference
    });
  } catch (error: any) {
    console.error(`[${reference || 'NO_REF'}] Controller catch block triggered:`, error);
    
    const statusCode = error.name === 'ZodError' ? 400 : (error.response?.status || 500);
    const errorMessage = error.message || "Unknown internal error";
    
    return NextResponse.json({ 
      success: false,
      error: error.name === 'ZodError' ? "Validation Error" : "Processing Error", 
      message: errorMessage,
      details: error.response?.data || error.details || error.issues || "Check server logs",
      code: statusCode,
      ref: reference || "missing"
    }, { status: statusCode });
  }
}

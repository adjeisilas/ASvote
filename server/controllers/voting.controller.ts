import { Request, Response } from "express";
import { verifyPaystackPayment } from "../services/payment.service";
import { processSuccessfulPayment } from "../services/voting.service";
import { voteDataSchema } from "../lib/schemas";

export const recordVote = async (req: Request, res: Response) => {
  console.log("recordVote controller started");
  const body = req.body || {};
  const { voteData: clientVoteData, reference } = body;
  
  console.log("Request details:", { 
    reference, 
    hasVoteData: !!clientVoteData,
    method: req.method,
    headers: req.headers['content-type']
  });

  try {
    if (!reference) {
      console.warn("Reference missing in request body");
      return res.status(400).json({ success: false, error: "Payment reference is required" });
    }
    // 1. Verify Payment with Paystack
    console.log(`[${reference}] Verifying payment with Paystack...`);
    const verifyRes = await verifyPaystackPayment(reference).catch(e => {
        console.error(`[${reference}] Paystack API crash:`, e.message);
        throw e;
    });

    if (!verifyRes || !verifyRes.status || !verifyRes.data || verifyRes.data.status !== "success") {
      console.warn(`[${reference}] Paystack verification failed or non-success status:`, verifyRes?.data?.status);
      return res.status(400).json({ 
        success: false, 
        error: "Payment verification failed",
        details: verifyRes ? (verifyRes.message || "Status not success") : "No response from Paystack"
      });
    }

    console.log(`[${reference}] Paystack confirmed success. Amount: ${verifyRes.data.amount / 100}`);

    // 2. Metadata Processing
    let finalVoteData = clientVoteData;
    const paystackMetadata = verifyRes.data.metadata;
    
    if (paystackMetadata && (paystackMetadata.voteData || paystackMetadata.custom_fields)) {
      console.log(`[${reference}] Using metadata from Paystack response`);
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
      return res.status(400).json({ success: false, error: "Missing vote data" });
    }

    // Enforce numeric types and property mapping
    const dataToValidate = { ...finalVoteData };
    if (dataToValidate.votes !== undefined) dataToValidate.votes = Number(dataToValidate.votes);
    if (dataToValidate.quantity !== undefined) dataToValidate.quantity = Number(dataToValidate.quantity);
    if (dataToValidate.amount !== undefined) dataToValidate.amount = Number(dataToValidate.amount);
    if (dataToValidate.commission !== undefined) dataToValidate.commission = Number(dataToValidate.commission);
    if (dataToValidate.discount_applied !== undefined) dataToValidate.discount_applied = Number(dataToValidate.discount_applied);

    // 3. Validation
    console.log(`[${reference}] Validating with Zod...`);
    const validatedVoteData = await voteDataSchema.parseAsync(dataToValidate).catch(e => {
        console.error(`[${reference}] Zod validation failed:`, e.errors || e.message);
        throw e;
    });

    // 4. Amount Verification
    const paidAmount = verifyRes.data.amount / 100;
    if (Math.abs(paidAmount - validatedVoteData.amount) > 0.05) {
      console.warn(`[${reference}] Amount mismatch: Paid ${paidAmount}, Expected ${validatedVoteData.amount}`);
      return res.status(400).json({ 
        success: false,
        error: "Amount mismatch check failed",
        expected: validatedVoteData.amount,
        paid: paidAmount
      });
    }

    // 5. Success
    console.log(`[${reference}] Recording vote/ticket in database via voting.service...`);
    const result = await processSuccessfulPayment(reference, validatedVoteData).catch(e => {
        console.error(`[${reference}] processSuccessfulPayment CRASHED:`, e);
        throw e;
    });
    
    if (!result || !result.success) {
      console.error(`[${reference}] Database recording logic returned failure structure:`, result);
      return res.status(500).json({
        success: false,
        error: "Database processing failed",
        message: (result as any)?.message || "Internal database processing error",
        details: result,
        ref: reference
      });
    }

    console.log(`[${reference}] RECORDING SUCCESSFUL!`);
    return res.json({
      success: true,
      message: "Payment verified and recorded successfully",
      data: result.transaction,
      ref: reference
    });
  } catch (error: any) {
    console.error(`[${reference || 'NO_REF'}] Controller catch block triggered:`, error);
    
    const statusCode = error.name === 'ZodError' ? 400 : (error.response?.status || 500);
    const errorMessage = error.message || "Unknown internal error";
    
    return res.status(statusCode).json({ 
      success: false,
      error: error.name === 'ZodError' ? "Validation Error" : "Processing Error", 
      message: errorMessage,
      details: error.response?.data || error.details || error.issues || "Check server logs",
      code: statusCode,
      ref: reference || "missing"
    });
  }
};

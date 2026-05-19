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
      return res.status(400).json({ success: false, error: "Payment reference is required" });
    }
    // 1. Verify Payment with Paystack
    console.log("Verifying payment with Paystack, ref:", reference);
    const verifyRes = await verifyPaystackPayment(reference);

    if (!verifyRes || !verifyRes.status || !verifyRes.data || verifyRes.data.status !== "success") {
      console.warn("Paystack verification fail:", verifyRes);
      return res.status(400).json({ 
        success: false, 
        error: "Payment verification failed",
        details: verifyRes ? verifyRes.message : "No response from Paystack"
      });
    }

    // 2. Metadata Processing
    let finalVoteData = clientVoteData;
    const paystackMetadata = verifyRes.data.metadata;
    
    if (paystackMetadata && (paystackMetadata.voteData || paystackMetadata.custom_fields)) {
      console.log("Found metadata in Paystack response");
      const metaVoteData = paystackMetadata.voteData || paystackMetadata;
      finalVoteData = metaVoteData;
      if (typeof finalVoteData === 'string') {
        try { finalVoteData = JSON.parse(finalVoteData); } catch (e) {
          console.error("JSON parse error for Paystack metadata");
        }
      }
    }
    
    if (!finalVoteData) {
      console.error("Critical: No voteData found in request body or Paystack metadata");
      return res.status(400).json({ success: false, error: "Missing vote data" });
    }

    // Enforce numeric types for Zod
    if (finalVoteData.votes !== undefined) finalVoteData.votes = Number(finalVoteData.votes);
    if (finalVoteData.quantity !== undefined) finalVoteData.quantity = Number(finalVoteData.quantity);
    if (finalVoteData.amount !== undefined) finalVoteData.amount = Number(finalVoteData.amount);

    // 3. Validation
    console.log("Validating with Zod...");
    const validatedVoteData = await voteDataSchema.parseAsync(finalVoteData);

    // 4. Amount Verification
    const paidAmount = verifyRes.data.amount / 100;
    if (Math.abs(paidAmount - validatedVoteData.amount) > 0.05) {
      console.warn("Payment amount mismatch:", { paid: paidAmount, expected: validatedVoteData.amount });
      return res.status(400).json({ 
        success: false,
        error: "Amount mismatch check failed",
        expected: validatedVoteData.amount,
        paid: paidAmount
      });
    }

    // 5. Success
    console.log("Recording vote/ticket in database...");
    const result = await processSuccessfulPayment(reference, validatedVoteData);
    
    if (!result.success) {
      console.error("Database recording failed:", result);
      return res.status(400).json(result);
    }

    console.log("Successfully recorded vote/ticket!");
    return res.json(result);
  } catch (error: any) {
    console.error("Controller CRASH:", error);
    
    const statusCode = error.name === 'ZodError' ? 400 : (error.response?.status || 500);
    const errorMessage = error.message || "Unknown internal error";
    
    return res.status(statusCode).json({ 
      success: false,
      error: error.name === 'ZodError' ? "Validation Error" : "Processing Error", 
      message: errorMessage,
      details: error.response?.data || error.details || error.issues || (process.env.NODE_ENV === 'development' ? error.stack : "Check server logs"),
      code: statusCode,
      ref: reference
    });
  }
};

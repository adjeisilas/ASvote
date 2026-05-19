import { Request, Response } from "express";
import { verifyPaystackPayment } from "../services/payment.service";
import { processSuccessfulPayment } from "../services/voting.service";
import { voteDataSchema } from "../lib/schemas";

export const recordVote = async (req: Request, res: Response) => {
  console.log("recordVote controller started");
  try {
    const { voteData: clientVoteData, reference } = req.body;
    console.log("Request body received:", { reference, hasVoteData: !!clientVoteData });

    if (!reference) {
      return res.status(400).json({ error: "Payment reference is required" });
    }
    // 1. Verify Payment with Paystack
    const verifyRes = await verifyPaystackPayment(reference);

    if (!verifyRes.status || verifyRes.data.status !== "success") {
      return res.status(400).json({ error: "Payment not successful or not found" });
    }

    // 2. Prioritize Metadata from Paystack (Security: prevents client-side forging of voteData)
    let finalVoteData = clientVoteData;
    const paystackMetadata = verifyRes.data.metadata;
    
    if (paystackMetadata && paystackMetadata.voteData) {
      // If Paystack has the voteData, we trust it more than the request body
      finalVoteData = paystackMetadata.voteData;
      
      // Parse if it was stringified by Paystack
      if (typeof finalVoteData === 'string') {
        try { finalVoteData = JSON.parse(finalVoteData); } catch (e) {}
      }
    }

    // 3. One final validation just in case
    const validatedVoteData = await voteDataSchema.parseAsync(finalVoteData);

    // 4. Verification Check: Ensure the amount paid matches the voteData amount
    const paidAmount = verifyRes.data.amount / 100; // Paystack is in kobo/pesewas
    if (Math.abs(paidAmount - validatedVoteData.amount) > 0.01) {
      return res.status(400).json({ 
        error: "Verification failed: Paid amount does not match order amount",
        expected: validatedVoteData.amount,
        paid: paidAmount
      });
    }

    // 5. Process Vote/Ticket
    console.log("Processing successful payment for ref:", reference);
    const result = await processSuccessfulPayment(reference, validatedVoteData);
    console.log("Process complete for ref:", reference, "Result:", result.success ? "Success" : "Failed");
    
    if (!result.success) {
      return res.status(400).json(result);
    }

    res.json(result);
  } catch (error: any) {
    console.error("Vote recording error for ref:", reference || "NO_REF", error);
    
    // Extract error details safely
    const errorDetails = error.response?.data || error.details || error.issues || error.stack;
    const statusCode = error.name === 'ZodError' ? 400 : (error.response?.status || 500);
    const errorMessage = error.message || "Failed to record vote";
    
    // Using a very explicit structure to bypass any generic handlers if possible
    res.status(statusCode).json({ 
      success: false,
      error: error.name === 'ZodError' ? "Validation error" : "Failed to record vote", 
      message: errorMessage,
      details: errorDetails,
      code: statusCode,
      name: error.name,
      ref: reference
    });
  }
};

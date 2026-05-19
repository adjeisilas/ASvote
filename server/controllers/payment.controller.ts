import { Request, Response } from "express";
import crypto from "crypto";
import { verifyPaystackPayment } from "../services/payment.service.js";
import { processSuccessfulPayment } from "../services/voting.service.js";
import { voteDataSchema } from "../lib/schemas.js";

export const verifyPayment = async (req: Request, res: Response) => {
  const { reference } = req.params;
  try {
    const result = await verifyPaystackPayment(reference as string);
    res.json(result);
  } catch (error: any) {
    res.status(500).json({ error: "Payment verification failed", details: error.message });
  }
};

export const handleWebhook = async (req: Request, res: Response) => {
  const PAYSTACK_SECRET_KEY = process.env.PAYSTACK_SECRET_KEY;
  if (!PAYSTACK_SECRET_KEY) {
    return res.sendStatus(500);
  }

  const hash = crypto
    .createHmac("sha512", PAYSTACK_SECRET_KEY)
    .update(JSON.stringify(req.body))
    .digest("hex");

  const signature = req.headers["x-paystack-signature"];
  const signatureStr = Array.isArray(signature) ? signature[0] : signature;

  if (hash !== signatureStr) {
    return res.sendStatus(400);
  }

  const event = req.body;
  
  if (event.event === "charge.success") {
    let { reference, metadata } = event.data;
    
    if (typeof metadata === 'string') {
      try { metadata = JSON.parse(metadata); } catch (e) {}
    }

    if (metadata && metadata.voteData) {
      try {
        // Validate with Zod before processing
        const validatedVoteData = await voteDataSchema.parseAsync(metadata.voteData);
        await processSuccessfulPayment(reference, validatedVoteData);
        console.log(`Webhook: Successfully processed ref ${reference}`);
      } catch (err: any) {
        console.error("Webhook processing/validation error:", err.message);
      }
    }
  }

  res.sendStatus(200);
};

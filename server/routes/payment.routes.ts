import { Router } from "express";
import { verifyPayment, handleWebhook } from "../controllers/payment.controller.ts";
import { rateLimit } from "express-rate-limit";

const router = Router();

const paymentLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
});

router.get("/verify/:reference", paymentLimiter, verifyPayment);
router.post("/webhook", handleWebhook);

export default router;

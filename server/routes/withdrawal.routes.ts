import { Router } from "express";
import { requestWithdrawal } from "../controllers/withdrawal.controller";
import { validate } from "../middleware/validate";
import { requestWithdrawalSchema } from "../lib/schemas";
import { rateLimit } from "express-rate-limit";
import { authenticateUser } from "../middleware/auth.middleware";

const router = Router();

// Strict limiter for withdrawals to prevent brute-force or abuse
const withdrawalLimiter = rateLimit({
  windowMs: 60 * 60 * 1000, // 1 hour
  max: 10, // 10 requests per hour per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Withdrawal request limit reached. Please wait an hour." }
});

router.use(authenticateUser);

router.post("/request", withdrawalLimiter, validate(requestWithdrawalSchema), requestWithdrawal);

export default router;

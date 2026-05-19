import { Router } from "express";
import { recordVote } from "../controllers/voting.controller";
import { rateLimit } from "express-rate-limit";
import { validate } from "../middleware/validate";
import { recordVoteSchema } from "../lib/schemas";

const router = Router();

const voteLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 50,
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "You've reached the limit for voting attempts. Please wait 15 minutes." }
});

router.post("/record", voteLimiter, validate(recordVoteSchema), recordVote);

export default router;

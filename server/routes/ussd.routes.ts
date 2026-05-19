import { Router } from "express";
import { handleUSSD } from "../controllers/ussd.controller.js";
import { validate } from "../middleware/validate.js";
import { ussdSchema } from "../lib/schemas.js";
import { rateLimit } from "express-rate-limit";

const router = Router();

// Stricter limiter for USSD gateway to prevent spam
const ussdLimiter = rateLimit({
  windowMs: 5 * 60 * 1000, // 5 minutes
  max: 20, // 20 requests per 5 minutes per IP
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "USSD session limit reached. Please wait a few minutes." }
});

router.get("/", (req, res) => {
  res.send("CON USSD Service is running. Please use POST to interact with this endpoint.");
});

router.post("/", ussdLimiter, validate(ussdSchema), handleUSSD);

export default router;

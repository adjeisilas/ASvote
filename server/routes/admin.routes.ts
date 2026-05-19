import { Router } from "express";
import { deleteUserAuth } from "../controllers/admin.controller.ts";
import { validate } from "../middleware/validate.ts";
import { deleteUserAuthSchema } from "../lib/schemas.ts";
import { rateLimit } from "express-rate-limit";
import { authenticateUser, requireAdmin } from "../middleware/auth.middleware.ts";

const router = Router();

// Strict limiter for admin actions
const adminLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 20, // 20 requests per 15 mins
  standardHeaders: true,
  legacyHeaders: false,
  message: { error: "Too many admin requests. Please wait." }
});

router.use(authenticateUser);
router.use(requireAdmin);

router.post("/delete-user", adminLimiter, validate(deleteUserAuthSchema), deleteUserAuth);

export default router;

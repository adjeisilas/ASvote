import { Router } from "express";
import votingRoutes from "./voting.routes.ts";
import paymentRoutes from "./payment.routes.ts";
import withdrawalRoutes from "./withdrawal.routes.ts";
import ussdRoutes from "./ussd.routes.ts";
import adminRoutes from "./admin.routes.ts";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/votes", votingRoutes);
router.use("/payments", paymentRoutes);
router.use("/withdrawals", withdrawalRoutes);
router.use("/ussd", ussdRoutes);
router.use("/admin", adminRoutes);

export default router;

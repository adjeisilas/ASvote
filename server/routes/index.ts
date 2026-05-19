import { Router } from "express";
import votingRoutes from "./voting.routes";
import paymentRoutes from "./payment.routes";
import withdrawalRoutes from "./withdrawal.routes";
import ussdRoutes from "./ussd.routes";
import adminRoutes from "./admin.routes";

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

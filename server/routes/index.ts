import { Router } from "express";
import votingRoutes from "./voting.routes.js";
import paymentRoutes from "./payment.routes.js";
import withdrawalRoutes from "./withdrawal.routes.js";
import ussdRoutes from "./ussd.routes.js";
import adminRoutes from "./admin.routes.js";
import supportRoutes from "./support.routes.js";

const router = Router();

router.get("/health", (req, res) => {
  res.json({ status: "ok" });
});

router.use("/votes", votingRoutes);
router.use("/payments", paymentRoutes);
router.use("/withdrawals", withdrawalRoutes);
router.use("/ussd", ussdRoutes);
router.use("/admin", adminRoutes);
router.use("/support", supportRoutes);

export default router;

import { Router } from "express";
import { sendSupportEmail } from "../lib/email.js";

const router = Router();

router.post("/ticket", async (req, res) => {
  const { name, email, subject, message } = req.body;
  if (!name || !email || !subject || !message) {
    return res.status(400).json({ error: "All support ticket fields are required." });
  }

  try {
    await sendSupportEmail(name, email, subject, message);
    return res.json({ success: true, message: "Your support ticket has been registered. Our help desk will contact you shortly." });
  } catch (err: any) {
    console.error("Support route endpoint failure:", err);
    return res.status(500).json({ error: err.message || "Failed to process support ticket email dispatch." });
  }
});

export default router;

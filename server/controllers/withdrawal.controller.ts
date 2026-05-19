import { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export const requestWithdrawal = async (req: Request, res: Response) => {
  const { uid, amount } = req.body;
  const authUser = (req as any).user;

  if (!uid || !amount || amount <= 0) {
    return res.status(400).json({ error: "Valid UID and amount are required" });
  }

  // Security: Check if authenticated user matches target UID
  if (authUser.id !== uid) {
    return res.status(403).json({ error: "Unauthorized access" });
  }

  try {
    // 1. Calculate Balance Server-Side
    const [transRes, withdrawalsRes] = await Promise.all([
      supabase.from('transactions').select('amount, commission').eq('organizer_id', uid).eq('status', 'success'),
      supabase.from('withdrawals').select('amount, status').eq('organizer_id', uid)
    ]);

    let transactions = transRes.data || [];
    const withdrawals = withdrawalsRes.data || [];

    const totalEarnings = transactions.reduce((acc: number, t: any) => {
      const commission = (t as any).commission || 0;
      return acc + (t.amount * (1 - commission / 100));
    }, 0);

    const alreadyDeducted = withdrawals
      .filter((w: any) => ['pending', 'completed', 'approved'].includes(w.status))
      .reduce((acc: number, w: any) => acc + (w.amount || 0), 0);

    const availableBalance = Math.floor(totalEarnings - alreadyDeducted);

    if (amount > availableBalance) {
      return res.status(400).json({ error: `Insufficient balance. Available: ${availableBalance} GHS` });
    }

    // 2. Insert Withdrawal Request
    const { data, error } = await supabase
      .from('withdrawals')
      .insert([{
        organizer_id: uid,
        amount,
        status: 'pending'
      }])
      .select();

    if (error) throw error;

    res.json({ success: true, withdrawal: data?.[0] });
  } catch (error: any) {
    console.error("Withdrawal request error:", error.message);
    res.status(500).json({ error: "Failed to process withdrawal request", details: error.message });
  }
};

import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../server/lib/supabase";
import { getAuthUser } from "@/lib/server-auth";
import { requestWithdrawalSchema } from "../../../../../server/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const body = await req.json();
    const validated = requestWithdrawalSchema.safeParse(body);
    if (!validated.success) {
      return NextResponse.json({ 
        error: "Validation Error", 
        details: validated.error.format() 
      }, { status: 400 });
    }

    const { uid, amount } = validated.data;

    // Security: Check if authenticated user matches target UID
    if (auth.user!.id !== uid) {
      return NextResponse.json({ error: "Unauthorized access" }, { status: 403 });
    }

    // 1. Calculate Balance Server-Side
    const [transRes, withdrawalsRes] = await Promise.all([
      supabase.from('transactions').select('amount, commission').eq('organizer_id', uid).eq('status', 'success'),
      supabase.from('withdrawals').select('amount, status').eq('organizer_id', uid)
    ]);

    const transactions = transRes.data || [];
    const withdrawals = withdrawalsRes.data || [];

    const totalEarnings = transactions.reduce((acc: number, t: any) => {
      const commission = t.commission || 0;
      return acc + (t.amount * (1 - commission / 100));
    }, 0);

    const alreadyDeducted = withdrawals
      .filter((w: any) => ['pending', 'completed', 'approved'].includes(w.status))
      .reduce((acc: number, w: any) => acc + (w.amount || 0), 0);

    const availableBalance = Math.floor(totalEarnings - alreadyDeducted);

    if (amount > availableBalance) {
      return NextResponse.json({ error: `Insufficient balance. Available: ${availableBalance} GHS` }, { status: 400 });
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

    return NextResponse.json({ success: true, withdrawal: data?.[0] });
  } catch (error: any) {
    console.error("Withdrawal request error:", error.message);
    return NextResponse.json({ 
      error: "Failed to process withdrawal request", 
      details: error.message 
    }, { status: 500 });
  }
}

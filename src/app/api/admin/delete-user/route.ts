import { NextRequest, NextResponse } from "next/server";
import { supabase } from "../../../../../server/lib/supabase";
import { getAuthUser, requireAdmin } from "@/lib/server-auth";
import { deleteUserAuthSchema } from "../../../../../server/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    const auth = await getAuthUser(req);
    if (auth.error) {
      return NextResponse.json({ error: auth.error }, { status: auth.status });
    }

    const adminCheck = await requireAdmin(auth.user!.id);
    if (adminCheck.error) {
      return NextResponse.json({ error: adminCheck.error }, { status: adminCheck.status });
    }

    const body = await req.json();
    const validated = deleteUserAuthSchema.safeParse({ 
      userId: body.userId, 
      adminId: auth.user!.id 
    });
    
    if (!validated.success) {
      return NextResponse.json({ 
        error: "Validation Error", 
        details: validated.error.format() 
      }, { status: 400 });
    }

    const { userId } = validated.data;

    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Supabase Auth deletion error:", deleteError.message);
      if ((deleteError as any).status !== 404) {
        throw deleteError;
      }
    }

    await supabase.from('profiles').delete().eq('id', userId);

    return NextResponse.json({ 
      success: true, 
      message: "User deleted from authentication and database" 
    });
  } catch (error: any) {
    console.error("Admin user deletion error:", error.message);
    return NextResponse.json({ 
      error: "Failed to delete user", 
      details: error.message 
    }, { status: 500 });
  }
}

import { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";

export const deleteUserAuth = async (req: Request, res: Response) => {
  const { userId } = req.body;
  const admin = (req as any).user;

  if (!userId) {
    return res.status(400).json({ error: "User ID is required" });
  }

  try {
    // The authenticateUser and requireAdmin middlewares have already verified
    // that the current requester is a logged-in administrator.
    
    // Delete user from Supabase Auth
    const { error: deleteError } = await supabase.auth.admin.deleteUser(userId);

    if (deleteError) {
      console.error("Supabase Auth deletion error:", deleteError.message);
      // If it's 404, maybe the user was already deleted from Auth but not DB
      if ((deleteError as any).status !== 404) {
        throw deleteError;
      }
    }

    // Also delete from public.profiles just in case (the database service usually handles this, 
    // but doing it here ensures synchronization if the client call fails)
    await supabase.from('profiles').delete().eq('id', userId);

    res.json({ success: true, message: "User deleted from authentication and database" });
  } catch (error: any) {
    console.error("Admin user deletion error:", error.message);
    res.status(500).json({ error: "Failed to delete user", details: error.message });
  }
};

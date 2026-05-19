import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Vote, ArrowLeft, Loader2, Mail, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ForgotPassword() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSent, setIsSent] = useState(false);

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setIsSent(true);
      toast.success("Password reset email sent!");
    } catch (error: any) {
      console.error("Error sending reset email:", error);
      toast.error(error.message || "Failed to send reset email");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 py-24 bg-white relative overflow-hidden">
      {/* Background Decor */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full h-full -z-10 bg-radial-[at_50%_-20%] from-indigo-100/50 to-transparent"></div>
      
      <div className="w-full max-w-lg">
        <div className="text-center mb-10">
          <Link to="/login" className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-slate-50 text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-all mb-8">
            <ArrowLeft size={14} /> Back to Login
          </Link>
          <div className="bg-indigo-600 w-16 h-16 rounded-[1.25rem] flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-indigo-100 transform -rotate-3 transition-transform hover:rotate-0">
            <Vote size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
            {isSent ? "Check Your Inbox" : "Reset Your Key"}
          </h1>
          <p className="text-slate-500 font-medium italic">
            {isSent ? "We've sent recovery instructions" : "Secure recovery for your workspace access"}
          </p>
        </div>

        <Card className="shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] border-slate-100 rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardContent className="p-10 lg:p-14">
            {isSent ? (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto text-green-500 animate-in zoom-in duration-500">
                  <CheckCircle2 size={40} />
                </div>
                <p className="text-slate-600 font-medium leading-relaxed">
                  A password reset link has been sent to <span className="text-indigo-600 font-bold">{email}</span>. 
                  Please follow the instructions in the email to regain access.
                </p>
                <div className="pt-4">
                  <Link to="/login">
                    <Button className="w-full h-14 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl shadow-xl shadow-slate-200 transition-all hover:scale-[1.02]">
                      RETURN TO SIGN IN
                    </Button>
                  </Link>
                </div>
                <button 
                  onClick={() => setIsSent(false)}
                  className="text-[10px] font-black uppercase tracking-widest text-slate-400 hover:text-indigo-600 transition-colors"
                >
                  Didn't get the email? Try again
                </button>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-8">
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Registered Email</Label>
                  <div className="relative group">
                    <Mail size={20} className="absolute left-5 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-indigo-500 transition-colors" />
                    <Input 
                      id="email" 
                      type="email" 
                      placeholder="contact@organization.com" 
                      required 
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="h-14 pl-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold"
                    />
                  </div>
                </div>

                <div className="pt-2">
                  <Button type="submit" className="w-full h-14 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl shadow-2xl shadow-slate-200 transition-all hover:scale-[1.02] active:scale-[0.98]" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
                    {loading ? 'SENDING RECOVERY LINK...' : 'SEND RESET INSTRUCTIONS'}
                  </Button>
                </div>

                <div className="bg-amber-50/50 border border-amber-100 p-4 rounded-2xl">
                   <p className="text-[10px] text-amber-700 font-bold uppercase tracking-tight leading-relaxed text-center">
                     Note: For security reasons, if an account with this email exists, you will receive a reset link shortly.
                   </p>
                </div>
              </form>
            )}

            {!isSent && (
              <div className="mt-10 pt-10 border-t border-slate-50 text-center">
                <p className="text-sm font-bold text-slate-400 uppercase tracking-widest">
                  REMEMBERED YOUR KEY?{" "}
                  <Link to="/login" className="text-indigo-600 hover:text-indigo-700 transition-colors ml-2">
                    SIGN IN HERE
                  </Link>
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

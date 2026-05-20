import React, { useState } from 'react';
import { supabase } from '../lib/supabase';
import { useNavigate, Link } from 'react-router-dom';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent } from '../components/ui/card';
import { Vote, ArrowLeft, Loader2, ShieldCheck, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPassword() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const navigate = useNavigate();

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }

    if (password.length < 8) {
      toast.error("Password must be at least 8 characters long");
      return;
    }

    const hasUppercase = /[A-Z]/.test(password);
    const hasLowercase = /[a-z]/.test(password);
    const hasDigit = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (!hasUppercase || !hasLowercase || !hasDigit || !hasSymbol) {
      toast.error("Password must contain uppercase, lowercase, numbers, and symbols");
      return;
    }

    setLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      
      // Force sign out to clear transient recovery session and require fresh sign in
      await supabase.auth.signOut().catch(() => {});
      
      setIsSuccess(true);
      toast.success("Password updated successfully! Please sign in with your new key.");
      
      // Delay navigation to show success state
      setTimeout(() => {
        navigate('/login', { replace: true });
      }, 3000);
    } catch (error: any) {
      console.error("Error updating password:", error);
      toast.error(error.message || "Failed to update password");
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
          <div className="bg-indigo-600 w-16 h-16 rounded-[1.25rem] flex items-center justify-center mx-auto mb-6 text-white shadow-xl shadow-indigo-100 transform -rotate-3 transition-transform hover:rotate-0">
            <Vote size={32} />
          </div>
          <h1 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
            {isSuccess ? "Password Updated" : "Set New Key"}
          </h1>
          <p className="text-slate-500 font-medium italic">
            {isSuccess ? "Your access has been restored" : "Define your new professional standard key"}
          </p>
        </div>

        <Card className="shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] border-slate-100 rounded-[3rem] overflow-hidden bg-white/80 backdrop-blur-xl">
          <CardContent className="p-10 lg:p-14">
            {isSuccess ? (
              <div className="text-center space-y-8">
                <div className="w-20 h-20 bg-green-50 rounded-3xl flex items-center justify-center mx-auto text-green-500 animate-in zoom-in duration-500">
                  <CheckCircle2 size={40} />
                </div>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Your password has been changed successfully. You will be redirected to the sign-in page in a moment.
                </p>
                <div className="pt-4">
                  <Link to="/login">
                    <Button className="w-full h-14 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl transition-all">
                      SIGN IN NOW
                    </Button>
                  </Link>
                </div>
              </div>
            ) : (
              <form onSubmit={handleReset} className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="password" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">New Secure Key</Label>
                  <Input 
                    id="password" 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold"
                  />
                  <div className="px-1 pt-1 grid grid-cols-2 gap-x-4 gap-y-1">
                    <p className={`text-[9px] font-bold uppercase transition-colors ${password.length >= 8 ? 'text-green-500' : 'text-slate-400'}`}>• 8+ Characters</p>
                    <p className={`text-[9px] font-bold uppercase transition-colors ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-slate-400'}`}>• Uppercase</p>
                    <p className={`text-[9px] font-bold uppercase transition-colors ${/[a-z]/.test(password) ? 'text-green-500' : 'text-slate-400'}`}>• Lowercase</p>
                    <p className={`text-[9px] font-bold uppercase transition-colors ${/\d/.test(password) ? 'text-green-500' : 'text-slate-400'}`}>• Numbers</p>
                    <p className={`text-[9px] font-bold uppercase transition-colors ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-500' : 'text-slate-400'}`}>• Symbols</p>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword" className="text-xs font-black uppercase tracking-widest text-slate-400 ml-1">Verify New Key</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password" 
                    placeholder="••••••••" 
                    required 
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="h-14 rounded-2xl border-slate-100 bg-slate-50/50 focus:bg-white transition-all font-bold"
                  />
                </div>

                <div className="pt-4">
                  <Button type="submit" className="w-full h-14 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl shadow-2xl transition-all hover:scale-[1.02]" disabled={loading}>
                    {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : <ShieldCheck className="w-5 h-5 mr-2" />}
                    {loading ? 'SECURING KEY...' : 'UPDATE PASSWORD'}
                  </Button>
                </div>
              </form>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

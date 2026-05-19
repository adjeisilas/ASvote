import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { motion } from 'motion/react';
import { supabase } from '../lib/supabase';
import { databaseService } from '../services/database';
import { notificationService } from '../services/notificationService';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Vote, Loader2, ArrowLeft, ShieldCheck, Mail } from 'lucide-react';

import AuthLayout from '../components/auth/AuthLayout';

export default function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [loading, setLoading] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
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
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
            phone_number: phoneNumber,
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error("Registration failed");

      const user = data.user;
      const isAdminEmail = user.email === 'adjeisikapasilas@gmail.com';
      
      if (data.session && data.user.email_confirmed_at) {
        toast.success("Registration successful! Logging you in...");
        navigate(isAdminEmail ? '/admin' : '/organizer');
        return;
      }

      try {
        await notificationService.createNotification(
          user.id,
          "Welcome to ASVote!",
          "Thank you for joining our platform. Start by creating your first event, adding categories, and setting up nominees or ticket options.",
          "success"
        );

        await notificationService.notifyAdmin(
          "New Organizer Signup",
          `N: ${displayName} | T: ${phoneNumber} | E: ${email}`,
          "info"
        );
      } catch (notifyErr) {
        console.warn("Notification system error:", notifyErr);
      }

      setIsRegistered(true);
      toast.success("Registration successful! Please check your email.");
    } catch (error: any) {
      toast.error(error.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleRegister = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/organizer`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Google registration failed");
    }
  };

  if (isRegistered) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-8 selection:bg-indigo-100 selection:text-indigo-600 transition-colors duration-300">
        <motion.div 
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          className="w-full max-w-lg text-center"
        >
          <div className="inline-flex items-center justify-center bg-indigo-600 w-24 h-24 rounded-[2rem] text-white shadow-2xl shadow-indigo-500/20 transform rotate-6 mb-10">
            <Mail size={40} />
          </div>
          <h1 className="text-5xl font-black tracking-tighter text-foreground mb-4">Validate Identity.</h1>
          <p className="text-muted-foreground text-lg font-medium leading-relaxed mb-10">
            We've sent a secure activation link to <span className="text-indigo-600 font-bold underline decoration-indigo-500/20 underline-offset-4">{email}</span>. Click it to unlock your workspace.
          </p>

          <div className="bg-accent rounded-[2.5rem] p-8 sm:p-10 text-left border border-border mb-8 overflow-hidden relative">
            <div className="absolute top-0 right-0 p-8 opacity-5">
              <Mail size={120} />
            </div>
            <h3 className="text-xs font-black uppercase tracking-[0.2em] text-muted-foreground mb-6 flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-amber-500 animate-pulse"></span>
              Verification checklist
            </h3>
            <ul className="space-y-4">
              {[
                "Check your primary inbox first.",
                "Inspect Spam, Junk, and Promotions folders.",
                "Wait up to 5 minutes for delivery.",
                "Ensure your email is correct: " + email
              ].map((tip, i) => (
                <li key={i} className="flex gap-3 text-sm font-bold text-foreground">
                  <span className="text-indigo-500">0{i+1}.</span>
                  {tip}
                </li>
              ))}
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-4">
            <Link to="/login" className="flex-grow">
              <Button className="w-full h-16 bg-primary hover:bg-slate-800 text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/10 transition-all hover:scale-[1.02] active:scale-[0.98] uppercase tracking-widest text-[10px] border-none">
                I'VE VERIFIED & SIGN IN
              </Button>
            </Link>
            <Button 
               variant="outline" 
               onClick={() => window.location.reload()}
               className="h-16 px-8 border-border bg-background text-foreground font-black rounded-2xl transition-all hover:bg-accent uppercase tracking-widest text-[10px]"
            >
              RESEND LINK
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <AuthLayout 
      title="Create account." 
      subtitle=""
      type="register"
    >
      <form onSubmit={handleRegister} className="space-y-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="name" className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Organizer Name</Label>
            <Input 
              id="name" 
              placeholder="e.g. Global Media" 
              required 
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
               className="h-14 rounded-2xl border-border bg-background focus:bg-background focus:ring-0 focus:border-indigo-600 transition-all font-bold tracking-tight text-foreground"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="phone" className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Phone Line</Label>
            <Input 
              id="phone" 
              type="tel"
              placeholder="+233 00 000 0000" 
              required 
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
               className="h-14 rounded-2xl border-border bg-background focus:bg-background focus:ring-0 focus:border-indigo-600 transition-all font-bold tracking-tight text-foreground"
            />
          </div>
        </div>

        <div className="space-y-2">
          <Label htmlFor="email" className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Business Email</Label>
          <Input 
            id="email" 
            type="email" 
            placeholder="contact@organization.com" 
            required 
            value={email}
            onChange={(e) => setEmail(e.target.value)}
             className="h-14 rounded-2xl border-border bg-background focus:bg-background focus:ring-0 focus:border-indigo-600 transition-all font-bold tracking-tight text-foreground"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div className="space-y-2">
            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Secure Key</Label>
            <Input 
              id="password" 
              type="password" 
              placeholder="••••••••"
              required 
              value={password}
              onChange={(e) => setPassword(e.target.value)}
               className="h-14 rounded-2xl border-border bg-background focus:bg-background focus:ring-0 focus:border-indigo-600 transition-all font-bold tracking-tight text-foreground"
            />
            <div className="px-1 pt-1 grid grid-cols-2 gap-x-4 gap-y-1">
              <p className={`text-[9px] font-bold uppercase transition-colors ${password.length >= 8 ? 'text-green-500' : 'text-muted-foreground'}`}>• 8+ Characters</p>
              <p className={`text-[9px] font-bold uppercase transition-colors ${/[A-Z]/.test(password) ? 'text-green-500' : 'text-muted-foreground'}`}>• Uppercase</p>
              <p className={`text-[9px] font-bold uppercase transition-colors ${/[a-z]/.test(password) ? 'text-green-500' : 'text-muted-foreground'}`}>• Lowercase</p>
              <p className={`text-[9px] font-bold uppercase transition-colors ${/\d/.test(password) ? 'text-green-500' : 'text-muted-foreground'}`}>• Numbers</p>
              <p className={`text-[9px] font-bold uppercase transition-colors ${/[!@#$%^&*(),.?":{}|<>]/.test(password) ? 'text-green-500' : 'text-muted-foreground'}`}>• Symbols</p>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="confirmPassword" className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Verify Key</Label>
            <Input 
              id="confirmPassword" 
              type="password" 
              placeholder="••••••••"
              required 
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
               className="h-14 rounded-2xl border-border bg-background focus:bg-background focus:ring-0 focus:border-indigo-600 transition-all font-bold tracking-tight text-foreground"
            />
          </div>
        </div>
        
        <div className="p-5 bg-accent rounded-2xl flex gap-4 border border-border group transition-colors hover:bg-background">
          <div className="w-10 h-10 rounded-xl bg-card shadow-sm flex items-center justify-center flex-shrink-0 text-indigo-600 font-black">
            !
          </div>
          <p className="text-xs text-muted-foreground font-bold leading-relaxed">
            All accounts undergo a <span className="text-indigo-600">Verification Protocol</span>. Your workspace will activate once our team confirms your registration details.
          </p>
        </div>

        <Button 
          type="submit" 
          className="w-full h-14 bg-primary hover:bg-indigo-600 text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] border-none" 
          disabled={loading}
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
          {loading ? 'INITIALIZING...' : 'CREATE WORKSPACE'}
        </Button>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
            <span className="bg-background px-4 text-muted-foreground">Collaborate with social</span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="outline" 
          onClick={handleGoogleRegister}
          className="w-full h-14 border-border bg-background hover:bg-accent text-foreground font-bold rounded-2xl transition-all flex items-center justify-center gap-3 active:scale-[0.99]"
        >
          <svg className="w-5 h-5" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.1c-.22-.66-.35-1.36-.35-2.1s.13-1.44.35-2.1V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          CONTINUE WITH GOOGLE
        </Button>
      </form>
    </AuthLayout>
  );
}


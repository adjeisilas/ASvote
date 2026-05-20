import { useState, useEffect } from 'react';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { databaseService } from '../services/database';
import { useAuth } from '../contexts/AuthContext';
import { User } from '../types';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { toast } from 'sonner';
import { Vote, Loader2, ArrowLeft } from 'lucide-react';

import AuthLayout from '../components/auth/AuthLayout';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const { refreshProfile } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const { user, loading: authLoading } = useAuth();

  useEffect(() => {
    // Force redirection to /reset-password if in recovery flow
    const isRecovering = sessionStorage.getItem('is_recovering_password') === 'true';
    if (isRecovering) {
      navigate('/reset-password', { replace: true });
      return;
    }

    // Check if we are currently handling an email recovery or verification flow
    const hashParams = new URLSearchParams(window.location.hash.replace('#', '?'));
    const searchParams = new URLSearchParams(window.location.search);
    const type = hashParams.get('type') || searchParams.get('type');
    const isRecovery = type === 'recovery' || window.location.hash.includes('type=recovery') || window.location.search.includes('type=recovery');
    const isConfirmation = ['signup', 'invite', 'email_change', 'email_change_current', 'email_change_new'].includes(type || '') || 
                           window.location.hash.includes('type=signup') || 
                           window.location.search.includes('type=signup') ||
                           window.location.hash.includes('type=invite') || 
                           window.location.search.includes('type=invite');

    if (isRecovery) {
      sessionStorage.setItem('is_recovering_password', 'true');
      navigate('/reset-password' + window.location.search + window.location.hash, { replace: true });
      return;
    }

    if (isConfirmation) {
      console.log("Skipping login page redirect: confirmation flow in progress");
      return;
    }

    if (!authLoading && user) {
      if (user.role === 'organizer' && user.status !== 'approved') {
        return;
      }
      
      const from = location.state?.from?.pathname || (user.role === 'admin' ? '/admin' : '/organizer');
      navigate(from, { replace: true });
    }
  }, [user, authLoading, navigate, location.state]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      if (!data.user) throw new Error("Authentication failed");

      const sUser = data.user;
      await handleAuthRedirection(sUser);
    } catch (error: any) {
      toast.error(error.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/organizer`
        }
      });
      if (error) throw error;
    } catch (error: any) {
      toast.error(error.message || "Google sign in failed");
    }
  };

  const handleAuthRedirection = async (sUser: any) => {
    // ... (logic remains the same)
    let profile: any = null;
    try {
      profile = await databaseService.getUserProfile(sUser.id);
    } catch (err) {
      console.error("Profile fetch error:", err);
    }
    
    if (!profile) {
      const isDefaultAdmin = sUser.email === 'adjeisikapasilas@gmail.com';
      
      toast.info("Initializing user profile...");
      const newProfile = {
        id: sUser.id,
        email: sUser.email || '',
        display_name: sUser.user_metadata?.full_name || sUser.user_metadata?.display_name || sUser.email?.split('@')[0] || 'User',
        phone_number: sUser.user_metadata?.phone_number || '',
        role: isDefaultAdmin ? 'admin' : 'organizer',
        status: isDefaultAdmin ? 'approved' : 'pending',
      };
      
      try {
        const { error: insertError } = await supabase.from('profiles').insert([newProfile]);
        if (insertError) {
          if (insertError.code === '23505') {
             // Profile already exists
          } else if (insertError.code === '23503') {
            await new Promise(resolve => setTimeout(resolve, 1500));
            const { error: retryError } = await supabase.from('profiles').insert([newProfile]);
            if (retryError && retryError.code !== '23505') throw retryError;
          } else {
            throw insertError;
          }
        }
        
        const profileData = await databaseService.getUserProfile(sUser.id);
        if (!profileData) throw new Error("Profile creation verification failed");
        profile = profileData;
        
        await refreshProfile();
        
        if (isDefaultAdmin) {
          toast.success("Admin profile restored.");
          navigate('/admin', { replace: true });
          return;
        }
      } catch (err: any) {
        console.error("Profile initialization failed:", err);
        await supabase.auth.signOut();
        throw new Error(`Account profile missing and initialization failed: ${err.message}. Please contact support.`);
      }
    }

    if (sUser.email === 'adjeisikapasilas@gmail.com' && profile.role !== 'admin') {
        await databaseService.updateProfile(sUser.id, { role: 'admin', status: 'approved' } as any);
        await refreshProfile();
        toast.success("Admin privileges ensured.");
        navigate('/admin', { replace: true });
        return;
      }

      if (profile.role === 'organizer' && !sUser.email_confirmed_at) {
        toast.error(
          "Verification Required",
          {
            description: "We've sent a link to your email. You MUST verify it to unlock your workspace. Check your SPAM/JUNK folder.",
            duration: 15000,
            action: {
              label: "I Verified",
              onClick: () => window.location.reload()
            }
          }
        );
      }

      if (profile.role === 'organizer' && profile.status !== 'approved') {
        await supabase.auth.signOut();
        if (profile.status === 'pending') {
          throw new Error("Your account is currently pending approval. Please wait for an administrator to review your request.");
        } else {
          throw new Error("Your account registration has been rejected. Please contact support for more information.");
        }
      }

      toast.success("Login successful!");
      const redirectTo = profile.role === 'admin' ? '/admin' : '/organizer';
      navigate(redirectTo, { replace: true });
  };

  return (
    <AuthLayout 
      title="Welcome back." 
      subtitle=""
      type="login"
    >
      {user && user.role === 'organizer' && user.status !== 'approved' && (
        <div className="mb-8 p-4 bg-amber-50 rounded-2xl border border-amber-100">
          <p className="text-sm font-bold text-amber-700 mb-1">Account Pending Approval</p>
          <p className="text-xs text-amber-600 leading-relaxed font-medium">
            {user.status === 'pending' 
              ? "Your organizer account is awaiting administrative review. Access will be granted once approved."
              : "Your account registration has been rejected. Contact support."}
          </p>
          <Button 
            variant="link" 
            className="text-xs font-black p-0 h-auto mt-2 text-amber-800 hover:text-amber-900 uppercase tracking-widest"
            onClick={() => supabase.auth.signOut()}
          >
            Sign out
          </Button>
        </div>
      )}

      <form onSubmit={handleLogin} className="space-y-6">
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

        <div className="space-y-2">
          <div className="flex items-center justify-between mb-1">
            <Label htmlFor="password" className="text-[10px] font-black uppercase tracking-[0.1em] text-muted-foreground ml-1">Secret Key</Label>
            <Link to="/forgot-password" title="Recover Password" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-800 hover:underline transition-all">Forgot Key?</Link>
          </div>
          <Input 
            id="password" 
            type="password" 
            placeholder="••••••••"
            required 
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="h-14 rounded-2xl border-border bg-background focus:bg-background focus:ring-0 focus:border-indigo-600 transition-all font-bold text-foreground"
          />
        </div>

        <div className="pt-2">
          <Button 
            type="submit" 
            className="w-full h-14 bg-primary hover:bg-indigo-600 text-primary-foreground font-black rounded-2xl shadow-xl shadow-primary/10 transition-all hover:scale-[1.01] active:scale-[0.99] border-none" 
            disabled={loading}
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin mr-2" /> : null}
            {loading ? 'AUTHENTICATING...' : 'ACCESS WORKSPACE'}
          </Button>
        </div>

        <div className="relative py-4">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-border/50"></div>
          </div>
          <div className="relative flex justify-center text-[10px] uppercase font-black tracking-widest">
            <span className="bg-background px-4 text-muted-foreground">Or use identity provider</span>
          </div>
        </div>

        <Button 
          type="button" 
          variant="outline" 
          onClick={handleGoogleLogin}
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


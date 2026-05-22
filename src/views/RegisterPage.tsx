import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { databaseService } from '../services/database';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { PlusCircle, Mail, User, Info, Loader2, Phone } from 'lucide-react';
import { toast } from 'sonner';

export default function RegisterPage() {
  const [displayName, setDisplayName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !password || !displayName || !phone) {
      toast.error('All registration fields are required.');
      return;
    }

    if (password.length < 6) {
      toast.error('Password key must contain at least 6 characters.');
      return;
    }

    setIsLoading(true);
    try {
      // 1. Supabase Auth signup
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            display_name: displayName,
          }
        }
      });

      if (error) throw error;
      if (!data.user) throw new Error('Failed to register user account.');

      const userId = data.user.id;

      // 2. Initialize corresponding database profile
      await databaseService.updateProfile(userId, {
        displayName,
        email,
        phoneNumber: phone,
        role: 'organizer',
        status: 'pending', // Pending admin audit validation
        emailVerified: false,
      });

      toast.success('Registration successful! Please confirm your email before logging in. Your application will be assessed by admins.', {
        duration: 12000
      });
      navigate('/login');
    } catch (err: any) {
      console.error('Registration Exception:', err);
      toast.error(err.message || 'Registration failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[85vh] flex items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-950/20">
      <Card className="w-full max-w-lg border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white rounded-3xl overflow-hidden p-6 md:p-8">
        <CardHeader className="space-y-1.5 pb-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
            <PlusCircle size={28} />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Become an Organizer</CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            Launch competition voting, set up pageants, or sell ticketing passes in minutes.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleRegister} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="displayName" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Company / Name</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <User size={16} />
                </span>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="AS Media Group"
                  className="pl-10 h-11 border-slate-200 focus-visible:ring-indigo-500 rounded-xl"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="email" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Business Email</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={16} />
                </span>
                <Input
                  id="email"
                  type="email"
                  placeholder="asmedia@business.com"
                  className="pl-10 h-11 border-slate-200 focus-visible:ring-indigo-500 rounded-xl"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="phone" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Contact Phone</Label>
              <div className="relative">
                <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
                  <Phone size={16} />
                </span>
                <Input
                  id="phone"
                  type="tel"
                  placeholder="+233 54 123 4567"
                  className="pl-10 h-11 border-slate-200 focus-visible:ring-indigo-500 rounded-xl"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  disabled={isLoading}
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="password" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Set Secure Key (Password)</Label>
              <Input
                id="password"
                type="password"
                placeholder="••••••••••••"
                className="h-11 border-slate-200 focus-visible:ring-indigo-500 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="bg-slate-50 border border-slate-100 p-3.5 rounded-2xl flex items-start gap-2.5 mt-2">
              <Info size={16} className="text-slate-400 shrink-0 mt-0.5" />
              <p className="text-[11px] text-slate-500 leading-normal">
                By registering, your account will enter <b>Pending Audit status</b>. Administrator verification is required before starting public digital currency collections.
              </p>
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl shadow-lg shadow-indigo-100 font-bold transition-all text-sm mt-3 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Requesting Account...
                </>
              ) : (
                'Create Organizer Account'
              )}
            </Button>
          </form>

          <p className="mt-6 text-center text-xs text-slate-500 font-medium">
            Already have an account?{' '}
            <Link to="/login" className="text-indigo-600 font-bold hover:text-indigo-700 hover:underline">
              Log In
            </Link>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

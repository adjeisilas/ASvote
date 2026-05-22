import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { Label } from '../components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '../components/ui/card';
import { KeyRound, ShieldAlert, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();

  const handleUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!password || !confirmPassword) {
      toast.error('All inputs are required.');
      return;
    }

    if (password.length < 6) {
      toast.error('Secure key must contain at least 6 characters.');
      return;
    }

    if (password !== confirmPassword) {
      toast.error('Your passwords do not match.');
      return;
    }

    setIsLoading(true);
    try {
      const { error } = await supabase.auth.updateUser({
        password: password,
      });

      if (error) {
        throw error;
      }

      toast.success('Your secure access key was updated successfully! You can now log in.');
      sessionStorage.removeItem('is_recovering_password');
      navigate('/login', { replace: true });
    } catch (err: any) {
      console.error('Password Update Error:', err);
      toast.error(err.message || 'Server failed to register password updates. Check authentication links.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center p-4 bg-slate-50/50 dark:bg-slate-950/20">
      <Card className="w-full max-w-md border-none shadow-xl shadow-slate-200/50 dark:shadow-none bg-white rounded-3xl overflow-hidden p-6 md:p-8">
        <CardHeader className="space-y-1.5 pb-6 text-center">
          <div className="mx-auto w-12 h-12 rounded-2xl bg-indigo-50 flex items-center justify-center text-indigo-600 mb-2">
            <KeyRound size={28} />
          </div>
          <CardTitle className="text-2xl font-black text-slate-900 tracking-tight">Define New Secure Key</CardTitle>
          <CardDescription className="text-slate-500 text-sm">
            Configure your brand-new, secure access key. Make sure it stays personal and highly confidential.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleUpdate} className="space-y-4">
            <div className="space-y-1.5">
              <Label htmlFor="pass" className="text-slate-700 font-bold text-xs uppercase tracking-wider">New Password</Label>
              <Input
                id="pass"
                type="password"
                placeholder="••••••••••••"
                className="h-11 border-slate-200 focus-visible:ring-indigo-500 rounded-xl"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="conf" className="text-slate-700 font-bold text-xs uppercase tracking-wider">Confirm New Password</Label>
              <Input
                id="conf"
                type="password"
                placeholder="••••••••••••"
                className="h-11 border-slate-200 focus-visible:ring-indigo-500 rounded-xl"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>

            <Button
              type="submit"
              className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-11 rounded-xl shadow-lg shadow-indigo-100 font-bold transition-all text-sm mt-2 flex items-center justify-center gap-2"
              disabled={isLoading}
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Registering Update...
                </>
              ) : (
                'Save Password'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

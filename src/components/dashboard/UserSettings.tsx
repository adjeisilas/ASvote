import React, { useState } from 'react';
import { useAuth } from '../../contexts/AuthContext';
import { supabase } from '../../lib/supabase';
import { databaseService } from '../../services/database';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { toast } from 'sonner';
import { Loader2, User, Mail, Save, Phone } from 'lucide-react';

export default function UserSettings() {
  const { user, refreshProfile } = useAuth();
  const [formData, setFormData] = useState({
    displayName: user?.displayName || '',
    email: user?.email || '',
    phoneNumber: user?.phoneNumber || '',
  });
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;
    
    setLoading(true);
    try {
      // 1. Update Profile in DB using camelCase for the service to map
      await databaseService.updateProfile(user.uid, {
        displayName: formData.displayName,
        email: formData.email,
        phoneNumber: formData.phoneNumber
      });

      // 2. Update Auth Email if changed
      if (formData.email !== user.email) {
        const { error } = await supabase.auth.updateUser({ email: formData.email });
        if (error) {
          if (error.message.includes('recent login')) {
            toast.error("Email update requires recent login. Please re-authenticate.");
          } else {
            throw error;
          }
        } else {
          toast.info("A confirmation email has been sent to your new email address.");
        }
      }

      await refreshProfile();
      toast.success("Profile updated successfully!");
    } catch (error: any) {
      toast.error(error.message || "Failed to update profile.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-4 md:py-6">
      <Card className="border-none shadow-sm overflow-hidden">
        <CardHeader className="bg-card border-b border-border py-4 md:py-6">
          <CardTitle className="text-lg md:text-xl">Profile Settings</CardTitle>
          <CardDescription className="text-xs md:text-sm">Update your information and contact details.</CardDescription>
        </CardHeader>
        <form onSubmit={handleSubmit}>
          <CardContent className="p-4 md:p-6 space-y-4 md:space-y-6">
            <div className="space-y-2">
              <Label htmlFor="displayName" className="text-xs font-bold uppercase tracking-wider text-slate-500">Display Name</Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="displayName" 
                  value={formData.displayName || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, displayName: e.target.value }))}
                  className="pl-10 h-10 md:h-11 border-border text-sm"
                  placeholder="Your Name or Organization Name"
                  required
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email" className="text-xs font-bold uppercase tracking-wider text-slate-500">Contact Email</Label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="email" 
                  type="email"
                  value={formData.email || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, email: e.target.value }))}
                  className="pl-10 h-10 md:h-11 border-border text-sm"
                  placeholder="email@example.com"
                  required
                />
              </div>
              <p className="text-[10px] text-slate-400">Used for login and administrative contact.</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="phoneNumber" className="text-xs font-bold uppercase tracking-wider text-slate-500">Telephone Number</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                <Input 
                  id="phoneNumber" 
                  type="tel"
                  value={formData.phoneNumber || ''}
                  onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                  className="pl-10 h-10 md:h-11 border-border text-sm"
                  placeholder="+233..."
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-transparent p-4 md:p-6 border-t border-border flex justify-end">
            <Button 
              type="submit" 
              className="bg-indigo-600 hover:bg-indigo-700 h-10 md:h-11 px-6 md:px-8 gap-2 w-full sm:w-auto font-bold shadow-none"
              disabled={loading}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
              Save Changes
            </Button>
          </CardFooter>
        </form>
      </Card>
    </div>
  );
}

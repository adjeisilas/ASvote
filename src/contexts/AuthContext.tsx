import React, { createContext, useContext, useEffect, useState } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { databaseService } from '../services/database';
import { User } from '../types';

interface AuthContextType {
  user: User | null;
  supabaseUser: SupabaseUser | null;
  loading: boolean;
  refreshProfile: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({ 
  user: null, 
  supabaseUser: null, 
  loading: true,
  refreshProfile: async () => {} 
});

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function fetchProfile(uid: string, fallbackUser?: SupabaseUser | null) {
    try {
      let profile = await databaseService.getUserProfile(uid);
      
      const activeUser = fallbackUser || supabaseUser;
      if (!profile && activeUser) {
        console.log('No database profile found for authenticated user, creating default profile...');
        const email = activeUser.email || '';
        const displayName = activeUser.user_metadata?.full_name || activeUser.user_metadata?.name || activeUser.user_metadata?.displayName || email.split('@')[0] || 'Google User';
        
        const { error: insertError } = await supabase
          .from('profiles')
          .insert([{
            id: uid,
            email: email,
            role: 'organizer',
            display_name: displayName,
            phone_number: activeUser.phone || '',
            status: 'approved', // Google sign-ups are auto-approved to provide friction-free onboarding
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }]);
          
        if (!insertError) {
          profile = await databaseService.getUserProfile(uid);
        } else {
          console.error('Failed to create user profile dynamically:', insertError);
        }
      }

      if (profile) {
        setUser(profile as User);
      } else {
        setUser(null);
      }
    } catch (err) {
      console.error('Error fetching profile:', err);
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  const refreshProfile = async () => {
    if (supabaseUser) {
      await fetchProfile(supabaseUser.id, supabaseUser);
    }
  };

  useEffect(() => {
    // Synchronously check URL hash/search for recovery flow
    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      sessionStorage.setItem('is_recovering_password', 'true');
    }

    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        const currentUser = session?.user ?? null;
        setSupabaseUser(currentUser);
        if (currentUser) {
          fetchProfile(currentUser.id, currentUser);
        } else {
          setLoading(false);
        }
      } catch (err) {
        console.error('Initial session check failed:', err);
        setLoading(false);
      }
    };

    checkSession();

    let subscription: any = null;
    try {
      const result = supabase.auth.onAuthStateChange(async (event, session) => {
        const currentUser = session?.user ?? null;
        setSupabaseUser(currentUser);
        if (event === 'PASSWORD_RECOVERY') {
          sessionStorage.setItem('is_recovering_password', 'true');
        }
        if (currentUser) {
          fetchProfile(currentUser.id, currentUser);
        } else {
          setUser(null);
          setLoading(false);
        }
      });
      subscription = result.data?.subscription;
    } catch (err) {
      console.error('Error setting up auth state listener:', err);
    }

    return () => {
      if (subscription) subscription.unsubscribe();
    };
  }, []);

  return (
    <AuthContext.Provider value={{ user, supabaseUser, loading, refreshProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);

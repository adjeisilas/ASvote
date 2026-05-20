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

  async function fetchProfile(uid: string) {
    try {
      const profile = await databaseService.getUserProfile(uid);
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
      await fetchProfile(supabaseUser.id);
    }
  };

  useEffect(() => {
    // Initial session check
    const checkSession = async () => {
      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        if (error) throw error;
        
        setSupabaseUser(session?.user ?? null);
        if (session?.user) {
          fetchProfile(session.user.id);
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
        setSupabaseUser(session?.user ?? null);
        if (event === 'PASSWORD_RECOVERY') {
          sessionStorage.setItem('is_recovering_password', 'true');
        }
        if (session?.user) {
          fetchProfile(session.user.id);
        } else {
          setUser(null);
          setLoading(false);
          sessionStorage.removeItem('is_recovering_password');
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

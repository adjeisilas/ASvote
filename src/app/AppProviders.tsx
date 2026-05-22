"use client";

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { BrowserRouter } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import { AuthProvider } from '../contexts/AuthContext';
import { ThemeProvider } from '../contexts/ThemeContext';
import { supabase } from '../lib/supabase';
import { toast } from 'sonner';

import Navbar from '../components/layout/Navbar';
import Footer from '../components/layout/Footer';
import { Toaster } from '../components/ui/sonner';
import VerificationBanner from '../components/layout/VerificationBanner';
import DatabaseStatusBanner from '../components/layout/DatabaseStatusBanner';
import ScrollToTop from '../components/layout/ScrollToTop';

// Initialize Sentry client-side
const sentryDsn = typeof process !== 'undefined' && process.env 
  ? (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.VITE_SENTRY_DSN) 
  : null;

if (sentryDsn && typeof window !== 'undefined') {
  try {
    const integrations: any[] = [];
    if (typeof Sentry.browserTracingIntegration === 'function') {
      integrations.push(Sentry.browserTracingIntegration());
    }
    if (typeof Sentry.replayIntegration === 'function') {
      integrations.push(Sentry.replayIntegration());
    }
    
    Sentry.init({
      dsn: sentryDsn,
      integrations,
      tracesSampleRate: 1.0,
      replaysSessionSampleRate: 0.1,
      replaysOnErrorSampleRate: 1.0,
    });
  } catch (err) {
    console.error("Failed to initialize Sentry:", err);
  }
}

export function AppProviders({ children }: { children: React.ReactNode }) {
  const pathname = usePathname() || '/';
  const router = useRouter();
  const [mounted, setMounted] = useState(false);

  const isDashboard = pathname.startsWith('/admin') || pathname.startsWith('/organizer');
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(pathname);
  const hideNavbar = isDashboard;
  const hideFooter = isDashboard || isAuthPage;

  useEffect(() => {
    setMounted(true);

    if (typeof window === 'undefined') return;

    const hash = window.location.hash;
    const search = window.location.search;
    if (hash.includes('type=recovery') || search.includes('type=recovery')) {
      sessionStorage.setItem('is_recovering_password', 'true');
    }

    const isRecovering = sessionStorage.getItem('is_recovering_password') === 'true';
    const isAlreadyOnReset = pathname === '/reset-password';
    if (isRecovering && !isAlreadyOnReset) {
      router.replace('/reset-password' + window.location.search + window.location.hash);
      return;
    }

    const checkRedirectParams = async () => {
      const hash = window.location.hash;
      const search = window.location.search;

      const hashParams = new URLSearchParams(hash.replace('#', '?'));
      const searchParams = new URLSearchParams(search);

      const type = hashParams.get('type') || searchParams.get('type');
      const errorMsg = hashParams.get('error_description') || searchParams.get('error_description');

      if (errorMsg) {
        toast.error(decodeURIComponent(errorMsg).replace(/\+/g, ' '), {
          duration: 8000
        });
        router.replace('/login');
        return;
      }

      if (type === 'recovery') {
        sessionStorage.setItem('is_recovering_password', 'true');
        if (pathname !== '/reset-password') {
          toast.info("Password recovery link verified. Please define your new secure key.");
          router.replace('/reset-password' + window.location.search + window.location.hash);
        }
        return;
      }

      if (type === 'signup' || type === 'invite' || type === 'email_change' || type === 'email_change_current' || type === 'email_change_new') {
        await supabase.auth.signOut().catch(() => {});
        toast.success("Email confirmed successfully! You can now sign in with your credentials.", {
          duration: 10000,
        });
        if (pathname !== '/login') {
          router.replace('/login' + window.location.search + window.location.hash);
        }
        return;
      }
    };

    checkRedirectParams();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event) => {
      if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem('is_recovering_password', 'true');
        toast.info("Password recovery session verified. Redirecting to reset page...");
        router.replace('/reset-password');
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [pathname, router]);

  const mainLayoutContent = (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      <ScrollToTop />
      <VerificationBanner />
      <DatabaseStatusBanner />
      {!hideNavbar && <Navbar />}
      <main className="flex-grow">
        {children}
      </main>
      {!hideFooter && <Footer />}
      <Toaster position="top-right" expand={true} richColors />
    </div>
  );

  return (
    <ThemeProvider defaultTheme="light" storageKey="asvote-theme">
      <AuthProvider>
        {mounted ? (
          <BrowserRouter>
            {mainLayoutContent}
          </BrowserRouter>
        ) : (
          <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
            <main className="flex-grow">
              {children}
            </main>
            <Toaster position="top-right" expand={true} richColors />
          </div>
        )}
      </AuthProvider>
    </ThemeProvider>
  );
}

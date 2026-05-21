/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation, useNavigate } from 'react-router-dom';
import { useEffect } from 'react';
import * as Sentry from "@sentry/react";
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';
import { supabase } from './lib/supabase';
import { toast } from 'sonner';

const sentryDsn = typeof process !== 'undefined' && process.env ? (process.env.NEXT_PUBLIC_SENTRY_DSN || process.env.VITE_SENTRY_DSN) : (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SENTRY_DSN);
if (sentryDsn) {
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
import Home from './views/Home';
import Events from './views/Events';
import About from './views/AboutView';
import Contact from './views/ContactView';
import HelpCenter from './views/HelpCenterView';
import PrivacyHub from './views/PrivacyHubView';
import LegalTerms from './views/LegalTermsView';
import EventDetail from './views/EventDetail';
import Login from './views/LoginView';
import Register from './views/RegisterView';
import ForgotPassword from './views/ForgotPasswordView';
import ResetPassword from './views/ResetPasswordView';
import AdminDashboard from './views/AdminDashboard';
import AdminOrganizerDetail from './views/AdminOrganizerDetail';
import OrganizerDashboard from './views/OrganizerDashboardView';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { Toaster } from './components/ui/sonner';

import ProtectedRoute from './components/auth/ProtectedRoute';
import VerificationBanner from './components/layout/VerificationBanner';
import DatabaseStatusBanner from './components/layout/DatabaseStatusBanner';
import ScrollToTop from './components/layout/ScrollToTop';

function AppContent() {
  const location = useLocation();
  const navigate = useNavigate();
  const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/organizer');
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  const hideNavbar = isDashboard;
  const hideFooter = isDashboard || isAuthPage;

  // Synchronously flag as recovering password on mount before Supabase of router transitions can clear the URL hash/search
  const hash = window.location.hash;
  const search = window.location.search;
  if (hash.includes('type=recovery') || search.includes('type=recovery')) {
    sessionStorage.setItem('is_recovering_password', 'true');
  }

  useEffect(() => {
    // If we have an active recovery session in sessionStorage, immediately force redirect to /reset-password
    const isRecovering = sessionStorage.getItem('is_recovering_password') === 'true';
    const isAlreadyOnReset = window.location.pathname === '/reset-password';
    if (isRecovering && !isAlreadyOnReset) {
      navigate('/reset-password' + window.location.search + window.location.hash, { replace: true });
      return;
    }

    const checkRedirectParams = async () => {
      const hash = window.location.hash;
      const search = window.location.search;

      // Extract details from hash (like #access_token=...&type=recovery)
      const hashParams = new URLSearchParams(hash.replace('#', '?'));
      const searchParams = new URLSearchParams(search);

      const type = hashParams.get('type') || searchParams.get('type');
      const hashToken = hashParams.get('access_token');
      const errorMsg = hashParams.get('error_description') || searchParams.get('error_description');

      if (errorMsg) {
        toast.error(decodeURIComponent(errorMsg).replace(/\+/g, ' '), {
          duration: 8000
        });
        navigate('/login', { replace: true });
        return;
      }

      // Handle Password Recovery flow
      if (type === 'recovery') {
        sessionStorage.setItem('is_recovering_password', 'true');
        const isAlreadyOnReset = window.location.pathname === '/reset-password';
        if (!isAlreadyOnReset) {
          toast.info("Password recovery link verified. Please define your new secure key.");
          // Maintain original search and hash so that the Supabase client consumes them on the /reset-password route
          navigate('/reset-password' + window.location.search + window.location.hash, { replace: true });
        }
        return;
      }

      // Handle SignUp / Email Confirmation / Invite flows
      if (type === 'signup' || type === 'invite' || type === 'email_change' || type === 'email_change_current' || type === 'email_change_new') {
        await supabase.auth.signOut().catch(() => {});
        toast.success("Email confirmed successfully! You can now sign in with your credentials.", {
          duration: 10000,
        });
        const isAlreadyOnLogin = window.location.pathname === '/login';
        if (!isAlreadyOnLogin) {
          navigate('/login' + window.location.search + window.location.hash, { replace: true });
        }
        return;
      }
    };

    checkRedirectParams();

    // Listen to active Supabase session event changes (e.g., password recovery sessions)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        sessionStorage.setItem('is_recovering_password', 'true');
        toast.info("Password recovery session verified. Redirecting to reset page...");
        navigate('/reset-password', { replace: true });
      }
    });

    return () => {
      subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      <ScrollToTop />
      <VerificationBanner />
      <DatabaseStatusBanner />
      {!hideNavbar && <Navbar />}
      <main className="flex-grow">
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events" element={<Events />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/help" element={<HelpCenter />} />
          <Route path="/privacy" element={<PrivacyHub />} />
          <Route path="/terms" element={<LegalTerms />} />
          <Route path="/event/:id" element={<EventDetail />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route 
            path="/admin/organizer/:id" 
            element={
              <ProtectedRoute role="admin">
                <AdminOrganizerDetail />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/admin/*" 
            element={
              <ProtectedRoute role="admin">
                <AdminDashboard />
              </ProtectedRoute>
            } 
          />
          <Route 
            path="/organizer/*" 
            element={
              <ProtectedRoute role="organizer">
                <OrganizerDashboard />
              </ProtectedRoute>
            } 
          />
        </Routes>
      </main>
      {!hideFooter && <Footer />}
    </div>
  );
}

export default function App() {
  return (
    <ThemeProvider defaultTheme="light" storageKey="asvote-theme">
      <AuthProvider>
        <Router>
          <AppContent />
          <Toaster position="top-right" expand={true} richColors />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

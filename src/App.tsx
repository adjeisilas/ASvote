/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import * as Sentry from "@sentry/react";
import { AuthProvider } from './contexts/AuthContext';
import { ThemeProvider } from './contexts/ThemeContext';

if (import.meta.env.VITE_SENTRY_DSN) {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    integrations: [
      Sentry.browserTracingIntegration(),
      Sentry.replayIntegration(),
    ],
    tracesSampleRate: 1.0,
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
  });
}
import Home from './pages/Home';
import Events from './pages/Events';
import About from './pages/About';
import Contact from './pages/Contact';
import HelpCenter from './pages/HelpCenter';
import PrivacyHub from './pages/PrivacyHub';
import LegalTerms from './pages/LegalTerms';
import EventDetail from './pages/EventDetail';
import Login from './pages/Login';
import Register from './pages/Register';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';
import AdminDashboard from './pages/AdminDashboard';
import AdminOrganizerDetail from './pages/AdminOrganizerDetail';
import OrganizerDashboard from './pages/OrganizerDashboard';
import Navbar from './components/layout/Navbar';
import Footer from './components/layout/Footer';
import { Toaster } from './components/ui/sonner';

import ProtectedRoute from './components/auth/ProtectedRoute';
import VerificationBanner from './components/layout/VerificationBanner';
import ScrollToTop from './components/layout/ScrollToTop';

function AppContent() {
  const location = useLocation();
  const isDashboard = location.pathname.startsWith('/admin') || location.pathname.startsWith('/organizer');
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(location.pathname);
  const hideNavbar = isDashboard;
  const hideFooter = isDashboard || isAuthPage;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col transition-colors duration-300">
      <ScrollToTop />
      <VerificationBanner />
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
          <Toaster position="top-center" expand={true} richColors />
        </Router>
      </AuthProvider>
    </ThemeProvider>
  );
}

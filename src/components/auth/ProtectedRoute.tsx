import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../../contexts/AuthContext';
import { Loader2 } from 'lucide-react';

interface ProtectedRouteProps {
  children: React.ReactNode;
  role?: 'admin' | 'organizer';
}

export default function ProtectedRoute({ children, role }: ProtectedRouteProps) {
  const { user, loading } = useAuth();
  const location = useLocation();

  const isRecovering = sessionStorage.getItem('is_recovering_password') === 'true';

  if (isRecovering) {
    return <Navigate to="/reset-password" replace />;
  }

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-10 h-10 animate-spin text-indigo-600" />
          <p className="text-sm font-bold text-slate-400 uppercase tracking-widest animate-pulse">
            Authenticating Session...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    // Redirect to login, but save the current location they were trying to access
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (role && user.role !== role) {
    // If they have the wrong role, send them to home
    return <Navigate to="/" replace />;
  }

  // Check for approval status for organizers
  if (user.role === 'organizer' && user.status !== 'approved') {
    // Redirect to login where the status message will be shown if they try to log in
    // or just show a fallback if already active
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
}

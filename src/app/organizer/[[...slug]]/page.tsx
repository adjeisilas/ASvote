"use client";

import dynamic from 'next/dynamic';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';

const OrganizerDashboardView = dynamic(() => import('../../../views/OrganizerDashboardPage'), { ssr: false });

export default function NextOrganizerDashboardPage() {
  return (
    <Routes>
      <Route 
        path="/organizer/*" 
        element={
          <ProtectedRoute role="organizer">
            <OrganizerDashboardView />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

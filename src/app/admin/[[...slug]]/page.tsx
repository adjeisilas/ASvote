"use client";

import dynamic from 'next/dynamic';
import { Routes, Route } from 'react-router-dom';
import ProtectedRoute from '../../../components/auth/ProtectedRoute';

const AdminDashboardView = dynamic(() => import('../../../views/AdminDashboard'), { ssr: false });

export default function NextAdminDashboardPage() {
  return (
    <Routes>
      <Route 
        path="/admin/*" 
        element={
          <ProtectedRoute role="admin">
            <AdminDashboardView />
          </ProtectedRoute>
        } 
      />
    </Routes>
  );
}

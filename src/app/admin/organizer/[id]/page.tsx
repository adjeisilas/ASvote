"use client";

import dynamic from 'next/dynamic';
import { Routes, Route } from 'react-router-dom';

const AdminOrganizerDetailView = dynamic(() => import('../../../../views/AdminOrganizerDetail'), { ssr: false });

export default function NextAdminOrganizerDetailPage() {
  return (
    <Routes>
      <Route path="/admin/organizer/:id" element={<AdminOrganizerDetailView />} />
    </Routes>
  );
}

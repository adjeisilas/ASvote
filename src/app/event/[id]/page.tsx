"use client";

import dynamic from 'next/dynamic';
import { Routes, Route } from 'react-router-dom';

const EventDetailView = dynamic(() => import('../../../views/EventDetail'), { ssr: false });

export default function NextEventDetailPage() {
  return (
    <Routes>
      <Route path="/event/:id" element={<EventDetailView />} />
    </Routes>
  );
}

"use client";

import dynamic from 'next/dynamic';

const EventsView = dynamic(() => import('../../views/Events'), { ssr: false });

export default function NextEventsPage() {
  return <EventsView />;
}

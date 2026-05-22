"use client";

import dynamic from 'next/dynamic';

const HomeView = dynamic(() => import('../views/Home'), { ssr: false });

export default function NextHomePage() {
  return <HomeView />;
}

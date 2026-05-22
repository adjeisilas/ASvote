"use client";

import dynamic from 'next/dynamic';

const AboutView = dynamic(() => import('../../views/AboutPage'), { ssr: false });

export default function NextAboutPage() {
  return <AboutView />;
}

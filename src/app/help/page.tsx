"use client";

import dynamic from 'next/dynamic';

const HelpCenterView = dynamic(() => import('../../views/HelpCenterPage'), { ssr: false });

export default function NextHelpPage() {
  return <HelpCenterView />;
}

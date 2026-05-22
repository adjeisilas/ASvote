"use client";

import dynamic from 'next/dynamic';

const PrivacyHubView = dynamic(() => import('../../views/PrivacyHubPage'), { ssr: false });

export default function NextPrivacyPage() {
  return <PrivacyHubView />;
}

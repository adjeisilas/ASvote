"use client";

import dynamic from 'next/dynamic';

const LegalTermsView = dynamic(() => import('../../views/LegalTermsPage'), { ssr: false });

export default function NextTermsPage() {
  return <LegalTermsView />;
}

"use client";

import dynamic from 'next/dynamic';

const ContactView = dynamic(() => import('../../views/ContactPage'), { ssr: false });

export default function NextContactPage() {
  return <ContactView />;
}

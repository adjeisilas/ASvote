"use client";

import dynamic from 'next/dynamic';

const LoginView = dynamic(() => import('../../views/LoginPage'), { ssr: false });

export default function NextLoginPage() {
  return <LoginView />;
}

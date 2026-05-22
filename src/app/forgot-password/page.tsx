"use client";

import dynamic from 'next/dynamic';

const ForgotPasswordView = dynamic(() => import('../../views/ForgotPasswordPage'), { ssr: false });

export default function NextForgotPasswordPage() {
  return <ForgotPasswordView />;
}

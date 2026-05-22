"use client";

import dynamic from 'next/dynamic';

const ResetPasswordView = dynamic(() => import('../../views/ResetPasswordPage'), { ssr: false });

export default function NextResetPasswordPage() {
  return <ResetPasswordView />;
}

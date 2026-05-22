"use client";

import dynamic from 'next/dynamic';

const RegisterView = dynamic(() => import('../../views/RegisterPage'), { ssr: false });

export default function NextRegisterPage() {
  return <RegisterView />;
}

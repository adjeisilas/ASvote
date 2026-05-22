import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Eye, ShieldAlert, Key, Globe } from 'lucide-react';

export default function PrivacyHubPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-16 max-w-4xl">
      <div className="mb-10 text-center md:text-left">
        <span className="bg-indigo-50 border border-indigo-150 px-3.5 py-1 rounded-full text-[10px] font-black uppercase text-indigo-600 tracking-wider">
          USER SECURITY GENERAL
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mt-3">
          Privacy Hub & Safety Standings
        </h1>
        <p className="text-slate-500 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
          At ASVote, user security is our highest directive. Read how we protect credentials, cookies, and digital settlements inside Ghana.
        </p>
      </div>

      <div className="space-y-6 text-slate-600 leading-relaxed text-xs md:text-sm">
        <Card className="border-none shadow-sm p-5 md:p-6 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
            <Eye size={16} className="text-indigo-600" /> 1. Information Gathering Scope
          </h3>
          <p>
            When registering, event organizers report names, email addresses, phone contacts, and Momo payout coordinates to facilitate settlements. Voter parameters logged represent purely secure reference strings processed securely.
          </p>
        </Card>

        <Card className="border-none shadow-sm p-5 md:p-6 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
            <Key size={16} className="text-indigo-600" /> 2. Transaction Encryption Standards
          </h3>
          <p>
            All voting balances are collected via Paystack APIs. ASVote never accesses or caches client credit card numbers or Mobile Money PIN parameters. Transactions utilize advanced security hashes to blockade external digital leaks.
          </p>
        </Card>

        <Card className="border-none shadow-sm p-5 md:p-6 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
            <Globe size={16} className="text-indigo-600" /> 3. Cookies Policy
          </h3>
          <p>
            We deploy secure session state tokens to save user interface preferences, keep dashboard panels authenticated, and defend against Cross-Site Request Forgery (CSRF). Session parameters expire automatically on logging out.
          </p>
        </Card>

        <Card className="border-none shadow-sm p-5 md:p-6 bg-amber-500/10 text-amber-900 border-amber-500/20">
          <h3 className="font-extrabold text-amber-950 text-sm mb-2 flex items-center gap-1.5">
            <ShieldAlert size={16} className="text-amber-700" /> Audit Standards Compliance
          </h3>
          <p>
            Administrators regularly review event logs, voter transactions, and organizer withdrawals to enforce secure, verified operations across Ghana.
          </p>
        </Card>
      </div>
    </div>
  );
}

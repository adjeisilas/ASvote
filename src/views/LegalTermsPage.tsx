import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Shield, BookOpen, Scale, AlertCircle } from 'lucide-react';

export default function LegalTermsPage() {
  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-16 max-w-4xl">
      <div className="mb-10 text-center md:text-left">
        <span className="bg-indigo-50 border border-indigo-150 px-3.5 py-1 rounded-full text-[10px] font-black uppercase text-indigo-600 tracking-wider">
          PLATFORM COMPLIANCE RULES
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mt-3">
          Terms & Legal Conditions
        </h1>
        <p className="text-slate-500 text-sm md:text-base mt-2 max-w-2xl leading-relaxed">
          Please audit the regulatory guidelines of ASVote. By accessing our platform, you signify agreement to these general parameters.
        </p>
      </div>

      <div className="space-y-6 text-slate-600 leading-relaxed text-xs md:text-sm">
        <Card className="border-none shadow-sm p-5 md:p-6 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
            <Scale size={16} className="text-indigo-600" /> 1. Organizer Legitimacy & Audits
          </h3>
          <p>
            Event organizers pledge that scheduled competitions represent legitimate pageants or community activities. ASVote reserves absolute discretion to suspended organizer accounts or freeze settlement clearances should active fraud, duplicate tickets, or nominee deception be detected.
          </p>
        </Card>

        <Card className="border-none shadow-sm p-5 md:p-6 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
            <BookOpen size={16} className="text-indigo-600" /> 2. Ballot Purchasing & No-Refund Policy
          </h3>
          <p>
            Due to the real-time nature of digital poll counts, ballot purchases are processed instantly. Once vote counts are dynamically incremented on ASVote databases, voting transactions represent final clearances and are generally exempt from refund options, unless specified.
          </p>
        </Card>

        <Card className="border-none shadow-sm p-5 md:p-6 bg-slate-50/50">
          <h3 className="font-extrabold text-slate-900 text-sm mb-2 flex items-center gap-1.5">
            <Shield size={16} className="text-indigo-600" /> 3. Payout Timelines
          </h3>
          <p>
            Payout clearances undergo audit checks manually evaluated by administrators for security. System payout disbursement aims for 24-48 business hours after request lodgement.
          </p>
        </Card>

        <Card className="border-none shadow-sm p-5 md:p-6 bg-indigo-50/50 border border-indigo-100 flex items-start gap-3">
          <AlertCircle size={18} className="text-indigo-600 shrink-0 mt-0.5" />
          <p className="text-xs text-indigo-950 font-bold leading-relaxed">
            These guidelines are subject to change as our transactional frameworks scale. Ongoing participation marks acceptance of active regulatory terms.
          </p>
        </Card>
      </div>
    </div>
  );
}

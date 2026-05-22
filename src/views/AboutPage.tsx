import React from 'react';
import { Card, CardContent } from '../components/ui/card';
import { ShieldCheck, Users, Trophy, ChevronRight, Activity, ArrowUpRight } from 'lucide-react';
import { Button } from '../components/ui/button';
import { useNavigate } from 'react-router-dom';

export default function AboutPage() {
  const navigate = useNavigate();

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-16 max-w-6xl">
      {/* Hero Section */}
      <div className="text-center md:text-left mb-12 md:mb-16">
        <span className="bg-indigo-50 border border-indigo-150 px-3.5 py-1 rounded-full text-[10px] font-black uppercase text-indigo-600 tracking-wider">
          WHO WE ARE
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mt-4 leading-none">
          Transparent, Secure & Fast <br className="hidden md:inline" />
          <span className="text-indigo-600">Voting & Digital Ticketing</span>
        </h1>
        <p className="text-slate-500 text-sm md:text-base mt-4 max-w-2xl leading-relaxed">
          ASVote is Ghana's primary trusted platform for building secure real-time voting competitions, digital pageant operations, and automated ticket sales clearance.
        </p>
      </div>

      {/* Grid Features */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-16">
        <Card className="border-none shadow-sm p-6 bg-slate-50/50">
          <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-600 mb-4">
            <ShieldCheck size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1.5">Unbreakable Integrity</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            Every transaction is encrypted, verified, and parsed in real time, blockading bots while assuring event transparency.
          </p>
        </Card>

        <Card className="border-none shadow-sm p-6 bg-slate-50/50">
          <div className="w-10 h-10 rounded-xl bg-purple-100 flex items-center justify-center text-purple-600 mb-4">
            <Trophy size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1.5">Contest Empowerment</h3>
          <p className="text-xs text-slate-500 leading-relaxed">
            From regional pageants to national award contests, we equip creators with tools to drive audience engagement.
          </p>
        </Card>

        <Card className="border-none shadow-sm p-6 bg-slate-50/50">
          <div className="w-10 h-10 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-600 mb-4">
            <Activity size={20} />
          </div>
          <h3 className="font-bold text-slate-900 text-base mb-1.5">Momo Settlements</h3>
          <p className="text-xs text-slate-400 dark:text-slate-500 leading-relaxed">
            We support immediate Mobile Money payouts straight to organizers once their events compile, with zero bureaucratic limits.
          </p>
        </Card>
      </div>

      {/* Our Mission */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-indigo-50/30 p-8 md:p-12 rounded-3xl border border-indigo-100/30 mb-16">
        <div>
          <h2 className="text-xl md:text-2xl font-black text-slate-900 tracking-tight mb-4">Reinventing Digital Elections</h2>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed mb-4">
            For years, event organizers inside Ghana struggled with complex collections, delayed payments, and voter verification queries. ASVote was launched to streamline payments through automated Paystack interfaces, providing real-time nominee visual tables, analytics logs, and straightforward withdrawals.
          </p>
          <p className="text-xs md:text-sm text-slate-600 leading-relaxed">
            Whether you are hosting a digital festival or checking ticket QR codes at physical gate access routes, ASVote provides elite stability and speed.
          </p>
        </div>
        <div className="space-y-4">
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-indigo-600 font-extrabold font-mono text-sm">99.9%</span>
            <p className="font-bold text-xs text-slate-800 mt-1">Paystack Gateway Uptime</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Automated Mobile money, Visa, and Mastercard processors.</p>
          </div>
          <div className="bg-white p-5 rounded-2xl shadow-sm border border-slate-100">
            <span className="text-indigo-600 font-extrabold font-mono text-sm">Instant</span>
            <p className="font-bold text-xs text-slate-800 mt-1">Gate Scan Verification</p>
            <p className="text-[11px] text-slate-400 mt-0.5">Optimized for rapid offline camera scanning.</p>
          </div>
        </div>
      </div>

      {/* Footer CTA */}
      <div className="text-center py-4">
        <h2 className="text-xl md:text-2xl font-black text-slate-900">Are you ready to create?</h2>
        <p className="text-xs text-slate-500 mt-1">Get approved within hours and launch your ticketing poll.</p>
        <div className="flex justify-center gap-4 mt-6">
          <Button onClick={() => navigate('/register')} className="bg-indigo-600 hover:bg-indigo-700 font-bold rounded-xl text-sm h-11 px-6">
            Become Organizer <ArrowUpRight size={14} className="ml-1" />
          </Button>
          <Button onClick={() => navigate('/events')} variant="outline" className="rounded-xl text-sm h-11 px-6">
            Explore Events
          </Button>
        </div>
      </div>
    </div>
  );
}

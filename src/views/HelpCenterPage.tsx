import React, { useState } from 'react';
import { Card, CardContent } from '../components/ui/card';
import { Input } from '../components/ui/input';
import { Button } from '../components/ui/button';
import { Search, ChevronDown, ChevronUp, Sparkles, HelpCircle, AlertCircle } from 'lucide-react';

interface FaqItem {
  q: string;
  a: string;
  category: 'voting' | 'ticketing' | 'withdrawals';
}

export default function HelpCenterPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqs: FaqItem[] = [
    {
      category: 'voting',
      q: 'How does the contest voting system work on ASVote?',
      a: 'Voters search for active card tournaments or pageants, select their preferred nominee, and enter the vote count. We process instant digital collections via Mobile Money or Cards, after which our live database tallies and increments voter nominations transparently.'
    },
    {
      category: 'voting',
      q: 'Is there any limit to the amount of votes a candidate can receive?',
      a: 'No. Candidates can receive infinite nominee entries on active pageants. Pricing structures per single vote ballot are defined by event organizers.'
    },
    {
      category: 'ticketing',
      q: 'How do voters receive admission QR codes?',
      a: 'When ticket transactions settle, voters receive dynamic event admission QR codes dispatched to both their screen layout and email address. These codes are processed instantly at gates.'
    },
    {
      category: 'withdrawals',
      q: 'When can organizers process voting payout requests?',
      a: 'ASVote organizers can request payouts at any stage. Payout balances represent dynamic gross earnings subtracting any processed or waiting withdrawals. Settlements undergo simple security audits before being disbursed.'
    },
    {
      category: 'withdrawals',
      q: 'What Mobile Money operators are supported on withdrawals?',
      a: 'All MTN Mobile Money, Telecel Cash, and AT Money accounts inside Ghana are supported. Organizers just update their Momo Number and name inside their Dashboard Settings panel.'
    }
  ];

  const filteredFaqs = faqs.filter(f => 
    f.q.toLowerCase().includes(searchQuery.toLowerCase()) || 
    f.a.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="container mx-auto px-4 md:px-8 py-8 md:py-16 max-w-4xl">
      <div className="text-center mb-10">
        <span className="bg-indigo-50 border border-indigo-150 px-3.5 py-1 rounded-full text-[10px] font-black uppercase text-indigo-600 tracking-wider">
          ASVOTE KNOWLEDGE HUB
        </span>
        <h1 className="text-3xl md:text-5xl font-black text-slate-900 tracking-tight mt-3">
          How can we help you today?
        </h1>
        <div className="relative max-w-lg mx-auto mt-6">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <Input 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search FAQs, nominee setups, ticket clearances..."
            className="pl-11 h-12 border-slate-200 rounded-2xl shadow-sm focus-visible:ring-indigo-500 bg-white"
          />
        </div>
      </div>

      {/* Main FAQ list */}
      <div className="space-y-4">
        {filteredFaqs.length > 0 ? filteredFaqs.map((faq, idx) => {
          const isOpen = openIndex === idx;
          return (
            <Card 
              key={idx} 
              className="border border-slate-100 shadow-none rounded-2xl cursor-pointer hover:border-slate-200 transition-colors"
              onClick={() => setOpenIndex(isOpen ? null : idx)}
            >
              <CardContent className="p-5 flex justify-between items-start gap-3">
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="p-1 px-2.5 rounded text-[8px] font-black uppercase tracking-wider bg-slate-100 text-slate-500">
                      {faq.category}
                    </span>
                  </div>
                  <h4 className="font-bold text-slate-950 text-sm md:text-base mt-2 flex items-center gap-1.5">
                    <HelpCircle size={16} className="text-indigo-500 shrink-0" />
                    {faq.q}
                  </h4>
                  {isOpen && (
                    <p className="text-xs md:text-sm text-slate-500 mt-3 leading-relaxed border-t border-slate-100 pt-3">
                      {faq.a}
                    </p>
                  )}
                </div>
                <div className="text-slate-400 shrink-0 mt-2">
                  {isOpen ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
                </div>
              </CardContent>
            </Card>
          );
        }) : (
          <div className="bg-slate-50 border border-slate-100 p-8 rounded-3xl text-center">
            <AlertCircle size={32} className="mx-auto text-slate-400 mb-2" />
            <p className="font-bold text-slate-700 text-sm">No articles matched your keywords</p>
            <p className="text-xs text-slate-400 mt-1">Please try standard terms like "withdrawals" or "votes".</p>
          </div>
        )}
      </div>
    </div>
  );
}

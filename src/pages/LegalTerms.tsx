import { motion } from 'motion/react';
import { Badge } from '../components/ui/badge';

export default function LegalTerms() {
  return (
    <div className="bg-white min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <Badge className="bg-slate-100 text-slate-600 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] mb-6">
            User Agreement
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase mb-6">Legal <span className="text-slate-500">Terms</span></h1>
          <p className="text-slate-500 text-lg font-medium italic">The rules and regulations for using the ASVote platform.</p>
        </motion.div>

        <div className="prose prose-slate max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">1. Acceptance of Terms</h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              By accessing or using ASVote, you agree to be bound by these terms and conditions. If you do not agree, you may not use the platform.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">2. Organizer Responsibilities</h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              Organizers are responsible for the accuracy of their event information and the legality of their competitions. ASVote reserved the right to suspend events that violate our community guidelines.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">3. Limitation of Liability</h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              ASVote is not liable for any indirect, incidental, or consequential damages arising from the use of our services.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

import { motion } from 'motion/react';
import { Badge } from '../components/ui/badge';

export default function PrivacyHub() {
  return (
    <div className="bg-white min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-3xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-16"
        >
          <Badge className="bg-emerald-50 text-emerald-600 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] mb-6">
            Data Protection
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase mb-6">Privacy <span className="text-emerald-600">Hub</span></h1>
          <p className="text-slate-500 text-lg font-medium italic">How we collect, use, and protect your personal information.</p>
        </motion.div>

        <div className="prose prose-slate max-w-none space-y-12">
          <section>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">1. Data Collection</h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              We collect information that you provide directly to us when you create an account, participate in a voting event, or purchase tickets. This may include your name, email address, and payment information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">2. Security Measures</h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              ASVote uses industry-standard encryption protocols to ensure that all data transmitted through our platform is secure. We use immutable ledgers for voting to prevent tampering.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4">3. Your Rights</h2>
            <p className="text-slate-600 font-medium leading-relaxed">
              You have the right to access, correct, or delete your personal information at any time through your account settings or by contacting our support team.
            </p>
          </section>
        </div>
      </div>
    </div>
  );
}

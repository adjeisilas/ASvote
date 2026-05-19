import { motion } from 'motion/react';
import { Badge } from '../components/ui/badge';
import { Shield, Lock, FileText, Info } from 'lucide-react';

export default function HelpCenter() {
  return (
    <div className="bg-white min-h-screen pt-32 pb-20">
      <div className="container mx-auto px-4 max-w-4xl">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] mb-6">
            Support Hub
          </Badge>
          <h1 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase mb-6">Help <span className="text-indigo-600">Center</span></h1>
          <p className="text-slate-500 text-lg font-medium italic">Everything you need to know about using ASVote.</p>
        </motion.div>

        <div className="grid md:grid-cols-2 gap-8">
          {[
            { icon: <Info className="text-indigo-600" />, title: "General FAQ", desc: "Common questions about voting and ticketing processes." },
            { icon: <Shield className="text-emerald-500" />, title: "Security Guide", desc: "How we protect your data and transactions." },
            { icon: <Lock className="text-amber-500" />, title: "Account Safety", desc: "Managing your organizer profile and security settings." },
            { icon: <FileText className="text-blue-500" />, title: "Documentation", desc: "Detailed guides for event organizers." }
          ].map((item, i) => (
            <div key={i} className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 hover:border-indigo-100 transition-colors">
              <div className="w-12 h-12 rounded-xl bg-white flex items-center justify-center mb-6 shadow-sm">{item.icon}</div>
              <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight mb-2">{item.title}</h3>
              <p className="text-slate-500 font-medium leading-relaxed">{item.desc}</p>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

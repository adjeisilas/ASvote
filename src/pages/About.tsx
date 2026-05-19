import { motion } from 'motion/react';
import { Badge } from '../components/ui/badge';
import { Card, CardContent } from '../components/ui/card';
import { 
  ShieldCheck, 
  Zap, 
  Target, 
  Lightbulb, 
  Globe, 
  Lock, 
  ArrowRight,
  CheckCircle2,
  Users
} from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '../components/ui/button';

export default function About() {
  const fadeInUp = {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6 }
  };

  const staggerContainer = {
    animate: {
      transition: {
        staggerChildren: 0.1
      }
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-40 overflow-hidden bg-slate-900">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-indigo-600/10 rounded-full blur-[120px] -mr-32 -mt-32"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] -ml-24 -mb-24"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <div className="max-w-4xl mx-auto text-center">
            <motion.div {...fadeInUp}>
              <Badge className="bg-white/10 text-indigo-400 border-indigo-500/20 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] mb-8 backdrop-blur-xl">
                Our Story & Vision
              </Badge>
              <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase mb-8 leading-none">
                Empowering <span className="text-indigo-500">Your Voice</span> & <span className="text-indigo-400">Events</span>
              </h1>
              <p className="text-slate-400 text-lg md:text-2xl font-medium leading-relaxed italic opacity-80 max-w-2xl mx-auto">
                ASVote is the premium platform built to foster trust, ensure transparency, and provide an exceptional experience for everyone.
              </p>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Mission Section */}
      <section className="py-24 md:py-32 container mx-auto px-4">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <motion.div 
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="space-y-8"
          >
            <Badge className="bg-indigo-50 text-indigo-600 border-none px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-[0.3em]">
              The Mission
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase leading-tight">
              A commitment to <br />
              <span className="text-indigo-600 italic">Universal Trust.</span>
            </h2>
            <p className="text-slate-600 text-lg leading-relaxed font-medium">
              We started with a simple belief: every competition and event should be built on trust. Our mission is to provide a reliable ecosystem where participation is effortless and results are unquestionable.
            </p>
            <div className="space-y-4 pt-4">
              {[
                "Immutable transaction ledger for every event.",
                "Zero-compromise security for user data.",
                "Instant, transparent payout systems for organizers.",
                "Seamless mobile-first user experience."
              ].map((item, i) => (
                <div key={i} className="flex items-center gap-4">
                  <div className="w-6 h-6 rounded-full bg-emerald-50 flex items-center justify-center shrink-0">
                    <CheckCircle2 size={16} className="text-emerald-500" />
                  </div>
                  <span className="text-slate-700 font-bold">{item}</span>
                </div>
              ))}
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true }}
            transition={{ duration: 0.8 }}
            className="relative"
          >
            <div className="aspect-[4/5] rounded-[3rem] bg-slate-100 overflow-hidden shadow-2xl relative border-8 border-white">
              <div className="absolute inset-0 bg-gradient-to-tr from-indigo-500/20 to-transparent z-10"></div>
              <img 
                src="https://images.unsplash.com/photo-1557804506-669a67965ba0?auto=format&fit=crop&q=80&w=1000" 
                alt="Our Team Workspace"
                className="w-full h-full object-cover"
              />
            </div>
            {/* Stats Floating Card */}
            <div className="absolute -bottom-8 -left-8 md:-left-16 bg-white p-8 md:p-10 rounded-[2.5rem] shadow-[0_50px_100px_-20px_rgba(0,0,0,0.15)] border border-slate-100 z-20">
               <div className="flex flex-col items-center">
                  <span className="text-5xl md:text-6xl font-black text-indigo-600 tracking-tighter">99.9%</span>
                  <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 mt-2">Accuracy Rate</span>
               </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Core Values */}
      <section className="py-24 md:py-32 bg-slate-50 overflow-hidden">
        <div className="container mx-auto px-4">
          <div className="text-center mb-20 md:mb-24">
            <Badge className="bg-slate-900 text-white border-none px-4 py-1.5 rounded-full font-black text-[9px] uppercase tracking-[0.3em] mb-6">
              Our DNA
            </Badge>
            <h2 className="text-4xl md:text-6xl font-black text-slate-900 tracking-tighter uppercase">
              Driven by <span className="text-indigo-600">Principles</span>
            </h2>
          </div>

          <motion.div 
            variants={staggerContainer}
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8"
          >
            {[
              { icon: <ShieldCheck className="text-emerald-500" />, title: "Trust", desc: "Advanced security and transparent verification for total peace of mind." },
              { icon: <Zap className="text-amber-500" />, title: "Efficiency", desc: "Optimized performance to ensure your transactions and results are instant." },
              { icon: <Globe className="text-blue-500" />, title: "Community", desc: "Built to connect people, making participation accessible to everyone, everywhere." },
              { icon: <Target className="text-rose-500" />, title: "Accuracy", desc: "Every metric and interaction is verified to ensure the highest level of precision." }
            ].map((value, i) => (
              <motion.div key={i} variants={fadeInUp} className="group">
                <Card className="h-full border-none shadow-sm hover:shadow-xl transition-all duration-500 rounded-[2.5rem] bg-white p-4 md:p-6 overflow-hidden">
                  <CardContent className="pt-8 flex flex-col items-center text-center">
                    <div className="w-20 h-20 rounded-[2rem] bg-slate-50 flex items-center justify-center mb-8 border border-white transition-all group-hover:scale-110 group-hover:rotate-6">
                      {value.icon}
                    </div>
                    <h4 className="text-2xl font-black text-slate-900 uppercase tracking-tight mb-4 group-hover:text-indigo-600 transition-colors">{value.title}</h4>
                    <p className="text-slate-500 font-medium leading-relaxed leading-relaxed italic">{value.desc}</p>
                  </CardContent>
                </Card>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      {/* Why Choose Us / Tech Stack */}
      <section className="py-24 md:py-32 container mx-auto px-4">
        <div className="bg-slate-900 rounded-[4rem] p-12 md:p-24 relative overflow-hidden">
           <div className="absolute top-0 left-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-[100px] -ml-48 -mt-48"></div>
           
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-20 items-center relative z-10">
              <div className="space-y-10">
                 <h2 className="text-4xl md:text-7xl font-black text-white tracking-tighter uppercase leading-none">
                    Built for the <br />
                    <span className="text-indigo-400 italic">Next Generation.</span>
                 </h2>
                 <p className="text-slate-400 text-lg md:text-xl font-medium italic leading-relaxed opacity-70">
                    We've combined modern cloud architecture with localized infrastructure to ensure that peak traffic moments never slow down your event.
                 </p>
                 <div className="grid grid-cols-2 gap-8 pr-12">
                    {[
                      { icon: <Lock size={20} />, label: "Secure Payments" },
                      { icon: <Users size={20} />, label: "Scalable Network" },
                      { icon: <Lightbulb size={20} />, label: "Smart Verification" },
                      { icon: <ShieldCheck size={20} />, label: "Verified Results" },
                    ].map((item, i) => (
                      <div key={i} className="flex items-center gap-3 text-indigo-300">
                         {item.icon}
                         <span className="text-[11px] font-black uppercase tracking-widest leading-none">{item.label}</span>
                      </div>
                    ))}
                 </div>
              </div>
              
              <div className="bg-white/5 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-10 md:p-14 space-y-12">
                 <div>
                    <h3 className="text-2xl font-black text-white uppercase tracking-tight mb-4">The ASVote Guarantee</h3>
                    <p className="text-slate-400 font-medium leading-relaxed italic pr-4">
                       "Our promise is simple: fairness in every competition and authenticity in every ticket. We stand behind our technology to provide a platform that organizers can trust and participants can love."
                    </p>
                 </div>
                 <div className="flex items-center gap-6 pt-6 border-t border-white/10">
                    <div className="w-16 h-16 rounded-full bg-indigo-600/30 flex items-center justify-center shrink-0">
                       <Zap className="text-indigo-400" />
                    </div>
                    <div>
                       <p className="text-white font-black uppercase tracking-[0.1em]">Ready to start?</p>
                       <p className="text-slate-500 font-bold text-sm">Join 500+ successful organizers today.</p>
                    </div>
                 </div>
              </div>
           </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24 md:py-32 mb-20">
         <div className="container mx-auto px-4 text-center">
            <h2 className="text-5xl md:text-8xl font-black text-slate-900 tracking-tighter uppercase mb-12 leading-none">
               Let's Build the <br />
               <span className="text-indigo-600 italic">Future Together.</span>
            </h2>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
               <Link to="/register">
                  <Button className="h-20 px-12 rounded-[2rem] bg-slate-900 text-white font-black uppercase tracking-widest text-sm hover:scale-105 transition-transform group gap-4 shadow-2xl shadow-slate-200">
                    Get Started Now
                    <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" strokeWidth={3} />
                  </Button>
               </Link>
               <Link to="/events">
                  <Button variant="outline" className="h-20 px-12 rounded-[2rem] border-slate-200 text-slate-900 font-black uppercase tracking-widest text-sm hover:bg-slate-50 transition-colors">
                    Explore Events
                  </Button>
               </Link>
            </div>
         </div>
      </section>
    </div>
  );
}

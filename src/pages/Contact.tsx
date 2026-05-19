import { useState, useRef } from 'react';
import { motion } from 'motion/react';
import { Badge } from '../components/ui/badge';
import { Button } from '../components/ui/button';
import { Mail, Phone, MapPin, Send, MessageSquare, Clock, Globe } from 'lucide-react';
import { toast } from 'sonner';
import emailjs from '@emailjs/browser';

export default function Contact() {
  const formRef = useRef<HTMLFormElement>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Immediate feedback that we are starting the process
    const loadingToast = toast.loading("Preparing your message...");
    
    const serviceId = import.meta.env.VITE_EMAILJS_SERVICE_ID;
    const templateId = import.meta.env.VITE_EMAILJS_TEMPLATE_ID;
    const publicKey = import.meta.env.VITE_EMAILJS_PUBLIC_KEY;

    // Robust check for real configuration
    const isConfigured = 
      serviceId && serviceId.trim() !== "" && !serviceId.includes('YOUR_') && 
      templateId && templateId.trim() !== "" && !templateId.includes('YOUR_') && 
      publicKey && publicKey.trim() !== "" && !publicKey.includes('YOUR_');

    if (!isConfigured) {
      // Fallback for demo if keys aren't set yet in AI Studio Secrets
      console.warn("EmailJS not configured in AI Studio Settings.");
      await new Promise(resolve => setTimeout(resolve, 2000));
      toast.dismiss(loadingToast);
      toast.info("Form validation passed! To receive real emails, add your EmailJS keys in Settings > Secrets.", {
        duration: 6000,
      });
      setFormData({ name: '', email: '', subject: '', message: '' });
      setIsSubmitting(false);
      return;
    }

    try {
      const response = await emailjs.sendForm(
        serviceId,
        templateId,
        formRef.current!,
        publicKey
      );
      
      toast.dismiss(loadingToast);
      toast.success("Message launched! We'll be in touch soon.");
      setFormData({ name: '', email: '', subject: '', message: '' });
    } catch (error: any) {
      console.error("EmailJS Full Error:", error);
      toast.dismiss(loadingToast);
      
      if (error?.status === 404 || error?.text === "Account not found") {
        toast.error("EmailJS Error: Your Public Key is invalid. Please check Settings > Secrets.");
      } else {
        const errorMessage = error?.text || error?.message || "Check your credentials.";
        toast.error(`EmailJS: ${errorMessage}`);
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="bg-white min-h-screen">
      {/* Hero Section */}
      <section className="relative pt-32 pb-20 md:pt-48 md:pb-32 overflow-hidden bg-slate-900">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/10 rounded-full blur-[120px] -mr-48 -mt-48"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/10 rounded-full blur-[100px] -ml-24 -mb-24"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-white/10 text-indigo-400 border-indigo-500/20 px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] mb-8 backdrop-blur-xl">
              Get in Touch
            </Badge>
            <h1 className="text-5xl md:text-8xl font-black text-white tracking-tighter uppercase mb-6 leading-none">
              Let's <span className="text-indigo-400">Connect</span>
            </h1>
            <p className="text-slate-400 text-lg md:text-xl max-w-2xl mx-auto font-medium leading-relaxed italic opacity-80">
              Whether you're looking to launch a competition or have a question about our services, our dedicated team is here to help you every step of the way.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="py-24 container mx-auto px-4 -mt-16 relative z-20">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20">
          
          {/* Contact Info */}
          <div className="lg:col-span-5 space-y-8">
            <div className="bg-white p-10 md:p-12 rounded-[3.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.08)] border border-slate-100 flex flex-col h-full">
              <h2 className="text-3xl font-black text-slate-900 uppercase tracking-tight mb-12">Contact Details</h2>
              
              <div className="space-y-10">
                {[
                  { icon: <Mail className="text-indigo-600" />, label: "Email Support", value: "hello@asvote.io", sub: "We typically respond within 2 hours" },
                  { icon: <Phone className="text-emerald-500" />, label: "Call/WhatsApp", value: "+233 (0) 247558915", sub: "Available Mon-Sat, 8am - 6pm" },
                  { icon: <MapPin className="text-rose-500" />, label: "Office Address", value: "Accra, Ghana", sub: "Digital Innovation Hub" }
                ].map((item, i) => (
                  <div key={i} className="flex gap-6 items-start group">
                    <div className="w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center shrink-0 border border-white group-hover:scale-110 transition-transform">
                      {item.icon}
                    </div>
                    <div>
                      <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">{item.label}</p>
                      <p className="text-xl font-black text-slate-900 group-hover:text-indigo-600 transition-colors uppercase tracking-tight">{item.value}</p>
                      <p className="text-slate-500 text-sm font-medium italic mt-1">{item.sub}</p>
                    </div>
                  </div>
                ))}
              </div>

              <div className="mt-auto pt-16">
                 <div className="bg-slate-900 p-8 md:p-10 rounded-[2.5rem] relative overflow-hidden group">
                    <div className="absolute top-0 right-0 w-24 h-24 bg-indigo-500/10 rounded-full blur-3xl -mr-12 -mt-12 group-hover:scale-150 transition-transform"></div>
                    <h3 className="text-white font-black uppercase tracking-tight text-xl mb-4">Fastest Support</h3>
                    <p className="text-slate-400 text-sm font-medium italic mb-6">Need immediate help? Reach out via our live WhatsApp channel for a direct response.</p>
                    <a href="https://wa.me/233247558915" target="_blank" rel="noreferrer">
                      <Button className="w-full bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-xl gap-3 h-14 uppercase tracking-widest text-xs">
                         Chat on WhatsApp
                         <MessageSquare size={16} />
                      </Button>
                    </a>
                 </div>
              </div>
            </div>
          </div>

          {/* Contact Form */}
          <div className="lg:col-span-7">
            <div className="bg-slate-50 p-10 md:p-16 rounded-[4rem] border border-slate-100 h-full">
              <h2 className="text-3xl md:text-5xl font-black text-slate-900 uppercase tracking-tighter mb-4">Send a <span className="text-indigo-600 italic">Message</span></h2>
              <p className="text-slate-500 font-medium italic mb-12">Tell us about your project and we'll get back to you as soon as possible.</p>

              <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Full Name</label>
                    <input 
                      required
                      type="text" 
                      name="user_name"
                      placeholder="e.g. John Doe"
                      className="w-full h-16 bg-white border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      value={formData.name}
                      onChange={(e) => setFormData({...formData, name: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Email Address</label>
                    <input 
                      required
                      type="email" 
                      name="user_email"
                      placeholder="e.g. john@example.com"
                      className="w-full h-16 bg-white border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all"
                      value={formData.email}
                      onChange={(e) => setFormData({...formData, email: e.target.value})}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Subject</label>
                  <select 
                    required
                    name="subject"
                    className="w-full h-16 bg-white border border-slate-100 rounded-2xl px-6 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all appearance-none cursor-pointer"
                    value={formData.subject}
                    onChange={(e) => setFormData({...formData, subject: e.target.value})}
                  >
                    <option value="">Select a reason</option>
                    <option value="Event Creation">Event Creation Help</option>
                    <option value="Voting Issues">Voting Assistance</option>
                    <option value="Ticketing">Ticketing Inquiry</option>
                    <option value="Partnership">Partnership Proposal</option>
                    <option value="Other">Other Inquiry</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400 ml-4">Your Message</label>
                  <textarea 
                    required
                    name="message"
                    rows={6}
                    placeholder="Tell us what you need help with..."
                    className="w-full bg-white border border-slate-100 rounded-3xl px-6 py-6 font-bold text-slate-700 outline-none focus:ring-2 focus:ring-indigo-100 transition-all resize-none"
                    value={formData.message}
                    onChange={(e) => setFormData({...formData, message: e.target.value})}
                  />
                </div>

                <Button 
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full h-18 bg-slate-900 hover:bg-indigo-600 text-white font-black rounded-2xl uppercase tracking-widest text-sm shadow-2xl shadow-indigo-100 group gap-4 transition-all hover:scale-[1.01] active:scale-[0.99]"
                >
                  {isSubmitting ? 'Sending Message...' : 'Send Message'}
                  <Send size={18} className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform" />
                </Button>
              </form>
            </div>
          </div>
        </div>
      </section>

      {/* Global Presence Branding */}
      <section className="py-24 md:py-32 bg-slate-900 overflow-hidden">
        <div className="container mx-auto px-4 text-center">
           <div className="inline-flex items-center gap-3 bg-white/5 backdrop-blur-xl px-6 py-2.5 rounded-full border border-white/10 mb-12">
              <Globe size={14} className="text-indigo-400" />
              <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-300">ASVote Global Network</span>
           </div>
           <h2 className="text-3xl md:text-5xl font-black text-white uppercase tracking-tighter mb-8 italic opacity-60">Ready to serve you everywhere.</h2>
           <div className="max-w-4xl mx-auto flex flex-wrap justify-center gap-x-12 gap-y-6 opacity-30">
              {['KUMASI', 'ACCRA', 'TAKORADI', 'TAMALE', 'CAPE COAST', 'TEMA'].map((city) => (
                <span key={city} className="text-2xl font-black tracking-widest text-white">{city}</span>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
}

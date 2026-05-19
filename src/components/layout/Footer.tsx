import { Vote, Globe, Mail, MapPin, Phone, MessageSquare, Share2, Users } from 'lucide-react';
import { Link } from 'react-router-dom';

export default function Footer() {
  return (
    <footer className="bg-slate-950 text-slate-400 py-24 border-t border-slate-900">
      <div className="container mx-auto px-4">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-16">
          {/* Brand Column */}
          <div className="lg:col-span-5">
            <Link to="/" className="flex items-center gap-3 mb-8 group">
              <div className="bg-indigo-600 p-2 rounded-xl group-hover:rotate-6 transition-transform">
                <Vote className="w-6 h-6 text-white" />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">AS<span className="text-indigo-500">Vote</span></span>
            </Link>
            <p className="text-slate-400 text-lg leading-relaxed max-w-sm mb-10 font-medium">
              The world's most trusted decentralized platform for secure voting competitions and premium event ticketing. 
            </p>
            <div className="flex gap-4">
              {[
                { icon: <Globe size={20} />, href: "#" },
                { icon: <Mail size={20} />, href: "#" },
                { icon: <MessageSquare size={20} />, href: "#" },
                { icon: <Share2 size={20} />, href: "#" }
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  className="w-11 h-11 rounded-xl bg-slate-900 flex items-center justify-center text-slate-500 hover:bg-indigo-600 hover:text-white transition-all transform hover:-translate-y-1"
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          
          {/* Links Column 1 */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8">Platform</h4>
            <ul className="space-y-4 font-bold text-sm">
              <li><Link to="/events" className="hover:text-indigo-500 transition-colors">Voting Explorer</Link></li>
              <li><Link to="/events" className="hover:text-indigo-500 transition-colors">Ticket Marketplace</Link></li>
              <li><Link to="/about" className="hover:text-indigo-500 transition-colors">About ASVote</Link></li>
              <li><Link to="/contact" className="hover:text-indigo-500 transition-colors">Contact Us</Link></li>
            </ul>
          </div>

          {/* Links Column 2 */}
          <div className="lg:col-span-2">
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8">Resources</h4>
            <ul className="space-y-4 font-bold text-sm">
              <li><Link to="/contact" className="hover:text-indigo-500 transition-colors">Help Center</Link></li>
              <li><Link to="/privacy" className="hover:text-indigo-500 transition-colors">Privacy Hub</Link></li>
              <li><Link to="/terms" className="hover:text-indigo-500 transition-colors">Legal Terms</Link></li>
            </ul>
          </div>

          {/* Contact Column */}
          <div className="lg:col-span-3">
            <h4 className="text-white font-black uppercase tracking-[0.2em] text-[10px] mb-8">Global Office</h4>
            <ul className="space-y-6 font-bold text-sm">
              <li className="flex items-start gap-4">
                <MapPin size={20} className="text-indigo-500 shrink-0" />
                <span className="leading-relaxed">A42 Innovation Drive, <br />Tech City, Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-4">
                <Mail size={20} className="text-indigo-500 shrink-0" />
                <span>hello@asvote.io</span>
              </li>
              <li className="flex items-center gap-4">
                <Phone size={20} className="text-indigo-500 shrink-0" />
                <span>+233 (0) 247558915</span>
              </li>
            </ul>
          </div>
        </div>
        
        <div className="border-t border-slate-900 mt-24 pt-12 flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex flex-col md:flex-row items-center gap-8">
             <p className="text-xs font-bold text-slate-600 uppercase tracking-widest text-center md:text-left">
              © {new Date().getFullYear()} ASVote Global. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

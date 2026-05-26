import { 
  Vote, 
  Globe, 
  Mail, 
  MapPin, 
  Phone, 
  ChevronRight,
  MessageSquare,
  Share2
} from 'lucide-react';
import { Link } from 'react-router-dom';
import logo from '../../assets/logo.png';

export default function Footer() {
  return (
    <footer className="relative bg-slate-950 text-slate-400 border-t border-slate-900 overflow-hidden">
      {/* Premium ambient backdrop and modern radial grid */}
      <div className="absolute inset-0 -z-10 pointer-events-none select-none">
        {/* Subtle blur highlights */}
        <div 
          className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-650/10 rounded-full blur-[120px] opacity-60 mix-blend-screen"
        />
        <div 
          className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] opacity-40 mix-blend-screen"
        />
        
        {/* Fine Noise Texture Overlay */}
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.012] mix-blend-overlay" />
        
        {/* Elegant Dot Grid Design */}
        <div 
          className="absolute inset-0 opacity-[0.25]"
          style={{ 
            backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, rgba(255, 255, 255, 0.15) 1px, transparent 0)', 
            backgroundSize: '28px 28px' 
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 lg:py-24 relative">
        {/* Primary Link Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-slate-900/60">
          {/* Brand Presentation Column */}
          <div className="lg:col-span-5 space-y-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="bg-white rounded-xl group-hover:rotate-6 group-hover:scale-105 shadow-lg shadow-indigo-600/20 transition-all duration-300">
                <img
              src={(logo as { src: string }).src}
              alt="ASVote Logo"
              className="w-8 h-8 object-contain"
            />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">AS<span className="text-indigo-500">Votes</span></span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-medium">
              The world's most trusted decentralized platform for high-integrity digital voting campaigns, secure poll management, and premium ticket distribution. Built for modern event creators and elite organizations.
            </p>
            <div className="flex gap-3 pt-2">
              {[
                { icon: <Globe size={16} />, href: "https://asvotes.com", label: "Website" },
                { icon: <Mail size={16} />, href: "mailto:support@asvote.com", label: "Email" }
              ].map((social, i) => (
                <a 
                  key={i} 
                  href={social.href} 
                  className="w-10 h-10 rounded-xl bg-slate-900/80 border border-slate-800/60 flex items-center justify-center text-slate-400 hover:bg-slate-800 hover:border-indigo-500/40 hover:text-white transition-all duration-300 transform hover:-translate-y-0.5 active:scale-95 shadow-sm"
                  aria-label={social.label}
                >
                  {social.icon}
                </a>
              ))}
            </div>
          </div>
          
          {/* Column Links Segment 1 */}
          <div className="lg:col-span-2 space-y-5">
            <h4 className="text-white font-black uppercase tracking-[0.25em] text-[10px] flex items-center gap-1.5">
              <span className="w-1 h-3 bg-indigo-500 rounded-full" />
              Platform
            </h4>
            <ul className="space-y-3 font-semibold text-sm">
              {[
                { label: 'Voting Explorer', to: '/events' },
                { label: 'Ticket Marketplace', to: '/events' },
                { label: 'About ASVotes', to: '/about' },
                { label: 'Contact Us', to: '/contact' }
              ].map((link, i) => (
                <li key={i}>
                  <Link 
                    to={link.to} 
                    className="group flex items-center gap-1 text-slate-400 hover:text-white transition-all duration-200"
                  >
                    <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 -ml-3 group-hover:ml-0 text-indigo-400 transition-all duration-200" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Column Links Segment 2 */}
          <div className="lg:col-span-2 space-y-5">
            <h4 className="text-white font-black uppercase tracking-[0.25em] text-[10px] flex items-center gap-1.5">
              <span className="w-1 h-3 bg-indigo-500 rounded-full" />
              Resources
            </h4>
            <ul className="space-y-3 font-semibold text-sm">
              {[
                { label: 'Help Center', to: '/help-center' },
                { label: 'Privacy Hub', to: '/privacy-hub' },
                { label: 'Legal Terms', to: '/legal-terms' }
              ].map((link, i) => (
                <li key={i}>
                  <Link 
                    to={link.to} 
                    className="group flex items-center gap-1 text-slate-400 hover:text-white transition-all duration-200"
                  >
                    <ChevronRight size={10} className="opacity-0 group-hover:opacity-100 -ml-3 group-hover:ml-0 text-indigo-400 transition-all duration-200" />
                    <span>{link.label}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Direct Contacts Column */}
          <div className="lg:col-span-3 space-y-5">
            <h4 className="text-white font-black uppercase tracking-[0.25em] text-[10px] flex items-center gap-1.5">
              <span className="w-1 h-3 bg-indigo-500 rounded-full" />
              Global Office
            </h4>
            <ul className="space-y-4 font-semibold text-sm">
              <li className="flex items-start gap-3 text-slate-400">
                <MapPin size={16} className="text-indigo-500 shrink-0 mt-0.5" />
                <span className="leading-relaxed">Accra, Ghana</span>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Mail size={16} className="text-indigo-500 shrink-0" />
                <a href="mailto:support@asvote.com" className="hover:text-white transition-colors duration-200">support@asvote.com</a>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Phone size={16} className="text-indigo-500 shrink-0" />
                <a href="tel:+233247558915" className="hover:text-white transition-colors duration-200">+233 (0) 247 558 915</a>
              </li>
            </ul>
          </div>
        </div>
        
        {/* Compliance, Security Certifications, & Copyright info */}
        <div className="pt-8 text-center text-xs font-semibold">
          <p className="text-slate-600 font-bold uppercase tracking-wider text-[11px]">
            © {new Date().getFullYear()} ASVotes. All Rights Reserved.
          </p>
        </div>
      </div>
    </footer>
  );
}


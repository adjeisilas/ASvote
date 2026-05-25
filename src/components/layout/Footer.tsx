import { useState } from "react";
import {
  Vote,
  Globe,
  Mail,
  MapPin,
  Phone,
  ArrowRight,
  ShieldCheck,
  Lock,
  Heart,
  ChevronRight,
  Sparkles,
  MessageSquare,
  Share2,
} from "lucide-react";
import { Link } from "react-router-dom";
import { toast } from "sonner";
import logo from "../../assets/logo.png";

export default function Footer() {
  const [email, setEmail] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubscribe = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;
    setSubmitting(true);
    setTimeout(() => {
      toast.success(
        "Thank you for subscribing! You've been added to our updates mailing list.",
      );
      setEmail("");
      setSubmitting(false);
    }, 1000);
  };

  return (
    <footer className="relative bg-slate-950 text-slate-400 border-t border-slate-900 overflow-hidden">
      {/* Premium ambient backdrop and modern radial grid */}
      <div className="absolute inset-0 -z-10 pointer-events-none select-none">
        {/* Subtle blur highlights */}
        <div className="absolute bottom-[-10%] right-[-5%] w-[500px] h-[500px] bg-indigo-650/10 rounded-full blur-[120px] opacity-60 mix-blend-screen" />
        <div className="absolute top-[-20%] left-[-10%] w-[400px] h-[400px] bg-blue-600/5 rounded-full blur-[100px] opacity-40 mix-blend-screen" />

        {/* Fine Noise Texture Overlay */}
        <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.012] mix-blend-overlay" />

        {/* Elegant Dot Grid Design */}
        <div
          className="absolute inset-0 opacity-[0.25]"
          style={{
            backgroundImage:
              "radial-gradient(circle at 1.5px 1.5px, rgba(255, 255, 255, 0.15) 1px, transparent 0)",
            backgroundSize: "28px 28px",
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto px-6 lg:px-8 py-16 lg:py-24 relative">
        {/* Newsletter Subscription Panel Upgrade */}
        <div className="relative p-6 sm:p-8 lg:p-12 rounded-3xl bg-slate-900/40 border border-slate-800/80 backdrop-blur-md overflow-hidden mb-16 shadow-[0_24px_48px_-12px_rgba(0,0,0,0.5)]">
          <div className="absolute -top-24 -right-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center relative z-10">
            <div className="lg:col-span-7 space-y-3">
              <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-indigo-500/15 border border-indigo-500/25 text-indigo-400">
                <Sparkles size={12} className="animate-pulse" />
                <span className="text-[9px] font-black uppercase tracking-widest leading-none">
                  Stay Ahead
                </span>
              </div>
              <h3 className="text-xl sm:text-2xl lg:text-3xl font-black text-white tracking-tight leading-tight uppercase">
                Stay updated with election and event releases.
              </h3>
              <p className="text-xs sm:text-sm text-slate-400 font-medium max-w-xl leading-relaxed">
                Subscribe to our mailing list for immediate security bulletins,
                premium ticket releases, compliance reports, and deep election
                telemetry.
              </p>
            </div>

            <div className="lg:col-span-12 xl:col-span-5 w-full">
              <form
                onSubmit={handleSubscribe}
                className="w-full flex flex-col sm:flex-row gap-2.5"
              >
                <div className="relative flex-1">
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="Enter your professional email"
                    className="w-full bg-slate-950/80 border border-slate-800/80 focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500/20 text-white rounded-xl py-3 px-4.5 text-xs sm:text-sm font-medium transition-all outline-none placeholder:text-slate-500 h-12 shadow-inner"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-75 transition-all duration-350 text-white h-12 px-6 rounded-xl text-xs sm:text-sm font-black flex items-center justify-center gap-2 shadow-lg shadow-indigo-600/20 hover:shadow-indigo-600/40 active:translate-y-0.5 cursor-pointer whitespace-nowrap"
                >
                  {submitting ? "Subscribing..." : "Subscribe"}
                  <ArrowRight
                    size={14}
                    className="group-hover:translate-x-1 transition-transform"
                  />
                </button>
              </form>
              <p className="mt-2.5 text-[10px] text-slate-500 font-semibold flex items-center gap-1">
                <Lock size={10} className="text-slate-500 shrink-0" />
                Your data is fully encrypted. No spam. Unsubscribe anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Primary Link Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-12 lg:gap-8 pb-16 border-b border-slate-900/60">
          {/* Brand Presentation Column */}
          <div className="lg:col-span-5 space-y-6">
            <Link to="/" className="inline-flex items-center gap-3 group">
              <div className="bg-white border-indigo-500 p-2 rounded-xl group-hover:rotate-6 transition-transform">
                <img
                  src={logo.src}
                  alt="ASVote Logo"
                  className="w-12 h-12 object-contain"
                />
              </div>
              <span className="text-2xl font-black tracking-tighter text-white">
                AS<span className="text-indigo-500">Vote</span>
              </span>
            </Link>
            <p className="text-slate-400 text-sm leading-relaxed max-w-sm font-medium">
              The world's most trusted decentralized platform for high-integrity
              digital voting campaigns, secure poll management, and premium
              ticket distribution. Built for modern event creators and elite
              organizations.
            </p>
            <div className="flex gap-3 pt-2">
              {[
                { icon: <Globe size={16} />, href: "#", label: "Website" },
                {
                  icon: <Mail size={16} />,
                  href: "mailto:support@asvote.com",
                  label: "Email",
                },
                {
                  icon: <MessageSquare size={16} />,
                  href: "#",
                  label: "Support Chat",
                },
                { icon: <Share2 size={16} />, href: "#", label: "Share" },
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
                { label: "Voting Explorer", to: "/events" },
                { label: "Ticket Marketplace", to: "/events" },
                { label: "About ASVote", to: "/about" },
                { label: "Contact Us", to: "/contact" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.to}
                    className="group flex items-center gap-1 text-slate-400 hover:text-white transition-all duration-200"
                  >
                    <ChevronRight
                      size={10}
                      className="opacity-0 group-hover:opacity-100 -ml-3 group-hover:ml-0 text-indigo-400 transition-all duration-200"
                    />
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
                { label: "Help Center", to: "/help-center" },
                { label: "Privacy Hub", to: "/privacy-hub" },
                { label: "Legal Terms", to: "/legal-terms" },
              ].map((link, i) => (
                <li key={i}>
                  <Link
                    to={link.to}
                    className="group flex items-center gap-1 text-slate-400 hover:text-white transition-all duration-200"
                  >
                    <ChevronRight
                      size={10}
                      className="opacity-0 group-hover:opacity-100 -ml-3 group-hover:ml-0 text-indigo-400 transition-all duration-200"
                    />
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
                <a
                  href="mailto:hello@asvote.io"
                  className="hover:text-white transition-colors duration-200"
                >
                  hello@asvote.io
                </a>
              </li>
              <li className="flex items-center gap-3 text-slate-400">
                <Phone size={16} className="text-indigo-500 shrink-0" />
                <a
                  href="tel:+233247558915"
                  className="hover:text-white transition-colors duration-200"
                >
                  +233 (0) 247 558 915
                </a>
              </li>
            </ul>
          </div>
        </div>

        {/* Compliance, Security Certifications, & Copyright info */}
        <div className="pt-8 flex flex-col md:flex-row justify-between items-center gap-6 text-xs font-semibold">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-3 text-slate-500">
            <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/45 text-[11px] font-bold text-slate-300 shadow-xs hover:border-slate-800 transition-all">
              <ShieldCheck size={13} className="text-indigo-500" />
              Paystack Verified Gateway
            </span>
            <span className="flex items-center gap-1.5 bg-slate-900/60 px-3 py-1.5 rounded-lg border border-slate-800/45 text-[11px] font-bold text-slate-300 shadow-xs hover:border-slate-800 transition-all">
              <Lock size={13} className="text-indigo-500" />
              SHA-256 Poll Encryption
            </span>
            <span className="flex items-center gap-1.5 bg-emerald-950/20 px-3 py-1.5 rounded-lg border border-emerald-900/30 text-emerald-400 text-[11px] font-bold shadow-xs transition-all">
              <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
              System Operational
            </span>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-3 text-center md:text-right">
            <p className="text-slate-600 font-bold uppercase tracking-wider text-[11px]">
              © {new Date().getFullYear()} ASVote Global. All Rights Reserved.
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}

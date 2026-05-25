import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../contexts/AuthContext";
import { Button } from "../ui/button";
import {
  Vote,
  LayoutDashboard,
  LogOut,
  Menu,
  X,
  ChevronRight,
} from "lucide-react";
import { supabase } from "../../lib/supabase";
import { useState, useEffect } from "react";
import { cn } from "../../lib/utils";
import { ThemeToggle } from "./ThemeToggle";
import logo from "../../assets/logo.png";

import NotificationDropdown from "../dashboard/NotificationDropdown";

export default function Navbar() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navLinks = [
    { label: "Home", path: "/" },
    { label: "Events", path: "/events" },
    { label: "About", path: "/about" },
    { label: "Contact", path: "/contact" },
  ];

  return (
    <nav
      className={cn(
        "sticky top-0 z-50 w-full transition-all duration-350",
        isScrolled
          ? "bg-background/80 dark:bg-background/70 backdrop-blur-xl border-b border-border/70 shadow-[0_8px_30px_rgb(0,0,0,0.02)] h-16"
          : "bg-background/40 backdrop-blur-md border-b border-border/40 h-16",
      )}
    >
      {/* Decorative ultra-thin brand top glow */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-indigo-500/15 over to-transparent" />

      <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
        <Link to="/" className="flex items-center gap-2.5 group">
          <div className="bg-white border-indigo-500 p-2 rounded-xl group-hover:rotate-6 transition-transform">
            <img
              src={logo.src}
              alt="ASVote Logo"
              className="w-12 h-12 object-contain"
            />
          </div>
          <span className="text-xl font-black tracking-tighter text-foreground uppercase">
            AS<span className="text-indigo-500">Vote</span>
          </span>
        </Link>

        {/* Desktop Navigation Link Cluster */}
        <div className="hidden md:flex items-center gap-8">
          {navLinks.map((link) => {
            const isActive =
              link.path === "/"
                ? location.pathname === "/"
                : location.pathname.startsWith(link.path);
            return (
              <Link
                key={link.path}
                to={link.path}
                className={cn(
                  "relative text-[11px] font-extrabold uppercase tracking-[0.2em] transition-all duration-200 py-2 top-[1px]",
                  isActive
                    ? "text-indigo-600 dark:text-indigo-400"
                    : "text-muted-foreground/80 hover:text-indigo-600 dark:hover:text-indigo-400",
                )}
              >
                {link.label}
                {isActive && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4/5 h-[2px] bg-indigo-500 rounded-full" />
                )}
              </Link>
            );
          })}
        </div>

        <div className="flex items-center gap-3">
          <ThemeToggle />

          {user && (
            <div className="hidden sm:block">
              <NotificationDropdown />
            </div>
          )}

          {user ? (
            <div className="flex items-center gap-2">
              <Link to={user?.role === "admin" ? "/admin" : "/organizer"}>
                <Button
                  variant="ghost"
                  className="hidden sm:flex items-center gap-2 font-black rounded-xl text-xs text-muted-foreground hover:bg-accent/70 h-10 px-4"
                >
                  <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                  DASHBOARD
                </Button>
              </Link>
              <Button
                variant="outline"
                onClick={handleLogout}
                className="hidden sm:flex items-center gap-2 font-black rounded-xl text-xs border-none text-red-500 hover:bg-red-500/10 dark:hover:bg-red-950/20 h-10 px-4"
              >
                <LogOut className="w-4 h-4" />
                LOGOUT
              </Button>
            </div>
          ) : (
            <div className="hidden sm:flex items-center gap-2">
              <Link to="/login">
                <Button
                  variant="ghost"
                  className="font-black rounded-xl px-5 text-xs text-muted-foreground hover:bg-accent/70 h-10"
                >
                  LOGIN
                </Button>
              </Link>
              <Link to="/register">
                <Button className="font-black rounded-xl px-5 text-xs bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-600/10 hover:shadow-indigo-600/20 active:scale-97 transition-all duration-300 h-10 border-none cursor-pointer">
                  GET STARTED
                </Button>
              </Link>
            </div>
          )}

          {/* Mobile Menu Action Selector */}
          <Button
            variant="ghost"
            size="icon"
            className="md:hidden rounded-xl bg-accent/60 hover:bg-accent/100 text-foreground w-10 h-10 border border-border/40"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X size={18} /> : <Menu size={18} />}
          </Button>
        </div>
      </div>

      {/* Mobile Backdrop Overlay Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden absolute top-full left-0 w-full bg-background/95 dark:bg-background/90 backdrop-blur-xl border-b border-border/70 p-6 space-y-6 shadow-[0_24px_50px_rgba(0,0,0,0.15)] animate-in slide-in-from-top-4 duration-300 rounded-b-2xl">
          <div className="flex flex-col gap-1.5">
            {navLinks.map((link) => {
              const isActive =
                link.path === "/"
                  ? location.pathname === "/"
                  : location.pathname.startsWith(link.path);
              return (
                <Link
                  key={link.path}
                  to={link.path}
                  onClick={() => setMobileMenuOpen(false)}
                  className={cn(
                    "flex items-center justify-between px-4 py-3 rounded-xl font-bold transition-all duration-200 text-xs tracking-wider uppercase",
                    isActive
                      ? "bg-indigo-500/15 text-indigo-600 dark:text-indigo-400 font-extrabold border-l-3 border-indigo-500"
                      : "text-foreground hover:bg-accent/60 text-muted-foreground",
                  )}
                >
                  <span>{link.label}</span>
                  <ChevronRight
                    size={13}
                    className={cn(
                      "opacity-40 transition-transform",
                      isActive && "translate-x-0.5 opacity-100 text-indigo-500",
                    )}
                  />
                </Link>
              );
            })}
          </div>

          <div className="pt-6 border-t border-border/60 flex flex-col gap-3">
            <div className="flex items-center justify-between bg-accent/30 px-4 py-3.5 rounded-xl">
              <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
                Appearance
              </span>
              <ThemeToggle />
            </div>

            {user && (
              <div className="flex items-center justify-between bg-accent/30 px-4 py-3 rounded-xl">
                <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider font-extrabold">
                  Notifications
                </span>
                <NotificationDropdown />
              </div>
            )}

            {user ? (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link
                  to={user?.role === "admin" ? "/admin" : "/organizer"}
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl h-11 text-xs uppercase cursor-pointer">
                    Dashboard
                  </Button>
                </Link>
                <Button
                  variant="outline"
                  onClick={handleLogout}
                  className="w-full font-extrabold rounded-xl h-11 text-xs text-red-500 hover:bg-red-500/10 border-none uppercase"
                >
                  Logout
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-2 pt-2">
                <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                  <Button
                    variant="outline"
                    className="w-full font-extrabold rounded-xl h-11 text-xs border-border/80 text-foreground uppercase"
                  >
                    Login
                  </Button>
                </Link>
                <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                  <Button className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold rounded-xl h-11 text-xs uppercase cursor-pointer border-none">
                    Get Started
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}

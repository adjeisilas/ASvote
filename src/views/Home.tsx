import { useState, useEffect } from 'react';
import { databaseService } from '../services/database';
import { Event } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, Users, ArrowRight, Timer, Vote, Shield, Zap, BarChart, Globe, CheckCircle2, Mail, ChevronLeft, ChevronRight, MapPin, Tag, Trophy } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatSafeDistanceToNow, slugify } from '../lib/utils';

export default function Home() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'voting' | 'ticketing'>('all');

  const [featuredEvents, setFeaturedEvents] = useState<Event[]>([]);
  const [featuredEvent, setFeaturedEvent] = useState<Event | null>(null);
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isUsingFallbacks, setIsUsingFallbacks] = useState(false);

  const fallbackSlides = [
    {
      id: 'fallback-system',
      title: 'Host Your First Event',
      description: 'Create and launch highly customized live voting campaigns and secure ticketing experiences on ASVote.',
      coverImage: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=1000',
      type: 'voting' as const,
      status: 'active' as const,
      organizerId: 'system',
      categoryIds: [],
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 30),
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ];

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const now = new Date();
        const mappedEvents = await databaseService.getEvents({ status: 'active' });
        
        // Filter out events that have already ended
        const activeEvents = mappedEvents.filter(e => {
          if (!e.endDate) return true;
          return new Date(e.endDate) > now;
        });

        setEvents(mappedEvents); // Keep all active status events for the list (we'll handle ENDED state in cards)
        
        // Take top 5 non-ended events for carousel, prioritize voting events
        const topEvents = [...activeEvents]
          .sort((a, b) => (b.type === 'voting' ? 1 : 0) - (a.type === 'voting' ? 1 : 0))
          .slice(0, 5);
        
        const displaySlides = topEvents.length > 0 ? topEvents : (fallbackSlides as any as Event[]);
        setFeaturedEvents(displaySlides);
        setFeaturedEvent(displaySlides[0]);
        setIsUsingFallbacks(topEvents.length === 0);
      } catch (error) {
        console.error("Error fetching events:", error);
        setFeaturedEvents(fallbackSlides as any as Event[]);
        setFeaturedEvent(fallbackSlides[0] as any as Event);
        setIsUsingFallbacks(true);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  // Carousel Auto-play logic
  useEffect(() => {
    if (featuredEvents.length <= 1) return;
    
    const interval = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % featuredEvents.length);
    }, 6000);
    
    return () => clearInterval(interval);
  }, [featuredEvents.length]);

  // Update featuredEvent when slide changes
  useEffect(() => {
    if (featuredEvents.length > 0) {
      setFeaturedEvent(featuredEvents[currentSlide]);
    }
  }, [currentSlide, featuredEvents]);

  useEffect(() => {
    let result = events;
    
    if (typeFilter !== 'all') {
      result = result.filter(e => e.type === typeFilter);
    }
    
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      result = result.filter(e => 
        e.title.toLowerCase().includes(query) || 
        e.description.toLowerCase().includes(query)
      );
    }
    
    setFilteredEvents(result);
  }, [searchQuery, typeFilter, events]);

  return (
    <div className="bg-background selection:bg-indigo-100 selection:text-indigo-900 transition-colors duration-300">
      {/* Hero Section - Refined with elegant gradients and glassmorphism */}
      <section className="relative min-h-0 md:min-h-[92vh] flex items-start md:items-center pt-0 md:pt-16 pb-0 md:pb-6 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-background transition-colors duration-300"></div>
          {/* Soft Mesh Gradients with High-End Color Palette */}
          <div className="absolute top-[-10%] left-[-10%] w-[55%] h-[55%] bg-indigo-500/10 rounded-full blur-[140px] opacity-70"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[45%] h-[55%] bg-indigo-600/10 rounded-full blur-[140px] opacity-70"></div>
          <div className="absolute top-[20%] right-[10%] w-[35%] h-[35%] bg-indigo-400/5 rounded-full blur-[110px] opacity-40"></div>
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.02] mix-blend-overlay"></div>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 1.5px 1.5px, var(--border) 1.2px, transparent 0)', backgroundSize: '40px 40px', opacity: 0.8 }}></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative">
          <div className="flex flex-col lg:flex-row items-center gap-12 lg:gap-24">
            <div className="flex-1 text-center lg:text-left max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                className="space-y-6"
              >
                <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-indigo-500/20 mb-2 shadow-xs bg-transparent">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                  </span>
                  <span className="text-[10px] font-extrabold uppercase tracking-[0.25em] text-indigo-700 dark:text-indigo-400">The Future of Event Engagement</span>
                </div>
                
                <h1 className="text-4xl sm:text-6xl md:text-7xl lg:text-[5.5rem] font-extrabold tracking-tight text-foreground leading-[0.92] uppercase">
                  Impact <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-indigo-600 to-indigo-500">Every Second.</span>
                </h1>
                
                <p className="text-base md:text-[1.125rem] leading-relaxed text-muted-foreground max-w-xl font-medium">
                  ASVote is the premier destination for high-integrity, secure digital voting campaigns and premium live event ticketing. Elegant, transparent, and built for scale.
                </p>

                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4 pt-4">
                  <Link to="/register" className="group">
                    <Button className="w-full sm:w-auto bg-indigo-600 hover:bg-indigo-750 text-white h-13 px-8 rounded-xl text-sm font-black shadow-[0_10px_20px_-10px_rgba(79,70,229,0.35)] hover:shadow-[0_15px_25px_-10px_rgba(79,70,229,0.45)] hover:-translate-y-0.5 transition-all duration-300 flex items-center justify-center gap-2 border-none">
                      GET STARTED <ArrowRight size={16} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <a href="#events">
                    <Button variant="outline" className="w-full sm:w-auto h-13 px-8 rounded-xl text-sm font-black text-foreground border border-border bg-card/65 backdrop-blur-md hover:bg-accent hover:-translate-y-0.5 transition-all duration-300">
                      EXPLORE LIVE
                    </Button>
                  </a>
                </div>

                <div className="pt-4 md:pt-6 grid grid-cols-2 lg:flex lg:flex-wrap items-center justify-center lg:justify-start gap-2 md:gap-3">
                  <div className="flex items-center justify-center lg:justify-start gap-2 md:gap-2.5 bg-card/65 dark:bg-card/40 backdrop-blur-md px-3 md:px-3.5 py-1.5 md:py-2 rounded-xl border border-border/60 shadow-xs hover:border-indigo-500/20 hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                    <Shield size={14} className="text-indigo-650" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Paystack Secure</span>
                  </div>
                  <div className="flex items-center justify-center lg:justify-start gap-2.5 bg-card/65 dark:bg-card/40 backdrop-blur-md px-3.5 py-2 rounded-xl border border-border/60 shadow-xs hover:border-indigo-500/20 hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                    <Zap size={14} className="text-indigo-650" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Instant Updates</span>
                  </div>
                  <div className="col-span-2 justify-self-center flex items-center justify-center lg:justify-start gap-2.5 bg-card/65 dark:bg-card/40 backdrop-blur-md px-3.5 py-2 rounded-xl border border-border/60 shadow-xs hover:border-indigo-500/20 hover:-translate-y-0.5 transition-all duration-300 cursor-default">
                    <CheckCircle2 size={14} className="text-indigo-650" />
                    <span className="text-[10px] font-black uppercase tracking-wider text-muted-foreground">Verified Results</span>
                  </div>
                </div>
              </motion.div>
            </div>

            <div className="flex-1 relative hidden lg:block w-full max-w-2xl">
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 20 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ duration: 1, delay: 0.2, ease: [0.16, 1, 0.3, 1] }}
                className="relative"
              >
                {/* Floating Decorative Elements */}
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-indigo-500/5 rounded-[3rem] -z-10 animate-pulse"></div>
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-blue-500/5 rounded-full -z-10 animate-bounce [animation-duration:8s]"></div>
                
                <div className="relative h-[500px] w-full group">
                  <AnimatePresence mode="wait">
                    {featuredEvent ? (
                      <motion.div
                        key={featuredEvent.id}
                        initial={{ opacity: 0, x: 40, rotateY: -10 }}
                        animate={{ opacity: 1, x: 0, rotateY: 0 }}
                        exit={{ opacity: 0, x: -40, rotateY: 10 }}
                        transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                        className="absolute inset-0 perspective-1000"
                      >
                        <div className="bg-card p-3.5 rounded-3xl shadow-[0_32px_64px_-16px_rgba(0,0,0,0.08)] border border-border/80 relative overflow-hidden transition-all duration-700 h-full flex flex-col hover:shadow-[0_48px_80px_-24px_rgba(79,70,229,0.12)] hover:-translate-y-1">
                          <div className="relative flex-1 overflow-hidden rounded-2xl w-full h-full">
                            {isUsingFallbacks ? (
                              <div className="w-full h-full bg-gradient-to-br from-indigo-950 via-slate-900 to-slate-950 flex flex-col justify-between p-8 relative overflow-hidden">
                                <img 
                                  src="https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=1000" 
                                  alt="No Live Event Fallback" 
                                  className="absolute inset-0 w-full h-full object-cover opacity-20 mix-blend-overlay transition-transform duration-[1.2s] group-hover:scale-105 pointer-events-none"
                                  referrerPolicy="no-referrer"
                                />
                                <div className="absolute top-0 right-0 w-80 h-80 bg-indigo-500/10 rounded-full blur-3xl"></div>
                                <div className="absolute -bottom-10 -left-10 w-60 h-60 bg-blue-600/5 rounded-full blur-3xl"></div>
                                
                                <div className="flex justify-between items-start z-10 w-full">
                                  <div className="bg-white/5 border border-white/10 px-3.5 py-1.5 rounded-full flex items-center gap-1.5 backdrop-blur-md">
                                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-400 animate-pulse" />
                                    <span className="text-[9px] font-black tracking-widest text-indigo-300 uppercase">ASVote System</span>
                                  </div>
                                  <Trophy size={18} className="text-indigo-400/80" />
                                </div>

                                <div className="z-10 text-left">
                                  <Badge className="bg-indigo-650 border-none text-white px-2.5 py-0.5 rounded-md font-black text-[9px] uppercase tracking-wider mb-3">
                                    Campaign Hub
                                  </Badge>
                                  <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight mb-2 uppercase">
                                    Ready for Impact
                                  </h3>
                                  <p className="text-xs text-slate-300 font-medium leading-relaxed max-w-sm">
                                    Build custom live voting tracks and premium digital admissions with real-time analytics and high integrity.
                                  </p>
                                </div>
                              </div>
                            ) : (
                              <img 
                                src={featuredEvent.coverImage || "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=1000"} 
                                alt={featuredEvent.title} 
                                className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105"
                              />
                            )}
                            
                            {/* Floating Real-Time Verifiable Hub Badge */}
                            {!isUsingFallbacks && (
                              <div className="absolute top-4 right-4 z-20 flex items-center gap-1.5 bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 text-white shadow-lg">
                                <Globe size={11} className="text-indigo-400 animate-pulse" />
                                <span className="text-[8px] font-black uppercase tracking-widest whitespace-nowrap">Secured Gateway</span>
                              </div>
                            )}
                            
                            {/* Slide info backdrop scrim */}
                            {!isUsingFallbacks && (
                              <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-slate-950 via-slate-950/40 to-transparent z-10 flex flex-col justify-end">
                                <div className="flex items-center gap-2 mb-2">
                                  <Badge className="bg-indigo-600 border-none text-white px-2.5 py-0.5 rounded-md font-black text-[9px] uppercase tracking-wider">
                                    {featuredEvent.type === 'voting' ? 'Live voting campaign' : 'Premium Ticketing'}
                                  </Badge>
                                  <span className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
                                  <span className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">Active Now</span>
                                </div>
                                <h3 className="text-2xl md:text-3xl font-black text-white tracking-tight leading-tight line-clamp-1 mb-2">
                                  {featuredEvent.title}
                                </h3>
                                <p className="text-xs text-slate-300 font-medium line-clamp-2 leading-relaxed mb-1 max-w-md hidden sm:block">
                                  {featuredEvent.description || "Secure, professional digital voting campaigns and premium live event ticketing platform."}
                                </p>
                              </div>
                            )}

                            {/* Clickable Overlay Link if not fallback */}
                            {!isUsingFallbacks && (
                              <Link to={`/event/${slugify(featuredEvent.title)}`} className="absolute inset-0 z-15" />
                            )}
                          </div>
                        </div>
                      </motion.div>
                    ) : (
                      <div className="absolute inset-0 bg-slate-50 animate-pulse rounded-[3rem]"></div>
                    )}
                  </AnimatePresence>

                  {/* Carousel Controls - Floating UI */}
                  {featuredEvents.length > 1 && (
                    <div className="absolute right-6 bottom-6 flex gap-2 z-25">
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentSlide(prev => (prev - 1 + featuredEvents.length) % featuredEvents.length); }}
                        className="w-10 h-10 rounded-xl bg-background/90 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all text-muted-foreground border border-border/40 active:scale-95 cursor-pointer"
                      >
                        <ChevronLeft size={16} strokeWidth={3} />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setCurrentSlide(prev => (prev + 1) % featuredEvents.length); }}
                        className="w-10 h-10 rounded-xl bg-background/90 backdrop-blur-md shadow-lg flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all text-muted-foreground border border-border/40 active:scale-95 cursor-pointer"
                      >
                        <ChevronRight size={16} strokeWidth={3} />
                      </button>
                    </div>
                  )}
                  
                  {/* Progress Indicator Dots pill container */}
                  {featuredEvents.length > 1 && (
                    <div className="absolute top-6 right-6 flex gap-1.5 z-25 bg-black/45 backdrop-blur-md px-3 py-1.5 rounded-full border border-white/10">
                      {featuredEvents.map((_, i) => (
                        <button
                          key={i}
                          onClick={() => setCurrentSlide(i)}
                          className={cn(
                            "h-1.5 rounded-full transition-all duration-700",
                            currentSlide === i ? "w-6 bg-white" : "w-1.5 bg-white/40"
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

       {/* Main Events Search and Filters - Sleek Glassmorphic Control Panel */}
      <section className="pt-0 md:pt-2 pb-12 container mx-auto px-4 sm:px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <div className="flex flex-col md:flex-row items-stretch justify-center gap-4 bg-card/60 backdrop-blur-xl border border-border/80 p-3 rounded-[2rem] shadow-[0_24px_48px_-12px_rgba(0,0,0,0.06)] hover:shadow-[0_24px_48px_-12px_rgba(79,70,229,0.06)] transition-all duration-500">
             <div className="relative flex-grow group">
                <Users size={18} className="absolute left-5 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search events, campaigns, awards..." 
                  className="w-full h-14 pl-14 pr-6 rounded-[1.4rem] bg-accent/40 border border-transparent focus:border-border focus:bg-background focus:ring-4 focus:ring-indigo-500/5 outline-none transition-all font-semibold text-sm text-foreground placeholder:text-muted-foreground/50"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
             
             <div className="flex p-1 bg-accent/40 rounded-[1.4rem] border border-border/60 overflow-x-auto whitespace-nowrap self-stretch">
                {(['all', 'voting', 'ticketing'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTypeFilter(filter)}
                    className={cn(
                      "px-6 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-[0.15em] transition-all duration-300",
                      typeFilter === filter 
                        ? "bg-background text-foreground shadow-md font-extrabold border border-border/40" 
                        : "text-muted-foreground hover:text-foreground hover:bg-background/20"
                    )}
                  >
                    {filter}
                  </button>
                ))}
             </div>
          </div>
        </div>
      </section>

      {/* Main Events Section */}
      <section id="events" className="pb-24 md:pb-40 container mx-auto px-4 sm:px-6 relative z-10">
        <div className="flex flex-col text-center items-center mb-16 md:mb-24">
           <div className="inline-flex items-center gap-2.5 px-3 py-1.5 rounded-full bg-indigo-500/5 border border-indigo-500/10 text-indigo-600 dark:text-indigo-400 text-[9px] font-extrabold uppercase tracking-[0.2em] mb-4">
             ⚡ Featured Programs
           </div>
           <h2 className="text-3xl md:text-5xl lg:text-6xl font-black tracking-tight text-foreground uppercase mb-6 leading-none font-sans">
             Ongoing <span className="text-indigo-600 italic font-serif lowercase font-normal leading-tight">and</span> Urgent Events
           </h2>
           <p className="text-muted-foreground text-sm max-w-lg leading-relaxed font-medium">
             Cast your votes or secure admission passes to top pageantries, award ceremonies, and community summits.
           </p>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8">
            {[1, 2, 3, 4].map(i => (
              <div key={i} className="h-[520px] bg-accent/40 border border-border animate-pulse rounded-3xl"></div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 md:gap-8 max-w-7xl mx-auto justify-items-center">
            {filteredEvents.map((event, index) => {
              const isVote = event.type === 'voting';
              const isEnded = event.endDate && new Date(event.endDate) < new Date();
              return (
                <motion.div
                  key={event.id}
                  initial={{ opacity: 0, y: 30 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: Math.min(index * 0.05, 0.3), duration: 0.6 }}
                  className="w-full max-w-[290px]"
                >
                  <Card className="group h-[520px] overflow-hidden border border-border/80 bg-card hover:border-indigo-550/30 hover:shadow-[0_24px_50px_-12px_rgba(79,70,229,0.08)] transition-all duration-300 rounded-3xl flex flex-col relative text-center">
                    {/* Cover Frame */}
                    <div className="relative h-[240px] overflow-hidden bg-accent shrink-0">
                      <img 
                        src={event.coverImage || "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=1000"} 
                        alt={event.title} 
                        className="w-full h-full object-cover transition-transform duration-[1.2s] ease-out group-hover:scale-[1.06]"
                        referrerPolicy="no-referrer"
                      />
                      
                      {/* Gradient Rim */}
                      <div className="absolute inset-0 bg-gradient-to-t from-slate-950/40 via-transparent to-transparent opacity-60" />
                      
                      {/* LIVE/ENDED Tag */}
                      <div className="absolute top-4 left-4 z-10">
                         {isEnded ? (
                           <div className="bg-rose-600/90 backdrop-blur-md text-white border border-rose-500/20 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
                              <span className="text-[8px] font-black uppercase tracking-widest">CLOSED</span>
                           </div>
                         ) : (
                           <div className="bg-emerald-500/95 backdrop-blur-md text-slate-950 border border-emerald-400/20 px-3 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                              <span className="w-1.5 h-1.5 rounded-full bg-slate-950 animate-pulse"></span>
                              <span className="text-[8px] font-black uppercase tracking-widest">LIVE</span>
                           </div>
                         )}
                      </div>

                      {/* Event Type Badge at top right */}
                      <div className="absolute top-4 right-4 z-10">
                        <span className="text-[8px] font-black uppercase tracking-wider bg-black/60 text-white/90 border border-white/10 px-2.5 py-1 rounded-lg">
                          {isVote ? 'VOTING' : 'TICKETS'}
                        </span>
                      </div>
                    </div>
                    
                    {/* Card Content stub */}
                    <div className="p-4 flex-grow flex flex-col items-center justify-between">
                      <div className="w-full">
                        <h3 className="text-sm font-extrabold text-foreground tracking-tight mb-1 group-hover:text-indigo-600 transition-colors uppercase line-clamp-2 min-h-[2.5rem] flex items-center justify-center leading-snug">
                          {event.title}
                        </h3>
                        
                        <div className="flex items-center justify-center gap-2 mb-2 text-muted-foreground text-[8px] font-black uppercase tracking-widest">
                          <div className="flex items-center gap-1">
                            <Calendar size={10} className="text-indigo-500" />
                            <span>{new Date(event.startDate || event.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                          </div>
                          <div className="w-1 h-1 bg-border/80 rounded-full" />
                          <div className="flex items-center gap-1 truncate max-w-[110px]">
                            <MapPin size={10} className="text-indigo-500 shrink-0" />
                            <span className="truncate">{(event as any).location || (event as any).venue || "Ghana"}</span>
                          </div>
                        </div>
                      </div>

                      {/* Separation Notched Line */}
                      <div className="w-full relative flex items-center justify-center my-1.5">
                        <div className="absolute -left-6 w-3 h-3 bg-background border-r border-border/80 rounded-full"></div>
                        <div className="w-full h-[1px] border-t border-dashed border-border/80"></div>
                        <div className="absolute -right-6 w-3 h-3 bg-background border-l border-border/80 rounded-full"></div>
                      </div>

                      <div className="w-full">
                        <div className="flex items-center justify-between w-full mb-3 px-1">
                           <div className="text-left">
                              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">Camp Status</p>
                              <Badge variant="outline" className={cn("text-[8px] font-extrabold px-1.5 py-0 rounded-md uppercase tracking-wider", isEnded ? "border-rose-200 text-rose-500 bg-rose-50/10" : "border-indigo-100 text-indigo-500 bg-indigo-50/10")}>
                                 {isEnded ? 'ENDED' : event.status}
                              </Badge>
                           </div>
                           <div className="text-right">
                              <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0.5">
                                {isEnded ? 'Final' : 'Closing'}
                              </p>
                              <p className={cn("text-[9px] font-black uppercase", isEnded ? "text-muted-foreground" : "text-rose-500")}>
                                {isEnded 
                                  ? formatSafeDistanceToNow(event.endDate).replace('about ', '')
                                  : formatSafeDistanceToNow(event.endDate || event.updatedAt).replace('about ', '')
                                }
                              </p>
                           </div>
                        </div>
                        
                        <Link to={`/event/${slugify(event.title)}`} className="w-full block">
                          <Button 
                            variant="outline" 
                            className="w-full h-9 border border-border hover:border-indigo-600 hover:bg-indigo-600 hover:text-white text-foreground font-black rounded-lg transition-all duration-300 group/btn flex items-center justify-center gap-1.5 uppercase text-[9px] tracking-widest bg-transparent"
                          >
                            {isEnded ? 'VIEW RESULTS' : (isVote ? 'VOTE' : 'GET TICKETS')} 
                            <ArrowRight size={12} className="group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </div>
                  </Card>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* High-Fidelity Clean empty state for a pristine developer/production environment */
          <div className="flex flex-col items-center justify-center py-20 px-6 text-center max-w-lg mx-auto bg-card/45 backdrop-blur-md rounded-[2.5rem] border border-border/80 shadow-md relative overflow-hidden">
            <div className="absolute inset-0 -z-10 pointer-events-none opacity-[0.03]">
              <img 
                src="https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=1000" 
                alt="Empty State Background" 
                className="w-full h-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <div className="w-16 h-16 rounded-[1.2rem] bg-indigo-500/5 border border-indigo-505/10 flex items-center justify-center mb-6 text-indigo-550 shadow-inner">
              <Calendar size={28} className="text-indigo-600 dark:text-indigo-400" />
            </div>
            <h3 className="text-xl font-extrabold tracking-tight text-foreground uppercase mb-2">No Active Events Found</h3>
            <p className="text-muted-foreground text-xs leading-relaxed mb-8 font-semibold max-w-sm">
              Your database is clean and ready. Sign in to your Organizer dashboard or Admin portal to create and activate pristine voting sessions or premium ticketing events!
            </p>
            <div className="flex flex-col sm:flex-row gap-3 w-full justify-center">
              <Link to="/login" className="w-full sm:w-auto">
                <Button className="w-full bg-indigo-650 hover:bg-indigo-750 text-white font-black text-xs uppercase px-8 py-3 rounded-xl border-none">
                  ADMIN SIGN IN
                </Button>
              </Link>
              <Link to="/register" className="w-full sm:w-auto">
                <Button variant="outline" className="w-full h-11 border border-border hover:bg-accent text-foreground font-black text-xs uppercase px-8 rounded-xl bg-transparent">
                  REGISTER ORGANIZER
                </Button>
              </Link>
            </div>
          </div>
        )}
      </section>

      {/* Features Showcase Section - Modern Architectural Bento Grid */}
      <section className="py-24 md:py-36 bg-[#040406] text-white overflow-hidden relative border-t border-border/20">
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-20">
          <div className="absolute top-[-20%] left-1/2 -translate-x-1/2 w-[1200px] h-[700px] bg-gradient-to-b from-indigo-900/30 to-transparent rounded-full blur-[200px]"></div>
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1f293708_1px,transparent_1px),linear-gradient(to_bottom,#1f293708_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>

        <div className="container mx-auto px-4 sm:px-6 relative z-10">
           <div className="max-w-6xl mx-auto mb-20 md:mb-28">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24 items-end">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8 }}
                >
                  <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-[9px] font-extrabold uppercase tracking-[0.3em] mb-6 shadow-inner">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    Engine Specifications
                  </div>
                  <h2 className="text-4xl md:text-7xl lg:text-8xl font-black tracking-tighter uppercase leading-[0.9] mb-0 font-sans">
                    Precision <br /> <span className="text-white/20 italic font-serif lowercase font-normal -ml-1">architected</span>
                  </h2>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.1 }}
                  className="pb-2 md:pb-4"
                >
                  <p className="text-slate-400 text-sm md:text-base leading-relaxed max-w-md font-medium">
                    Our high-throughput ecosystem establishes a gold standard in scale, securing votes and premium transactions with cryptographic fidelity.
                  </p>
                </motion.div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border-y border-white/10 overflow-hidden rounded-[2rem] max-w-6xl mx-auto shadow-[0_40px_80px_-30px_rgba(0,0,0,0.8)]">
              {[
                { icon: <Shield size={22} className="text-indigo-400" />, title: "Secure Payouts", desc: "Automated settlements powered by preeminent fintech pipelines offering zero-friction merchant payouts.", num: "01" },
                { icon: <Zap size={22} className="text-rose-400" />, title: "Real-time Edge", desc: "Results synchronize across multiple centers instantaneously with advanced streaming protocol support.", num: "02" },
                { icon: <BarChart size={22} className="text-emerald-400" />, title: "Live Analytics", desc: "Exquisite control panels detailing voter telemetry and geographical interactions in granular formats.", num: "03" },
                { icon: <Globe size={22} className="text-blue-400" />, title: "Custom Channels", desc: "Incorporate localized payments with diverse billing platforms engineered for localized scale.", num: "04" }
              ].map((feature, i) => (
                <div key={i} className="group relative bg-[#060609] p-12 md:p-16 hover:bg-white/[0.015] transition-all duration-700">
                   <div className="flex justify-between items-start mb-10">
                      <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-600 group-hover:text-white transition-all duration-500 border border-white/10 group-hover:border-transparent">
                         {feature.icon}
                      </div>
                      <span className="font-serif italic text-5xl text-white/5 group-hover:text-white/10 transition-colors duration-700">{feature.num}</span>
                   </div>
                   <h4 className="text-xl md:text-2xl font-bold mb-4 uppercase tracking-tight group-hover:text-indigo-400 transition-colors">{feature.title}</h4>
                   <p className="text-slate-500 text-sm md:text-base font-medium leading-relaxed group-hover:text-slate-300 transition-colors max-w-sm">{feature.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* CTA Section - Bold Editorial Modern Display */}
      <section className="py-24 md:py-40 bg-background overflow-hidden relative">
        <div className="container mx-auto px-4 sm:px-6">
           <div className="relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-indigo-500/5 rounded-full blur-[120px] pointer-events-none"></div>
              
              <div className="relative z-10 text-center max-w-5xl mx-auto">
                 <motion.div
                    initial={{ opacity: 0, scale: 0.95 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                    className="space-y-10"
                 >
                    <h2 className="text-4xl sm:text-6xl md:text-[11vw] font-black text-foreground tracking-tighter uppercase leading-[0.8] mb-0 font-sans">
                       BUILT FOR <br /> <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500 italic font-serif lowercase font-normal">impact.</span>
                    </h2>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 pt-8 max-w-3xl mx-auto border-t border-border/80">
                       <p className="text-muted-foreground text-sm md:text-base font-medium max-w-xs text-center md:text-left leading-relaxed">
                          Secure your audience's votes or organize the next landmark conference with ASVote's complete suite of tools.  
                       </p>
                       
                       <Link to="/register">
                          <Button className="group h-16 md:h-20 px-8 md:px-12 bg-primary text-primary-foreground hover:bg-indigo-600 rounded-[1.2rem] text-sm md:text-base font-black transition-all hover:scale-[1.03] active:scale-95 shadow-[0_20px_40px_-5px_rgba(79,70,229,0.2)] uppercase tracking-widest flex items-center gap-3 border-none">
                             START TODAY
                             <ArrowRight className="w-4 h-4 md:w-5 md:h-5 transition-transform group-hover:translate-x-1.5" strokeWidth={3} />
                          </Button>
                       </Link>
                    </div>
                 </motion.div>
              </div>
           </div>
        </div>
      </section>

      {/* Premium Newsletter Section - Refined Editorial Cards */}
      <section className="py-24 md:py-36 bg-accent/20 border-t border-border/60 relative z-10">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center max-w-6xl mx-auto container px-6">
            <div className="space-y-6 md:space-y-8">
               <div className="inline-flex items-center gap-3 text-indigo-600 text-[10px] font-black uppercase tracking-[0.4em]">
                  <div className="w-8 h-[2px] bg-indigo-600"></div>
                  Direct Bulletin
               </div>
               <h3 className="text-3xl sm:text-5xl md:text-6xl font-black tracking-tight uppercase text-foreground leading-[0.95] font-sans">
                  The Intelligence <br /><span className="font-serif italic font-normal text-muted-foreground/40 lowercase leading-none">network</span>
               </h3>
               <p className="text-muted-foreground text-sm md:text-base font-medium leading-relaxed max-w-md">
                 Join our inner circle for high-performance updates on new features, merchant settlement enhancements, and exclusive pageant tools.
               </p>
            </div>
            
            <div className="relative">
               {/* Decorative floating card background */}
               <div className="absolute inset-0 bg-indigo-600/5 rounded-[2.5rem] -rotate-2 scale-98 pointer-events-none"></div>
               <div className="relative bg-card rounded-[2rem] p-8 sm:p-12 border border-border/80 shadow-[0_32px_64px_-16px_rgba(0,0,0,0.05)]">
                  <form className="space-y-5" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-2">
                       <label className="text-[9px] font-black uppercase tracking-widest text-muted-foreground ml-1">Direct Channel</label>
                       <div className="flex items-center gap-3 px-5 h-14 bg-accent/60 rounded-2xl border border-border/80 focus-within:border-indigo-500/80 focus-within:bg-background/80 transition-all duration-300">
                          <Globe className="text-indigo-500 w-4 h-4 shrink-0" />
                          <input 
                            type="email" 
                            placeholder="your@strategic-email.com" 
                            className="flex-grow bg-transparent outline-none font-semibold text-sm text-foreground placeholder:text-muted-foreground/30 w-full"
                          />
                       </div>
                    </div>
                    <Button className="h-14 w-full bg-primary text-primary-foreground font-black rounded-2xl hover:bg-indigo-600 transition-all uppercase text-xs tracking-wider shadow-[0_12px_24px_-8px_rgba(79,70,229,0.15)] group/btn flex items-center justify-center gap-2.5 border-none">
                       SUBSCRIBE TO PULSE
                       <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <p className="text-[8px] font-bold text-muted-foreground/60 uppercase tracking-widest text-center">Highly curated correspondence. Instant unsubscribe anytime.</p>
                  </form>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}

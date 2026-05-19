import { useState, useEffect } from 'react';
import { databaseService } from '../services/database';
import { Event } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, Users, ArrowRight, Timer, Vote, Shield, Zap, BarChart, Globe, CheckCircle2, Mail, ChevronLeft, ChevronRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'motion/react';
import { cn, formatSafeDistanceToNow } from '../lib/utils';

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
      id: 'fallback-1',
      title: 'Ghana Youth Leaders & Professional Awards',
      description: 'Vote for your favorite young leaders making an impact.',
      coverImage: 'https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=1000',
      type: 'voting' as const,
      status: 'active' as const,
      organizerId: 'system',
      categoryIds: [],
      startDate: new Date(),
      endDate: new Date(Date.now() + 86400000 * 30),
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: 'fallback-2',
      title: 'Web Developer of the Year 2026',
      description: 'The premier competition for modern software engineers.',
      coverImage: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?auto=format&fit=crop&q=80&w=1000',
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
      <section className="relative min-h-[92vh] flex items-center pt-10 md:pt-16 pb-20 overflow-hidden">
        {/* Background Elements */}
        <div className="absolute inset-0 -z-10 pointer-events-none">
          <div className="absolute inset-0 bg-background transition-colors duration-300"></div>
          {/* Soft Mesh Gradients */}
          <div className="absolute top-[-10%] left-[-10%] w-[50%] h-[50%] bg-indigo-500/10 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[50%] bg-blue-500/10 rounded-full blur-[120px] opacity-60"></div>
          <div className="absolute top-[20%] right-[10%] w-[30%] h-[30%] bg-rose-500/10 rounded-full blur-[100px] opacity-40"></div>
          
          {/* Subtle Grid Pattern */}
          <div className="absolute inset-0 bg-[url('/noise.svg')] opacity-[0.03] mix-blend-overlay"></div>
          <div className="absolute inset-0" style={{ backgroundImage: 'radial-gradient(circle at 2px 2px, var(--border) 1px, transparent 0)', backgroundSize: '48px 48px' }}></div>
        </div>

        <div className="container mx-auto px-6 relative">
          <div className="flex flex-col lg:flex-row items-center gap-16 lg:gap-24">
            <div className="flex-1 text-center lg:text-left max-w-3xl">
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
              >
                <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-background/50 backdrop-blur-md border border-border mb-8 shadow-sm">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-indigo-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-indigo-600"></span>
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground">The Future of Event Engagement</span>
                </div>
                
                <h1 className="text-3xl sm:text-5xl md:text-7xl lg:text-8xl font-black tracking-tight text-foreground leading-[0.95] mb-8 uppercase">
                  Impact <br className="hidden md:block" />
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-600 via-blue-600 to-indigo-500">Every Second.</span>
                </h1>
                
                <p className="text-base md:text-xl text-muted-foreground max-w-xl mb-12 leading-relaxed font-medium">
                  ASVote is the premier destination for high-stakes voting competitions and elite event ticketing. Secure, transparent, and built for scale.
                </p>

                <div className="flex flex-col sm:flex-row justify-center lg:justify-start gap-4">
                  <Link to="/register" className="group">
                    <Button className="w-full sm:w-auto bg-primary hover:bg-indigo-600 text-primary-foreground h-14 md:h-16 px-10 md:px-12 rounded-2xl text-base font-black shadow-xl shadow-indigo-500/10 transition-all hover:scale-105 active:scale-95 flex items-center justify-center gap-3 border-none">
                      GET STARTED <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                    </Button>
                  </Link>
                  <a href="#events">
                    <Button variant="outline" className="w-full sm:w-auto h-14 md:h-16 px-10 md:px-12 rounded-2xl text-base font-black text-foreground border-2 border-border hover:bg-accent transition-all">
                      EXPLORE LIVE
                    </Button>
                  </a>
                </div>

                <div className="mt-16 flex flex-wrap items-center justify-center lg:justify-start gap-8 md:gap-12 opacity-40">
                  {['Paystack Secure', 'Instant Updates', 'Verified Results'].map((tag, i) => (
                    <div key={i} className="flex items-center gap-2">
                      <div className="w-1 h-1 bg-foreground rounded-full"></div>
                      <span className="text-[11px] font-black uppercase tracking-widest text-foreground">{tag}</span>
                    </div>
                  ))}
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
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-emerald-50 rounded-[3rem] -z-10 animate-pulse"></div>
                <div className="absolute -bottom-12 -left-12 w-32 h-32 bg-indigo-50 rounded-full -z-10 animate-bounce [animation-duration:8s]"></div>
                
                <div className="relative h-[650px] w-full group">
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
                        {isUsingFallbacks ? (
                          <div className="bg-card p-5 rounded-[3rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.12)] border border-border relative overflow-hidden transition-all duration-700 h-full flex flex-col cursor-default">
                             <div className="relative flex-1 overflow-hidden rounded-[2.2rem]">
                              <img 
                                src={featuredEvent.coverImage || "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=1000"} 
                                alt={featuredEvent.title} 
                                className="w-full h-full object-cover"
                              />
                            </div>
                          </div>
                        ) : (
                          <Link to={`/event/${featuredEvent.id}`}>
                            <div className="bg-card p-5 rounded-[3rem] shadow-[0_64px_128px_-32px_rgba(0,0,0,0.12)] border border-border relative overflow-hidden transition-all duration-700 h-full flex flex-col group-hover:shadow-[0_80px_160px_-40px_rgba(79,70,229,0.15)] group-hover:-translate-y-2">
                               <div className="relative flex-1 overflow-hidden rounded-[2.2rem]">
                                <img 
                                  src={featuredEvent.coverImage || "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=1000"} 
                                  alt={featuredEvent.title} 
                                  className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                                />
                                <div className="absolute top-5 left-5">
                                  <Badge className="bg-background/90 backdrop-blur-xl text-foreground border-none shadow-sm px-5 py-2 rounded-2xl font-black text-[10px] uppercase tracking-widest">
                                    FEATURED
                                  </Badge>
                                </div>
                                <div className="absolute bottom-0 left-0 right-0 p-8 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent">
                                  <div className="flex items-end justify-between gap-6">
                                    <div className="min-w-0">
                                      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-white/70 mb-2">Live Engagement</p>
                                      <h3 className="text-4xl font-black text-white tracking-tighter line-clamp-1 truncate">{featuredEvent.title}</h3>
                                    </div>
                                    <div className="bg-emerald-400 text-slate-900 px-4 py-2 rounded-xl text-[9px] font-black uppercase tracking-widest shrink-0 shadow-lg shadow-emerald-400/20">LIVE</div>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </Link>
                        )}
                      </motion.div>
                    ) : (
                      <div className="absolute inset-0 bg-slate-50 animate-pulse rounded-[3rem]"></div>
                    )}
                  </AnimatePresence>

                  {/* Carousel Controls */}
                  {featuredEvents.length > 1 && (
                    <div className="absolute -right-10 top-1/2 -translate-y-1/2 flex flex-col gap-4 z-20">
                      <button 
                        onClick={(e) => { e.preventDefault(); setCurrentSlide(prev => (prev - 1 + featuredEvents.length) % featuredEvents.length); }}
                        className="w-14 h-14 rounded-2xl bg-card shadow-2xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-muted-foreground border border-border group/btn"
                      >
                        <ChevronLeft size={24} strokeWidth={2.5} className="group-hover/btn:-translate-x-0.5 transition-transform" />
                      </button>
                      <button 
                        onClick={(e) => { e.preventDefault(); setCurrentSlide(prev => (prev + 1) % featuredEvents.length); }}
                        className="w-14 h-14 rounded-2xl bg-card shadow-2xl flex items-center justify-center hover:bg-primary hover:text-primary-foreground transition-all text-muted-foreground border border-border group/btn"
                      >
                        <ChevronRight size={24} strokeWidth={2.5} className="group-hover/btn:translate-x-0.5 transition-transform" />
                      </button>
                    </div>
                  )}
                  
                  {/* Progress Indicators */}
                  <div className="absolute -bottom-10 left-10 flex gap-3">
                    {featuredEvents.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setCurrentSlide(i)}
                        className={cn(
                          "h-2 rounded-full transition-all duration-700",
                          currentSlide === i ? "w-12 bg-indigo-600" : "w-12 bg-slate-100"
                        )}
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </section>

       {/* Main Events Search and Filters */}
      <section className="pt-20 pb-12 container mx-auto px-6">
        <div className="flex flex-col md:flex-row items-center justify-center gap-6 mb-12">
           <div className="relative w-full max-w-xl group">
              <Users size={20} className="absolute left-6 top-1/2 -translate-y-1/2 text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
              <input 
                type="text" 
                placeholder="Search events, contestants..." 
                className="w-full h-16 pl-16 pr-8 rounded-3xl bg-accent border border-border focus:bg-background focus:ring-4 focus:ring-indigo-500/10 outline-none transition-all font-bold text-foreground"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
           </div>
           
           <div className="flex p-1.5 bg-accent rounded-[1.5rem] border border-border">
              {(['all', 'voting', 'ticketing'] as const).map((filter) => (
                <button
                  key={filter}
                  onClick={() => setTypeFilter(filter)}
                  className={cn(
                    "px-8 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all",
                    typeFilter === filter 
                      ? "bg-background text-foreground shadow-xl" 
                      : "text-muted-foreground hover:text-foreground"
                  )}
                >
                  {filter}
                </button>
              ))}
           </div>
        </div>
      </section>

      {/* Main Events Section */}
      <section id="events" className="pb-20 md:pb-40 container mx-auto px-6">
        <div className="flex flex-col text-center items-center mb-12 md:mb-24">
           <h2 className="text-2xl md:text-5xl font-black tracking-tight text-foreground mb-4 uppercase">
             Cast Your Vote In These <span className="text-blue-600 underline decoration-4 underline-offset-8">Ongoing Events</span>
           </h2>
        </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[1, 2, 3].map(i => (
              <div key={i} className="aspect-square bg-accent animate-pulse rounded-2xl shadow-sm"></div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-6">
            {filteredEvents.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="group w-[290px] h-[520px] overflow-hidden border border-border bg-card hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col relative text-center shrink-0">
                   <div className="relative h-[280px] overflow-hidden bg-accent">
                    <img 
                      src={event.coverImage || "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=1000"} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                    
                    {/* LIVE/ENDED Badge */}
                    <div className="absolute top-3 left-3">
                       {event.endDate && new Date(event.endDate) < new Date() ? (
                         <div className="bg-rose-500 text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                            <span className="text-[9px] font-black uppercase tracking-wider">ENDED</span>
                         </div>
                       ) : (
                         <div className="bg-[#4ADE80] text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            <span className="text-[9px] font-black uppercase tracking-wider">LIVE</span>
                         </div>
                       )}
                    </div>
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col items-center">
                    <h3 className="text-base font-black text-foreground tracking-tight mb-1 group-hover:text-blue-600 transition-colors uppercase line-clamp-2 min-h-[2.5rem] flex items-center justify-center leading-tight">{event.title}</h3>
                    
                    <div className="flex items-center gap-2.5 mb-2.5 text-muted-foreground text-[9px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-blue-500" />
                        <span>{new Date(event.startDate || event.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <div className="w-0.5 h-0.5 bg-border rounded-full"></div>
                      <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                        {(event as any).location || (event as any).venue || "Ghana"}
                      </div>
                    </div>

                    <div className="w-full h-px bg-border mb-3 opacity-50"></div>

                    <div className="flex items-center justify-between w-full mb-4 px-1">
                       <div className="text-left">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0">Status</p>
                          <p className={`text-[10px] font-bold uppercase ${event.endDate && new Date(event.endDate) < new Date() ? 'text-rose-500' : 'text-foreground'}`}>
                            {event.endDate && new Date(event.endDate) < new Date() ? 'CLOSED' : event.status}
                          </p>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0">
                            {event.endDate && new Date(event.endDate) < new Date() ? 'Ended' : 'Closing'}
                          </p>
                          <p className={`text-[10px] font-bold uppercase ${event.endDate && new Date(event.endDate) < new Date() ? 'text-muted-foreground' : 'text-rose-500'}`}>
                            {event.endDate && new Date(event.endDate) < new Date() 
                              ? formatSafeDistanceToNow(event.endDate).replace('about ', '')
                              : formatSafeDistanceToNow(event.endDate || event.updatedAt).replace('about ', '')
                            }
                          </p>
                       </div>
                    </div>
                    
                    <Link to={`/event/${event.id}`} className="w-full mt-auto">
                      <Button variant="outline" className="w-full h-10 border-2 border-border hover:border-blue-600 hover:bg-blue-600 hover:text-white text-foreground font-bold rounded-xl transition-all group/btn flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest bg-transparent">
                        {event.endDate && new Date(event.endDate) < new Date() ? 'VIEW RESULTS' : (event.type === 'voting' ? 'VOTE' : 'TICKETS')} <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                      </Button>
                    </Link>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        ) : (
          /* Fallback Events displayed as cards */
          <div className="flex flex-wrap justify-center gap-6">
            {fallbackSlides.map((event, index) => (
              <motion.div
                key={event.id}
                initial={{ opacity: 0, y: 30 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1, duration: 0.6 }}
              >
                <Card className="group w-[290px] h-[520px] overflow-hidden border border-border bg-card hover:border-blue-500/50 hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col relative text-center shrink-0">
                   <div className="relative h-[280px] overflow-hidden bg-accent">
                    <img 
                      src={event.coverImage} 
                      alt={event.title} 
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 shadow-inner"
                      referrerPolicy="no-referrer"
                    />
                    
                    <div className="absolute top-3 left-3">
                       <div className="bg-[#4ADE80] text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                          <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                          <span className="text-[9px] font-black uppercase tracking-wider">LIVE</span>
                       </div>
                    </div>
                  </div>
                  
                  <div className="p-5 flex-grow flex flex-col items-center">
                    <h3 className="text-base font-black text-foreground tracking-tight mb-1 group-hover:text-blue-600 transition-colors uppercase line-clamp-2 min-h-[2.5rem] flex items-center justify-center leading-tight">{event.title}</h3>
                    
                    <div className="flex items-center gap-2.5 mb-2.5 text-muted-foreground text-[9px] font-black uppercase tracking-widest">
                      <div className="flex items-center gap-1.5">
                        <Calendar size={11} className="text-blue-500" />
                        <span>{new Date(event.startDate || event.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                      </div>
                      <div className="w-0.5 h-0.5 bg-border rounded-full"></div>
                      <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                        {(event as any).location || (event as any).venue || "Ghana"}
                      </div>
                    </div>

                    <div className="w-full h-px bg-border mb-3 opacity-50"></div>

                    <div className="flex items-center justify-between w-full mb-4 px-1">
                       <div className="text-left">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0">Status</p>
                          <p className="text-[10px] font-bold text-foreground uppercase">{event.status}</p>
                       </div>
                       <div className="text-right">
                          <p className="text-[8px] font-black text-muted-foreground uppercase tracking-widest mb-0">Closing</p>
                          <p className="text-[10px] font-bold text-rose-500 uppercase">{formatSafeDistanceToNow(event.endDate || event.updatedAt).replace('about ', '')}</p>
                       </div>
                    </div>
                    
                    <Button variant="outline" className="w-full h-10 border-2 border-border hover:border-blue-600 hover:bg-blue-600 hover:text-white text-foreground font-bold rounded-xl transition-all group/btn flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest bg-transparent">
                      VIEW CATEGORIES <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}
      </section>

      {/* Features Showcase Section - Professional Standard Infrastructure */}
      <section className="py-20 md:py-32 bg-[#050505] text-white overflow-hidden relative">
        {/* Subtle mesh background effect - simplified for performance */}
        <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none opacity-10">
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[1000px] h-[600px] bg-indigo-600 rounded-full blur-[160px]"></div>
        </div>

        <div className="container mx-auto px-6 relative z-10">
           <div className="max-w-5xl mx-auto mb-16 md:mb-24">
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-24 items-end">
                <motion.div
                  initial={{ opacity: 0, x: -30 }}
                  whileInView={{ opacity: 1, x: 0 }}
                  viewport={{ once: true }}
                >
                  <div className="inline-flex items-center gap-3 px-4 py-1.5 rounded-full bg-white/5 border border-white/10 text-indigo-400 text-[10px] font-black uppercase tracking-[0.3em] mb-6 md:mb-10">
                    <div className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse"></div>
                    System Architecture
                  </div>
                  <h2 className="text-3xl md:text-[8rem] font-black tracking-tighter uppercase leading-[0.85] mb-0">
                    Precision <br /> <span className="text-white/20 italic font-serif -ml-2">Engineered</span>
                  </h2>
                </motion.div>
                <motion.div 
                  initial={{ opacity: 0, y: 20 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  className="pb-2 md:pb-4"
                >
                  <p className="text-slate-400 text-base md:text-xl font-medium leading-relaxed max-w-md">Our high-performance infrastructure ensures zero latency and absolute integrity for every transaction and vote cast across the globe.</p>
                </motion.div>
              </div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-white/10 border-y border-white/10 overflow-hidden">
              {[
                { icon: <Shield size={24} className="text-indigo-400" />, title: "Secure Payouts", desc: "Automated settlement powered by leading fintech APIs with 256-bit encryption.", num: "01" },
                { icon: <Zap size={24} className="text-rose-400" />, title: "Real-time Edge", desc: "Results update in milliseconds across all continents via our global edge network.", num: "02" },
                { icon: <BarChart size={24} className="text-emerald-400" />, title: "Live Analytics", desc: "Comprehensive dashboards for organizers and fans with deep behavior insights.", num: "03" },
                { icon: <Globe size={24} className="text-blue-400" />, title: "Cross-Border", desc: "Engage your audience globally with multi-currency and multi-language support.", num: "04" }
              ].map((feature, i) => (
                <div key={i} className="group relative bg-[#050505] p-12 md:p-16 hover:bg-white/[0.02] transition-colors duration-700">
                   <div className="flex justify-between items-start mb-12">
                      <div className="w-14 h-14 rounded-2xl bg-white/5 flex items-center justify-center group-hover:bg-indigo-500 group-hover:text-white transition-all duration-500 border border-white/10">
                         {feature.icon}
                      </div>
                      <span className="font-serif italic text-6xl text-white/5 group-hover:text-white/10 transition-colors duration-700">{feature.num}</span>
                   </div>
                   <h4 className="text-2xl md:text-3xl font-black mb-6 uppercase tracking-tight group-hover:text-indigo-300 transition-colors">{feature.title}</h4>
                   <p className="text-slate-500 text-base md:text-lg font-medium leading-relaxed group-hover:text-slate-300 transition-colors max-w-sm">{feature.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>

      {/* CTA Section - Ultra Bold Editorial */}
      <section className="py-20 md:py-32 bg-background overflow-hidden">
        <div className="container mx-auto px-6">
           <div className="relative">
              <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-[120%] bg-indigo-500/10 rounded-full blur-[100px] pointer-events-none"></div>
              
              <div className="relative z-10 text-center max-w-6xl mx-auto">
                 <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    className="space-y-8 md:space-y-12"
                 >
                    <h2 className="text-4xl sm:text-6xl md:text-[14vw] font-black text-foreground tracking-tighter uppercase leading-[0.8] mb-0">
                       Built for <br /> <span className="text-indigo-600">Impact.</span>
                    </h2>
                    
                    <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16 pt-4 md:pt-8">
                       <p className="text-muted-foreground text-lg md:text-2xl font-medium max-w-md text-center md:text-left leading-relaxed">
                          Whether it's a global awards ceremony or a local community event, we provide the tools to scale.
                       </p>
                       
                       <Link to="/register">
                          <Button className="group h-20 md:h-32 px-10 md:px-20 bg-primary text-primary-foreground hover:bg-indigo-600 rounded-[1.5rem] md:rounded-[2rem] text-xl md:text-4xl font-black transition-all hover:scale-105 active:scale-95 shadow-[0_40px_80px_-15px_rgba(0,0,0,0.3)] uppercase tracking-tighter flex items-center gap-4 border-none">
                             Start Building
                             <ArrowRight className="w-6 h-6 md:w-12 md:h-12 transition-transform group-hover:translate-x-2" strokeWidth={3} />
                          </Button>
                       </Link>
                    </div>
                 </motion.div>
              </div>
           </div>
        </div>
      </section>

      {/* Premium Newsletter Section */}
      <section className="py-20 md:py-32 container mx-auto px-6">
         <div className="grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center max-w-7xl mx-auto">
            <div className="space-y-6 md:space-y-10">
               <div className="inline-flex items-center gap-3 text-indigo-600 text-[11px] font-black uppercase tracking-[0.4em]">
                  <div className="w-10 h-px bg-indigo-600"></div>
                  Intelligence
               </div>
               <h3 className="text-2xl sm:text-6xl md:text-8xl font-black tracking-tighter uppercase text-foreground leading-[0.9]">
                  Industry <br /><span className="font-serif italic font-normal opacity-30">Insights</span>
               </h3>
               <p className="text-muted-foreground text-base md:text-xl font-medium leading-relaxed max-w-md italic">
                  "Strategic advantage isn't just about the data you have, but the speed at which you act on it."
               </p>
            </div>
            
            <div className="relative">
               <div className="absolute inset-0 bg-accent rounded-[3rem] md:rounded-[4rem] -rotate-3 transition-transform group-hover:rotate-0 duration-700"></div>
               <div className="relative bg-card rounded-[2rem] sm:rounded-[3rem] md:rounded-[4rem] p-5 sm:p-12 md:p-20 shadow-[0_40px_100px_-20px_rgba(0,0,0,0.1)] border border-border">
                  <form className="space-y-4 md:space-y-8" onSubmit={(e) => e.preventDefault()}>
                    <div className="space-y-1 md:space-y-2">
                       <label className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-muted-foreground ml-4">Direct Channel</label>
                       <div className="flex items-center gap-3 md:gap-4 px-4 md:px-8 h-12 md:h-20 bg-accent rounded-xl md:rounded-3xl border border-border focus-within:border-indigo-500 transition-colors">
                          <Globe className="text-indigo-500 w-4 h-4 md:w-6 md:h-6 shrink-0" />
                          <input 
                            type="email" 
                            placeholder="your@strategic-email.com" 
                            className="flex-grow bg-transparent outline-none font-bold text-sm md:text-xl text-foreground placeholder:text-muted-foreground/30 w-full"
                          />
                       </div>
                    </div>
                    <Button className="h-12 md:h-20 w-full bg-primary text-primary-foreground font-black rounded-xl md:rounded-3xl hover:bg-indigo-600 transition-all uppercase text-[10px] md:text-lg tracking-[0.1em] md:tracking-[0.2em] shadow-2xl group/btn flex items-center justify-center gap-2 md:gap-4 border-none">
                       Subscribe to Pulse
                       <ArrowRight className="w-3 h-3 md:w-6 md:h-6 transition-transform group-hover:translate-x-1" />
                    </Button>
                    <p className="text-[8px] md:text-[10px] font-bold text-muted-foreground uppercase tracking-widest text-center">Zero spam policy. Highly curated content.</p>
                  </form>
               </div>
            </div>
         </div>
      </section>

    </div>
  );
}

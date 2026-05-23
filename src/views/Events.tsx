import { useState, useEffect } from 'react';
import { databaseService } from '../services/database';
import { Event } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, Users, ArrowRight, Vote, Search, Filter, SlidersHorizontal, Ticket, Trophy, Zap, Globe, Timer, Shield, MapPin, Tag } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn, slugify } from '../lib/utils';

export default function Events() {
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [typeFilter, setTypeFilter] = useState<'all' | 'voting' | 'ticketing'>('all');
  const [sortBy, setSortBy] = useState<'latest' | 'popular' | 'ending'>('latest');

  useEffect(() => {
    const fetchEvents = async () => {
      try {
        const mappedEvents = await databaseService.getEvents({ status: 'active' });
        setEvents(mappedEvents);
        setFilteredEvents(mappedEvents);
      } catch (error) {
        console.error("Error fetching events:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchEvents();
  }, []);

  useEffect(() => {
    let result = [...events];
    
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

    if (sortBy === 'latest') {
      result.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    } else if (sortBy === 'popular') {
      result.sort((a, b) => (b.totalVotes || 0) - (a.totalVotes || 0));
    } else if (sortBy === 'ending') {
      result.sort((a, b) => new Date(a.endDate || new Date()).getTime() - new Date(b.endDate || new Date()).getTime());
    }
    
    setFilteredEvents(result);
  }, [searchQuery, typeFilter, sortBy, events]);

  const getStatusBadgeColor = (status: string) => {
    switch (status.toLowerCase()) {
      case 'active':
      case 'approved':
        return 'bg-emerald-500/15 text-emerald-500 dark:text-emerald-400 border-emerald-500/35';
      case 'ended':
        return 'bg-rose-500/15 text-rose-500 border-rose-500/35';
      default:
        return 'bg-zinc-500/15 text-zinc-500 border-zinc-500/35';
    }
  };

  return (
    <div className="bg-background min-h-screen text-foreground transition-colors duration-300 pb-20 relative overflow-hidden">
      {/* Decorative Top Background Subtle Ring Elements */}
      <div className="absolute top-0 left-1/4 w-[600px] h-[600px] bg-indigo-500/5 dark:bg-indigo-500/5 rounded-full blur-[160px] pointer-events-none" />
      <div className="absolute top-1/3 right-1/4 w-[500px] h-[500px] bg-purple-500/5 dark:bg-purple-500/5 rounded-full blur-[140px] pointer-events-none" />

      {/* Header Section */}
      <section className="relative pt-36 pb-24 md:pt-48 md:pb-36 overflow-hidden bg-slate-950">
        {/* Dynamic Abstract Grid Lines & Accents */}
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0f172a_1px,transparent_1px),linear-gradient(to_bottom,#0f172a_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none"></div>
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/15 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse pointer-events-none"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/15 rounded-full blur-[100px] -ml-24 -mb-24 pointer-events-none"></div>
        
        <div className="container mx-auto px-4 sm:px-6 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, ease: "easeOut" }}
          >
            <Badge className="bg-indigo-600/90 hover:bg-indigo-600/90 text-white border-none px-4 py-2 rounded-full font-black text-[9px] uppercase tracking-[0.25em] mb-6 shadow-xl shadow-indigo-950/50">
              ⚡ LIVE EVENT PORTAL
            </Badge>
            <h1 className="text-4xl sm:text-6xl md:text-8xl font-black text-white tracking-tight uppercase mb-6 leading-[1.05]">
              Discover <span className="text-indigo-400">Events</span>
            </h1>
            <p className="text-slate-400 text-sm sm:text-base md:text-lg max-w-2xl mx-auto font-medium leading-relaxed opacity-90 max-w-2xl">
              Vote for your favorite nominees in verified pageants and award ceremonies, or secure premium entrance passes to top-tier events. safe, reliable, and instantaneous.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main content viewport */}
      <section className="container mx-auto px-4 sm:px-6 -mt-12 relative z-20">
        
        {/* Sleek Glassmorphic Controls Panel */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="bg-card/90 dark:bg-zinc-950/80 backdrop-blur-md p-5 rounded-[2rem] shadow-[0_30px_70px_-15px_rgba(0,0,0,0.1)] dark:shadow-none border border-border/80 flex flex-col lg:flex-row gap-5 items-stretch lg:items-center mb-16 transition-all"
        >
          {/* Dynamic Search Box */}
          <div className="flex items-center gap-3 bg-accent/40 hover:bg-accent/70 dark:bg-zinc-900/40 dark:hover:bg-zinc-900/60 px-5 py-3 rounded-2xl flex-grow focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all group">
            <Search size={18} className="text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search events, organizers, categories..." 
              className="bg-transparent border-none outline-none text-xs font-black uppercase tracking-wider text-foreground w-full placeholder:text-muted-foreground/40 placeholder:font-normal placeholder:capitalize placeholder:tracking-normal"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-col sm:flex-row flex-wrap items-stretch sm:items-center gap-4">
             {/* Filter Tabs */}
             <div className="flex items-center gap-1 p-1 bg-accent/40 dark:bg-zinc-900/40 rounded-2xl border border-border/40 select-none">
                {(['all', 'voting', 'ticketing'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTypeFilter(filter)}
                    className={cn(
                      "px-5 py-2.5 rounded-xl text-[9px] font-black uppercase tracking-wider transition-all",
                      typeFilter === filter 
                        ? "bg-primary text-primary-foreground shadow-sm" 
                        : "text-muted-foreground hover:text-foreground hover:bg-background/50"
                    )}
                  >
                    {filter}
                  </button>
                ))}
             </div>

             <div className="h-10 w-px bg-border/40 hidden xl:block"></div>

             {/* Sorting Picker */}
             <div className="relative flex-1 sm:flex-initial">
                <select 
                  className="w-full bg-accent/40 dark:bg-zinc-900/40 border border-border/40 rounded-2xl pl-5 pr-10 py-3.5 text-[10px] font-black uppercase tracking-widest text-foreground outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="latest">Sort: Latest First</option>
                  <option value="popular">Sort: Popularity / Votes</option>
                  <option value="ending">Sort: Closing Soon</option>
                </select>
                <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-4 text-muted-foreground">
                  <SlidersHorizontal size={12} strokeWidth={2.5} />
                </div>
             </div>
          </div>
        </motion.div>

        {/* Results Grid - Responsive Grid Framework */}
        {loading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-8">
            {[1, 2, 3, 4, 5, 6, 7, 8].map(i => (
              <div key={i} className="h-[480px] bg-accent/40 dark:bg-zinc-950/40 border border-border/50 animate-pulse rounded-[2rem]"></div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-6">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, index) => {
                const isVoting = event.type === 'voting';
                const isEnded = event.status?.toLowerCase() === 'ended' || (event.endDate && new Date(event.endDate) < new Date());
                const formattedClosing = event.endDate 
                  ? formatDistanceToNow(new Date(event.endDate)).replace('about ', '')
                  : 'N/A';
                
                return (
                  <motion.div
                    key={event.id}
                    layout
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    transition={{ duration: 0.4, delay: index * 0.05 }}
                  >
                    <Card className="group w-[290px] h-[520px] overflow-hidden border border-border bg-card hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col relative text-center shrink-0">
                      <div className="relative h-[280px] overflow-hidden bg-accent shrink-0">
                        {event.coverImage ? (
                          <img 
                            src={event.coverImage} 
                            alt={event.title} 
                            className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-110"
                            referrerPolicy="no-referrer"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center bg-slate-950 text-white/10">
                            {isVoting ? <Vote className="w-16 h-16" /> : <Ticket className="w-16 h-16" />}
                          </div>
                        )}
                        
                        {/* Status Badge */}
                        <div className="absolute top-3 left-3">
                           {isEnded ? (
                             <div className="bg-rose-600 text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                                <span className="w-1.5 h-1.5 rounded-full bg-white"></span>
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
                        <h3 className="text-base font-black text-foreground tracking-tight mb-1 group-hover:text-indigo-600 transition-colors uppercase line-clamp-2 min-h-[2.5rem] flex items-center justify-center leading-tight">
                          {event.title}
                        </h3>
                        
                        <div className="flex items-center gap-2.5 mb-2.5 text-muted-foreground text-[9px] font-black uppercase tracking-widest">
                          <div className="flex items-center gap-1.5">
                            <Calendar size={11} className="text-indigo-500" />
                            <span>{new Date(event.startDate || event.createdAt).toLocaleDateString('en-GB', { day: '2-digit', month: 'short' })}</span>
                          </div>
                          <div className="w-0.5 h-0.5 bg-border rounded-full"></div>
                          <div className="flex items-center gap-1.5 truncate max-w-[120px]">
                            {event.venue || "Ghana"}
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
                              <p className="text-[10px] font-bold text-rose-500 uppercase">{formattedClosing}</p>
                           </div>
                        </div>
                        
                        <Link to={`/event/${slugify(event.title)}`} className="w-full mt-auto">
                          <Button variant="outline" className="w-full h-10 border-2 border-border hover:border-indigo-600 hover:bg-indigo-600 hover:text-white text-foreground font-bold rounded-xl transition-all group/btn flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest bg-transparent">
                            {isVoting ? 'VOTE' : 'TICKETS'} <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                          </Button>
                        </Link>
                      </div>
                    </Card>
                  </motion.div>
                );
              })}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-24 md:py-32 bg-accent/10 dark:bg-zinc-950/20 rounded-[3rem] border-2 border-dashed border-border/40">
            <div className="bg-card w-20 h-20 rounded-[1.5rem] flex items-center justify-center mx-auto mb-6 shadow-md border border-border/50">
              <Globe className="w-8 h-8 text-indigo-500" />
            </div>
            <h3 className="text-2xl md:text-3xl font-black text-foreground mb-2 tracking-tight uppercase">No matching events</h3>
            <p className="text-muted-foreground font-bold text-xs md:text-sm px-4 max-w-md mx-auto italic opacity-70">
              We couldn't locate any live events matching your current filters. Please adjust your query.
            </p>
            <Button 
              variant="outline" 
              onClick={() => { setSearchQuery(''); setTypeFilter('all'); }} 
              className="mt-8 h-12 px-8 rounded-2xl font-black uppercase tracking-[0.18em] border-2 border-border text-foreground text-[10px]"
            >
              Reset Explorer Filters
            </Button>
          </div>
        )}
      </section>

      {/* Trust & Transparency Highlight Section */}
      <section className="py-24 mt-28 bg-slate-950 border-t border-slate-900 text-white relative">
        <div className="absolute bottom-0 right-1/4 w-[350px] h-[350px] bg-indigo-600/5 rounded-full blur-[100px] pointer-events-none" />
        <div className="container mx-auto px-4 sm:px-6">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[
                { icon: <Shield className="text-indigo-400" size={24} strokeWidth={2.5} />, title: "Secure Transactions", desc: "Every ticket and vote payload is audited and protected under maximum payment verification protocols." },
                { icon: <Zap className="text-amber-400" size={24} strokeWidth={2.5} />, title: "Instant Settlements", desc: "Real-time updates ensure voting results reflect immediately. Organizers get high fidelity reports in minutes." },
                { icon: <Trophy className="text-indigo-400" size={24} strokeWidth={2.5} />, title: "Authentic Outcomes", desc: "Integrated smart logic detects double votes and prevents automated scripts, ensuring fairness for everyone." }
              ].map((b, i) => (
                <div key={i} className="bg-slate-900/40 p-8 rounded-[2rem] border border-slate-800/60 hover:border-slate-700/60 transition-colors">
                   <div className="w-12 h-12 rounded-xl bg-slate-900/80 border border-slate-800 flex items-center justify-center mb-6 shadow-inner">{b.icon}</div>
                   <h4 className="text-lg font-black uppercase tracking-wider mb-2 text-white">{b.title}</h4>
                   <p className="text-slate-400 font-medium text-xs leading-relaxed">{b.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
}


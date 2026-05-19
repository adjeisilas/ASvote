import { useState, useEffect } from 'react';
import { databaseService } from '../services/database';
import { Event } from '../types';
import { Button } from '../components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '../components/ui/card';
import { Badge } from '../components/ui/badge';
import { Calendar, Users, ArrowRight, Vote, Search, Filter, SlidersHorizontal, Ticket, Trophy, Zap, Globe, Timer, Shield } from 'lucide-react';
import { Link } from 'react-router-dom';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import { cn } from '../lib/utils';

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

  return (
    <div className="bg-background min-h-screen text-foreground transition-colors duration-300">
      {/* Header Section */}
      <section className="relative pt-32 pb-20 md:pt-44 md:pb-32 overflow-hidden bg-slate-950 dark:bg-[#050505]">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-indigo-600/20 rounded-full blur-[120px] -mr-48 -mt-48 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[400px] h-[400px] bg-blue-900/20 rounded-full blur-[100px] -ml-24 -mb-24"></div>
        
        <div className="container mx-auto px-4 relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
          >
            <Badge className="bg-indigo-500 text-white border-none px-4 py-1.5 rounded-full font-black text-[10px] uppercase tracking-[0.3em] mb-6 shadow-xl shadow-indigo-900/50">
              Live Event Explorer
            </Badge>
            <h1 className="text-4xl md:text-8xl font-black text-white tracking-tighter uppercase mb-6 leading-none">
              Explore <span className="text-indigo-400">Events</span>
            </h1>
            <p className="text-slate-400 text-base md:text-xl max-w-2xl mx-auto font-medium leading-relaxed italic opacity-80">
              Discover verified competitions, award shows, and premium event tickets. Join thousands of participants in the most secure ecosystem.
            </p>
          </motion.div>
        </div>
      </section>

      {/* Main Content */}
      <section className="container mx-auto px-4 -mt-16 relative z-20 pb-32">
        {/* Controls Bar */}
        <div className="bg-card p-4 md:p-6 rounded-[2.5rem] shadow-[0_40px_100px_-20px_rgba(0,0,0,0.12)] border border-border flex flex-col md:flex-row gap-6 items-center mb-16 md:mb-24 transition-colors">
          <div className="flex items-center gap-4 bg-accent px-6 py-4 rounded-2xl w-full md:max-w-md focus-within:ring-2 focus-within:ring-indigo-500/20 transition-all group">
            <Search size={20} className="text-muted-foreground group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Search by name, tags, or status..." 
              className="bg-transparent border-none outline-none text-sm font-bold text-foreground w-full placeholder:text-muted-foreground/50"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>

          <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
             <div className="flex items-center gap-1 p-1 bg-accent rounded-2xl border border-border">
                {(['all', 'voting', 'ticketing'] as const).map((filter) => (
                  <button
                    key={filter}
                    onClick={() => setTypeFilter(filter)}
                    className={cn(
                      "px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all",
                      typeFilter === filter 
                        ? "bg-primary text-primary-foreground shadow-lg" 
                        : "text-muted-foreground hover:text-foreground hover:bg-background"
                    )}
                  >
                    {filter}
                  </button>
                ))}
             </div>

             <div className="h-10 w-px bg-border mx-2 hidden lg:block opacity-50"></div>

             <div className="flex-1 md:flex-none">
                <select 
                  className="w-full bg-accent border border-border rounded-2xl px-6 py-4 text-sm font-bold text-foreground outline-none focus:ring-2 focus:ring-indigo-500/20 cursor-pointer appearance-none"
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                >
                  <option value="latest">Sort: Latest First</option>
                  <option value="popular">Sort: Most Popular</option>
                  <option value="ending">Sort: Ending Soon</option>
                </select>
             </div>
          </div>
        </div>

        {/* Results Grid */}
        {loading ? (
          <div className="flex flex-wrap justify-center gap-6">
            {[1, 2, 3, 4, 5, 6].map(i => (
              <div key={i} className="w-[290px] h-[400px] bg-accent animate-pulse rounded-2xl"></div>
            ))}
          </div>
        ) : filteredEvents.length > 0 ? (
          <div className="flex flex-wrap justify-center gap-6">
            <AnimatePresence mode="popLayout">
              {filteredEvents.map((event, index) => (
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
                          <Vote className="w-16 h-16" />
                        </div>
                      )}
                      
                      {/* LIVE Badge */}
                      <div className="absolute top-3 left-3">
                         <div className="bg-[#4ADE80] text-white px-2.5 py-1 rounded-full flex items-center gap-1.5 shadow-md">
                            <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse"></span>
                            <span className="text-[9px] font-black uppercase tracking-wider">LIVE</span>
                         </div>
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
                            <p className="text-[10px] font-bold text-rose-500 uppercase">{formatDistanceToNow(new Date(event.endDate || new Date())).replace('about ', '')}</p>
                         </div>
                      </div>
                      
                      <Link to={`/event/${event.id}`} className="w-full mt-auto">
                        <Button variant="outline" className="w-full h-10 border-2 border-border hover:border-indigo-600 hover:bg-indigo-600 hover:text-white text-foreground font-bold rounded-xl transition-all group/btn flex items-center justify-center gap-2 uppercase text-[10px] tracking-widest bg-transparent">
                          {event.type === 'voting' ? 'VOTE' : 'TICKETS'} <ArrowRight size={14} className="group-hover/btn:translate-x-1 transition-transform" />
                        </Button>
                      </Link>
                    </div>
                  </Card>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        ) : (
          <div className="text-center py-24 md:py-60 bg-accent rounded-[3rem] md:rounded-[4rem] border-4 border-dashed border-border/50">
            <div className="bg-card w-20 h-20 md:w-24 md:h-24 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center mx-auto mb-6 md:mb-8 shadow-xl">
              <Globe className="w-8 h-8 md:w-10 md:h-10 text-muted-foreground" />
            </div>
            <h3 className="text-2xl md:text-5xl font-black text-foreground mb-3 md:mb-4 tracking-tighter uppercase">No matching events</h3>
            <p className="text-muted-foreground font-bold text-sm md:text-lg px-4 italic opacity-60">We couldn't find any events matching your selection. Try a different filter.</p>
            <Button 
              variant="outline" 
              onClick={() => { setSearchQuery(''); setTypeFilter('all'); }} 
              className="mt-10 h-14 px-10 rounded-2xl font-black uppercase tracking-widest border-border text-foreground"
            >
              Reset Explorer
            </Button>
          </div>
        )}
      </section>

      {/* Benefits Section */}
      <section className="py-32 bg-accent/30">
        <div className="container mx-auto px-4">
           <div className="grid grid-cols-1 md:grid-cols-3 gap-8 md:gap-12">
              {[
                { icon: <Shield className="text-indigo-600" />, title: "Secure Protocol", desc: "Every transaction is logged on our immutable ledger for total auditability." },
                { icon: <Zap className="text-amber-500" />, title: "Instant Access", desc: "Get voting power or tickets immediately upon successful payment confirmation." },
                { icon: <Trophy className="text-amber-600" />, title: "Fair Competition", desc: "Advanced anti-fraud mechanisms ensure every vote is authentic and weighted correctly." }
              ].map((b, i) => (
                <div key={i} className="bg-card p-10 md:p-12 rounded-[3rem] shadow-sm border border-border hover:shadow-xl transition-all duration-300">
                   <div className="w-16 h-16 rounded-[1.5rem] bg-accent flex items-center justify-center mb-8">{b.icon}</div>
                   <h4 className="text-2xl font-black text-foreground uppercase tracking-tight mb-4">{b.title}</h4>
                   <p className="text-muted-foreground font-medium leading-relaxed leading-relaxed">{b.desc}</p>
                </div>
              ))}
           </div>
        </div>
      </section>
    </div>
  );
}

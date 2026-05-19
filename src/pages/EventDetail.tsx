import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../lib/supabase';
import { databaseService } from '../services/database';
import { Event, Category, Nominee } from '../types';
import { Button } from '../components/ui/button';
import { Badge } from '../components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '../components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../components/ui/tabs';
import { Vote, Timer, Calendar, Info, MessageCircle, Trophy, CheckCircle2, ArrowLeft, Users, Search, Shield, Zap, MapPin, Clock, Phone, Mail, FileText, ArrowRight, XCircle, Ticket } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { motion, AnimatePresence } from 'motion/react';
import PaymentModal from '../components/event/PaymentModal';
import { cn, formatSafeDistanceToNow } from '../lib/utils';

export default function EventDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [event, setEvent] = useState<Event | null>(null);
  const [categories, setCategories] = useState<Category[]>([]);
  const [nominees, setNominees] = useState<Nominee[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedNominee, setSelectedNominee] = useState<Nominee | null>(null);
  const [selectedCategoryId, setSelectedCategoryId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<string | undefined>(undefined);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const fetchData = async () => {
    if (!id) return;
    try {
      const eventData = await databaseService.getEventById(id);
      if (eventData) {
        setEvent(eventData as Event);
      } else {
        navigate('/');
        return;
      }

      const catsData = await databaseService.getCategories(id, eventData.type as any);
      setCategories(catsData);

      if (eventData.type === 'voting') {
        const nomsData = await databaseService.getNominees(id);
        setNominees(nomsData);
      } else {
        setNominees([]);
      }
    } catch (error) {
      console.error("Error fetching event data:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    setActiveTab(undefined);
  }, [selectedCategoryId]);

  useEffect(() => {
    fetchData();
    setActiveTab(undefined);

    if (!id) return;

    const eventSub = supabase.channel(`event-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'events' }, (payload) => {
        if ((payload.new as any)?.id === id) fetchData();
      })
      .subscribe();

    const nomsSub = supabase.channel(`noms-${id}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'nominees' }, (payload) => {
        const row = (payload.new || payload.old) as any;
        if (row?.event_id === id) fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(eventSub);
      supabase.removeChannel(nomsSub);
    };
  }, [id, navigate]);

  const handleVoteClick = (nominee: Nominee) => {
    setSelectedNominee(nominee);
    setIsPaymentModalOpen(true);
  };

  const handleOptimisticVote = (voteCount: number, nomineeId: string) => {
    // Update local event total
    setEvent(prev => {
      if (!prev) return prev;
      return {
        ...prev,
        totalVotes: (prev.totalVotes || 0) + voteCount
      };
    });

    // Update local nominee count
    setNominees(prev => prev.map(n => {
      if (n.id === nomineeId) {
        return {
          ...n,
          voteCount: (n.voteCount || 0) + voteCount
        };
      }
      return n;
    }));
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-muted rounded-full"></div>
          <div className="absolute inset-0 w-16 h-16 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
        </div>
      </div>
    );
  }

  if (!event) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-accent/50 px-4 text-center">
        <div className="w-24 h-24 bg-card rounded-3xl flex items-center justify-center shadow-2xl mb-8">
           <XCircle className="w-12 h-12 text-rose-500" />
        </div>
        <h2 className="text-3xl font-black text-foreground mb-4 tracking-tight">Event Not Found</h2>
        <p className="text-muted-foreground max-w-md mb-10 font-medium italic">We couldn't locate the event you're looking for. It may have been removed or the link is invalid.</p>
        <Button onClick={() => navigate('/')} className="bg-primary h-14 px-10 rounded-2xl font-black uppercase tracking-widest text-[10px] border-none text-primary-foreground transition-all duration-300">
          Return to Explorer
        </Button>
      </div>
    );
  }

  const hasNominees = nominees.length > 0;
  const hasCategories = categories.length > 0;
  const isEnded = event.endDate ? new Date(event.endDate) < new Date() : false;

  return (
    <div className="bg-background text-foreground min-h-screen pb-32 transition-colors duration-300">
      {/* Premium Event Header */}
      <div className="relative overflow-hidden bg-slate-950 dark:bg-[#050505] pt-20 md:pt-28 pb-32">
        {/* Abstract Background Blobs */}
        <div className="absolute top-0 right-0 w-[400px] md:w-[600px] h-[400px] md:h-[600px] bg-indigo-600/20 rounded-full blur-[80px] md:blur-[120px] -mr-32 md:-mr-48 -mt-32 md:-mt-48 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-[300px] md:w-[400px] h-[300px] md:h-[400px] bg-indigo-900/20 rounded-full blur-[60px] md:blur-[100px] -ml-20 md:-ml-24 -mb-20 md:-mb-24"></div>
        
        <div className="container mx-auto px-4 relative z-10">
          <button 
            onClick={() => navigate(-1)}
            className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.2em] text-indigo-400 hover:text-white transition-colors mb-8 md:mb-12"
          >
            <ArrowLeft size={14} strokeWidth={3} /> <span className="hidden sm:inline">Return to Explorer</span><span className="sm:hidden">Back</span>
          </button>

          <div className="flex flex-col lg:flex-row gap-8 md:gap-16 items-center">
            <div className="w-full max-w-[240px] md:max-w-[320px] aspect-[4/5] relative group">
               <div className="absolute inset-0 bg-indigo-600 rounded-[2rem] md:rounded-[2.5rem] rotate-3 scale-105 opacity-20 blur-xl group-hover:rotate-6 transition-transform"></div>
               <div className="relative h-full rounded-[1.8rem] md:rounded-[2.2rem] overflow-hidden border-[4px] border-slate-900 shadow-2xl">
                 {event.coverImage ? (
                   <img src={event.coverImage} alt={event.title} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                 ) : (
                   <div className="w-full h-full bg-slate-900 flex items-center justify-center">
                     <Vote className="w-20 h-20 md:w-32 md:h-32 text-slate-800" />
                   </div>
                 )}
               </div>
            </div>

            <div className="flex-1 text-center lg:text-left">
               <div className="flex flex-wrap justify-center lg:justify-start gap-2 md:gap-3 mb-6 md:mb-8">
                   <Badge className="px-3 md:px-4 py-1.5 bg-indigo-600 text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full border-none shadow-lg shadow-indigo-900/50">
                    {event.type === 'ticketing' ? 'Ticketing' : 'Voting'} Event
                  </Badge>
                  <Badge className="px-3 md:px-4 py-1.5 bg-white/5 text-white text-[9px] md:text-[10px] font-black uppercase tracking-widest rounded-full border border-white/10 backdrop-blur-md">
                    Status: {event.status}
                  </Badge>
               </div>
               
               <h1 className="text-4xl md:text-5xl lg:text-7xl font-black text-white tracking-tighter leading-[0.9] mb-6 md:mb-8 uppercase max-w-4xl">
                 {selectedCategoryId ? (
                   <div className="flex flex-col gap-4">
                     <span>{categories.find(c => c.id === selectedCategoryId)?.name}</span>
                     <div className="flex items-center gap-4 text-indigo-400">
                        <span className="text-2xl md:text-4xl font-black tracking-widest">{categories.find(c => c.id === selectedCategoryId)?.votePrice || categories.find(c => c.id === selectedCategoryId)?.price || event.votePrice || 0} GHS</span>
                        <span className="text-xs md:text-sm font-black uppercase tracking-[0.3em] bg-white/10 px-4 py-2 rounded-xl backdrop-blur-md">Unit Price</span>
                     </div>
                   </div>
                 ) : event.title}
               </h1>

               <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 md:gap-6 mb-8 md:mb-10 max-w-3xl">
                  <div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl backdrop-blur-xl">
                     <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 md:mb-2 block">Global Ranking</span>
                     <div className="flex items-center gap-2 md:gap-3 text-white">
                        <Trophy className="w-4 h-4 md:w-5 md:h-5 text-amber-500" />
                        <span className="text-lg md:text-xl font-black tracking-tight">Verified Event</span>
                     </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl backdrop-blur-xl">
                     <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 md:mb-2 block">
                       {event.type === 'ticketing' ? 'Total Sales' : 'Engagement'}
                     </span>
                     <div className="flex items-center gap-2 md:gap-3 text-white">
                        <Users className="w-4 h-4 md:w-5 md:h-5 text-indigo-400" />
                        <span className="text-lg md:text-xl font-black tracking-tight">
                          {event.totalVotes?.toLocaleString() || 0} {event.type === 'ticketing' ? 'Tickets' : 'Votes'}
                        </span>
                     </div>
                  </div>
                  <div className="bg-white/5 border border-white/10 p-4 md:p-6 rounded-2xl md:rounded-3xl backdrop-blur-xl">
                     <span className="text-[9px] md:text-[10px] font-black uppercase tracking-widest text-slate-500 mb-1 md:mb-2 block">Countdown</span>
                     <div className="flex items-center gap-2 md:gap-3 text-white font-black tracking-tight">
                        <Timer className="w-4 h-4 md:w-5 md:h-5 text-rose-400" />
                        <span className={`text-lg md:text-xl uppercase truncate ${isEnded ? 'text-rose-500' : ''}`}>
                          {isEnded ? 'Polls Ended' : formatSafeDistanceToNow(event.endDate).replace('in ', '')}
                        </span>
                     </div>
                  </div>
               </div>

               <p className="text-slate-400 text-base md:text-lg font-medium max-w-2xl leading-relaxed italic opacity-80 px-4 md:px-0">
                 "{event.description}"
               </p>
            </div>
          </div>
        </div>
      </div>

      {/* Modern Interaction Section */}
      <div className="container mx-auto px-4 -mt-24 relative z-20">
        {!selectedCategoryId ? (
          /* Categories Grid View - Global */
          hasCategories ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 max-w-7xl mx-auto">
              {categories.map((category, i) => {
                const categoryNominees = nominees.filter(n => n.categoryId === category.id || (n as any).category_id === category.id);
                // Even if no nominees, show the category card if it's a voting event? 
                // Or maybe the user wants to see all categories.
                
                return (
                  <motion.div
                    key={category.id}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: i * 0.1 }}
                    className="group cursor-pointer"
                    onClick={() => setSelectedCategoryId(category.id)}
                  >
                    <Card className="h-full border-none shadow-[0_20px_50px_-15px_rgba(0,0,0,0.06)] dark:shadow-none rounded-[2rem] overflow-hidden group-hover:shadow-[0_40px_80px_-20px_rgba(0,0,0,0.12)] transition-all duration-500 group-hover:-translate-y-2 flex flex-col bg-card border-border">
                      <CardHeader className="p-8 md:p-10 bg-slate-900 dark:bg-[#080808] text-white relative overflow-hidden shrink-0">
                         <div className="absolute top-0 right-0 w-32 h-32 bg-indigo-500/20 rounded-full blur-[40px] -mr-16 -mt-16 group-hover:bg-indigo-400/40 transition-all duration-700"></div>
                         <div className="relative z-10">
                           <Badge className="bg-indigo-500 text-white border-none py-1 px-3 rounded-full text-[8px] font-black uppercase tracking-widest leading-none mb-4">
                             {event.type === 'ticketing' ? 'TICKET TIER' : 'VOTING CATEGORY'}
                           </Badge>
                           <CardTitle className="text-2xl md:text-3xl font-black tracking-tight mb-2 group-hover:text-indigo-300 transition-colors uppercase">{category.name}</CardTitle>
                           <div className="flex items-center gap-2 text-indigo-400 text-[10px] font-black tracking-widest uppercase">
                             {event.type === 'ticketing' ? <Ticket size={12} /> : <Users size={12} />}
                             {event.type === 'ticketing' ? 'Available Now' : `${categoryNominees.length} Nominees`}
                           </div>
                         </div>
                      </CardHeader>
                      <CardContent className="p-8 md:p-10 flex flex-col flex-grow bg-card">
                         <div className="flex flex-col gap-4 mb-auto">
                            <div className="flex flex-col border-b border-border pb-6">
                               <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mb-1">
                                 {event.type === 'ticketing' ? 'Entry Fee' : 'Voting Cost'}
                               </span>
                               <span className="text-3xl font-black text-foreground tracking-tighter">{category.votePrice || category.price || event.votePrice || 0} <span className="text-base text-muted-foreground font-bold ml-1">GHS</span></span>
                            </div>
                         </div>

                         <div className="mt-8">
                           <Button 
                              variant="outline"
                              className="w-full h-12 md:h-14 rounded-xl md:rounded-2xl border-border font-black uppercase tracking-[0.2em] text-[10px] hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all gap-3"
                              disabled={isEnded}
                           >
                              {isEnded ? 'VOTING ENDED' : (event.type === 'ticketing' ? 'BUY TICKET' : 'EXPLORE CATEGORY')}
                              <ArrowRight className="w-4 h-4" />
                           </Button>
                         </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            <div className="text-center py-24 bg-accent rounded-[3rem] border border-dashed border-border transition-colors duration-300">
              <div className="bg-card w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-xl shadow-black/5">
                <Trophy className="w-10 h-10 text-muted-foreground" />
              </div>
              <h3 className="text-2xl font-black text-foreground mb-2">No Categories</h3>
              <p className="text-muted-foreground font-medium px-4">This event doesn't have any voting categories yet.</p>
            </div>
          )
        ) : (
          /* Category Specific View with Tabs */
          <div className="space-y-12 md:space-y-16">
            <div className="flex flex-col items-center gap-8 md:gap-12">
              <div className="flex flex-col md:flex-row items-center gap-6 w-full max-w-7xl">
                <Button 
                  variant="ghost" 
                  onClick={() => setSelectedCategoryId(null)}
                  className="w-fit flex items-center gap-3 text-white/40 hover:text-white font-black uppercase tracking-widest text-[10px] bg-white/5 hover:bg-white/10 backdrop-blur-md px-6 py-4 rounded-2xl border border-white/5 transition-all"
                >
                  <ArrowLeft size={16} strokeWidth={3} />
                  Back to Categories
                </Button>
                
                <div className="h-px flex-1 bg-white/10 hidden md:block"></div>
              </div>

               <div className="w-full max-w-7xl mx-auto">
                <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
                  <div className="flex justify-center mb-12">
                    <TabsList className="bg-white/5 border border-white/10 p-1.5 rounded-2xl h-14 md:h-16 backdrop-blur-xl">
                      <TabsTrigger 
                        value="ranking" 
                        className="rounded-xl px-8 h-full font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xl transition-all"
                      >
                        Live Standings
                      </TabsTrigger>
                      <TabsTrigger 
                        value="info" 
                        className="rounded-xl px-8 h-full font-black uppercase tracking-widest text-[10px] data-[state=active]:bg-white data-[state=active]:text-slate-950 data-[state=active]:shadow-xl transition-all"
                      >
                        Category Info
                      </TabsTrigger>
                    </TabsList>
                  </div>

                  {activeTab && (
                    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <TabsContent value="info" className="mt-0 focus-visible:outline-none">
                        <div className="max-w-4xl mx-auto px-4">
                          {/* Information Section */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
                            <div className="space-y-12">
                              <section>
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
                                    {event.type === 'voting' ? <Vote size={20} strokeWidth={2.5} /> : <Ticket size={20} strokeWidth={2.5} />}
                                  </div>
                                  <h3 className="text-xl font-black text-foreground uppercase tracking-tight">
                                    {event.type === 'voting' ? 'Voting Protocol' : 'Ticket Info'}
                                  </h3>
                                </div>
                                <div className="bg-accent p-6 rounded-3xl border border-border">
                                  {event.type === 'voting' ? (
                                    <>
                                      <p className="text-foreground font-bold text-lg mb-2">Authenticated Online Voting</p>
                                      <p className="text-muted-foreground text-sm leading-relaxed">
                                        This is a secure, real-time voting competition. Votes are processed via Paystack and recorded on our immutable audit trail. Each vote for <b>{categories.find(c => c.id === selectedCategoryId)?.name}</b> costs <b>{categories.find(c => c.id === selectedCategoryId)?.votePrice || event.votePrice || 0} GHS</b>.
                                      </p>
                                    </>
                                  ) : (
                                    <>
                                      <p className="text-foreground font-bold text-lg mb-2">{categories.find(c => c.id === selectedCategoryId)?.name} Admission</p>
                                      <p className="text-muted-foreground text-sm leading-relaxed">
                                        Access to the event under the specified tier. Tickets are sent via email upon successful payment. Price: <b>{categories.find(c => c.id === selectedCategoryId)?.price || event.votePrice || 0} GHS</b>.
                                      </p>
                                    </>
                                  )}
                                </div>
                              </section>

                              <section>
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-10 h-10 rounded-xl bg-rose-50 flex items-center justify-center text-rose-600">
                                    <Clock size={20} strokeWidth={2.5} />
                                  </div>
                                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">
                                    Timeline
                                  </h3>
                                </div>
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                   {[
                                    {label: 'Voting Opens', time: formatSafeDistanceToNow(event.startDate), icon: <Zap className="w-3 h-3" />},
                                    {label: 'Polls Closing', time: formatSafeDistanceToNow(event.endDate), icon: <Timer className="w-3 h-3" />},
                                  ].map((item, i) => (
                                    <div key={i} className="bg-card p-5 rounded-2xl border border-border shadow-sm flex flex-col gap-1 items-center text-center">
                                      <span className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">{item.label}</span>
                                      <span className="text-lg font-black text-foreground truncate w-full">{item.time}</span>
                                    </div>
                                  ))}
                                </div>
                              </section>
                            </div>

                            <div className="space-y-12">
                              <section>
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-10 h-10 rounded-xl bg-blue-50 flex items-center justify-center text-blue-600">
                                    <Users size={20} strokeWidth={2.5} />
                                  </div>
                                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Organizer</h3>
                                </div>
                                <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm space-y-4">
                                  {event.organizerEmail && (
                                    <div className="flex items-center gap-4 group">
                                      <div className="w-10 h-10 rounded-lg bg-slate-50 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                        <Mail size={18} />
                                      </div>
                                      <div className="min-w-0">
                                        <p className="text-[10px] font-black uppercase text-slate-400 tracking-widest">Email Support</p>
                                        <p className="text-slate-900 font-bold truncate">{event.organizerEmail}</p>
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </section>
                              
                              <section>
                                <div className="flex items-center gap-3 mb-6">
                                  <div className="w-10 h-10 rounded-xl bg-orange-50 flex items-center justify-center text-orange-600">
                                    <FileText size={20} strokeWidth={2.5} />
                                  </div>
                                  <h3 className="text-xl font-black text-slate-900 uppercase tracking-tight">Policy</h3>
                                </div>
                                <div className="bg-orange-50/30 p-6 rounded-3xl border border-orange-100">
                                  <p className="text-slate-700 font-medium leading-relaxed">
                                    {event.refundPolicy || "Votes cast are final and non-refundable. Please ensure you are voting for the correct nominee before proceeding."}
                                  </p>
                                </div>
                              </section>
                            </div>
                          </div>
                        </div>
                      </TabsContent>

                      <TabsContent value="ranking" className="mt-0 focus-visible:outline-none">
                        <div className="max-w-4xl mx-auto">
                          <div className="mb-12 text-center px-4">
                            <span className="text-[10px] md:text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-2 block text-center">Category Standings</span>
                            <h2 className="text-4xl md:text-6xl font-black text-foreground tracking-tighter uppercase">
                              Live Ranking
                            </h2>
                            <div className="h-1 w-20 bg-indigo-600 mx-auto mt-4 rounded-full"></div>
                          </div>
                          
                          <div className="grid grid-cols-1 gap-4 md:gap-6 px-2 md:px-0">
                            {nominees
                              .filter(n => n.categoryId === selectedCategoryId || (n as any).category_id === selectedCategoryId)
                              .sort((a, b) => (b.voteCount || 0) - (a.voteCount || 0))
                              .slice(0, 50)
                              .map((nominee, i) => (
                              <motion.div 
                                key={nominee.id}
                                initial={{ opacity: 0, x: -20 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: i * 0.05 }}
                                className="group relative"
                              >
                                <div className="bg-card hover:bg-accent rounded-3xl md:rounded-[2.5rem] border border-border p-4 md:p-6 flex items-center gap-4 md:gap-8 shadow-[0_10px_30px_-20px_rgba(0,0,0,0.05)] transition-all">
                                     <div className={`w-10 h-10 md:w-16 md:h-16 rounded-xl md:rounded-[1.5rem] flex items-center justify-center font-black text-lg md:text-2xl tracking-tighter shrink-0 ${
                                        i === 0 ? 'bg-amber-100 text-amber-600 shadow-lg shadow-amber-100/20 rotate-3' : 
                                        i === 1 ? 'bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300' : 
                                        i === 2 ? 'bg-orange-50 dark:bg-orange-950/20 text-orange-600' : 'bg-accent text-muted-foreground'
                                      }`}>
                                        #{i + 1}
                                     </div>
                                     
                                     <div className="w-12 h-12 md:w-20 md:h-20 rounded-xl md:rounded-[1.5rem] overflow-hidden border-2 md:border-4 border-card shadow-lg md:shadow-xl bg-accent shrink-0">
                                        {nominee.imageUrl ? (
                                          <img src={nominee.imageUrl} alt={nominee.name} className="w-full h-full object-cover" />
                                        ) : (
                                          <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                                             <UserIcon className="w-6 h-6 md:w-8 md:h-8" />
                                          </div>
                                        )}
                                     </div>

                                     <div className="flex-grow min-w-0">
                                        <h4 className="text-base md:text-2xl font-black text-foreground tracking-tight group-hover:text-indigo-600 transition-colors truncate">
                                          {nominee.name}
                                        </h4>
                                        <p className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground mt-0.5 md:mt-1 truncate">ID: {nominee.code}</p>
                                     </div>

                                     <div className="flex flex-col items-end gap-0.5 md:gap-1 shrink-0">
                                        <span className="text-xl md:text-4xl font-black text-foreground tracking-tighter leading-none">{nominee.voteCount.toLocaleString()}</span>
                                        <span className="text-[8px] md:text-[10px] font-black uppercase tracking-widest text-indigo-500 hidden xs:block">
                                           {event.type === 'ticketing' ? 'Tickets' : 'Votes'}
                                         </span>
                                     </div>
                                </div>
                              </motion.div>
                            ))}
                          </div>
                        </div>
                      </TabsContent>
                    </div>
                  )}
                </Tabs>
              </div>

            {/* Nominee/Ticket selection grid - Repositioned beneath tab contents */}
            <div className="mt-8 border-t border-white/5 pt-12">
              <div className="text-center mb-12 px-4">
                 <span className="text-[11px] font-black uppercase tracking-[0.4em] text-indigo-500 mb-2 block">Available Selections</span>
                 <h2 className="text-3xl md:text-5xl font-black text-foreground tracking-tighter uppercase mb-2">
                   Select {event.type === 'ticketing' ? 'a Ticket Tier' : 'a Nominee'}
                 </h2>
                 <div className="h-1.5 w-24 bg-indigo-600 mx-auto rounded-full mt-4"></div>
              </div>

              {categories.filter(c => c.id === selectedCategoryId).map((category) => {
                const filteredNominees = nominees.filter(n => n.categoryId === category.id || (n as any).category_id === category.id);
                
                if (filteredNominees.length === 0 && event.type === 'ticketing') {
                  return (
                    <div key={category.id} className="flex justify-center py-6 px-4">
                      <motion.div
                        initial={{ opacity: 0, scale: 0.95 }}
                        animate={{ opacity: 1, scale: 1 }}
                        className="w-full max-w-sm"
                      >
                        <Card className="border-none shadow-[0_45px_100px_-25px_rgba(0,0,0,0.15)] dark:shadow-none rounded-[3rem] overflow-hidden bg-card items-center text-center p-10 flex flex-col border border-border group hover:shadow-[0_55px_120px_-30px_rgba(0,0,0,0.2)] transition-all duration-500">
                          <div className="w-24 h-24 bg-indigo-500/10 text-indigo-500 rounded-3xl flex items-center justify-center mb-8 shadow-inner group-hover:scale-110 transition-transform duration-500">
                            <Ticket size={48} strokeWidth={1.5} />
                          </div>
                          <h3 className="text-3xl font-black text-foreground mb-2 uppercase tracking-tight">{category.name}</h3>
                          <p className="text-muted-foreground font-bold mb-8 leading-relaxed text-sm">
                            {category.description || `Secure your spot for the ${event.title}.`}
                          </p>
                          <div className="w-full h-px bg-border mb-8"></div>
                          <div className="flex flex-col items-center mb-10 w-full">
                            <span className="text-[10px] font-black uppercase tracking-widest text-muted-foreground block mb-2">Registration Fee</span>
                            <span className="text-5xl font-black text-foreground tracking-tighter">{category.price || event.votePrice || 0} <span className="text-sm uppercase text-muted-foreground font-bold tracking-widest ml-1">GHS</span></span>
                          </div>
                          <Button 
                            className="w-full h-16 bg-primary hover:bg-indigo-600 text-primary-foreground rounded-2xl font-black uppercase tracking-[0.2em] text-[10px] shadow-2xl transition-all hover:scale-[1.02] border-none"
                            disabled={isEnded}
                            onClick={() => {
                              if (isEnded) return;
                              const mockNominee = {
                                id: category.id,
                                name: category.name,
                                code: category.id.slice(0, 4),
                                categoryId: category.id,
                                eventId: event.id,
                                voteCount: category.soldCount || 0
                              } as any;
                              handleVoteClick(mockNominee);
                            }}
                          >
                            {isEnded ? 'REGISTRATION CLOSED' : 'REGISTER & BUY NOW'}
                          </Button>
                        </Card>
                      </motion.div>
                    </div>
                  );
                }

                return (
                  <div key={category.id} className="mb-16">
                    <div className="flex flex-wrap justify-center gap-6">
                      {filteredNominees.map((nominee, i) => (
                        <motion.div
                          key={nominee.id}
                          initial={{ opacity: 0, y: 30 }}
                          whileInView={{ opacity: 1, y: 0 }}
                          viewport={{ once: true }}
                          transition={{ delay: i * 0.1, duration: 0.5 }}
                          className="shrink-0"
                        >
                          <Card className="group w-[290px] h-[520px] overflow-hidden border border-border bg-card hover:border-indigo-500/50 hover:shadow-xl transition-all duration-300 rounded-2xl flex flex-col relative text-center shrink-0">
                            <div className="relative h-[280px] overflow-hidden bg-accent shrink-0">
                              {nominee.imageUrl ? (
                                <img src={nominee.imageUrl} alt={nominee.name} className="w-full h-full object-cover transition-transform duration-1000 group-hover:scale-105" referrerPolicy="no-referrer" />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-muted-foreground/30">
                                  <Users className="w-16 h-16" strokeWidth={1} />
                                </div>
                              )}
                              
                              <div className="absolute top-3 right-3">
                                <Badge className="bg-primary/90 backdrop-blur-xl text-primary-foreground border-none py-1 px-2.5 rounded-lg text-[9px] font-black uppercase tracking-widest leading-none shadow-2xl">
                                  {nominee.code}
                                </Badge>
                              </div>
                            </div>

                            <div className="p-5 flex-grow flex flex-col items-center">
                              <h3 className="text-base font-black text-foreground tracking-tight mb-2 group-hover:text-indigo-500 transition-colors uppercase line-clamp-2 min-h-[3rem] flex items-center justify-center leading-tight">
                                {nominee.name}
                              </h3>

                              <div className="flex flex-col items-center mb-4">
                                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-muted-foreground">
                                  {event.type === 'ticketing' ? 'Price' : 'Votes'}
                                </span>
                                <span className="text-2xl font-black text-foreground tracking-tighter">
                                  {event.type === 'ticketing' 
                                    ? `${(category.price || event.votePrice || 0)}`
                                    : nominee.voteCount.toLocaleString()
                                  }
                                  {event.type === 'ticketing' && <span className="text-[10px] uppercase text-muted-foreground font-bold tracking-widest ml-1">GHS</span>}
                                </span>
                              </div>

                              <div className="w-full mt-auto">
                                <Button 
                                  className="w-full h-11 bg-primary hover:bg-indigo-600 text-primary-foreground rounded-xl gap-2 transition-all shadow-xl shadow-indigo-500/10 border-none font-black text-[10px] tracking-[0.2em] uppercase group/btn"
                                  disabled={isEnded}
                                  onClick={() => !isEnded && handleVoteClick(nominee)}
                                >
                                  {isEnded ? 'ENDED' : (event.type === 'ticketing' ? 'BUY TICKET' : 'VOTE NOW')}
                                  <ArrowRight className="w-4 h-4 transition-transform group-hover/btn:translate-x-1" strokeWidth={3} />
                                </Button>
                              </div>
                            </div>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>

      {isPaymentModalOpen && (
        <PaymentModal 
          isOpen={isPaymentModalOpen}
          onClose={() => setIsPaymentModalOpen(false)}
          onVoteSuccess={fetchData}
          onOptimisticVote={handleOptimisticVote}
          nominee={selectedNominee}
          event={event}
          categories={categories}
        />
      )}
    </div>
  );
}

// Simple User icon helper
function UserIcon({ className }: { className?: string }) {
  return (
    <svg 
      className={className}
      viewBox="0 0 24 24" 
      fill="none" 
      stroke="currentColor" 
      strokeWidth="2" 
      strokeLinecap="round" 
      strokeLinejoin="round"
    >
      <path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2" />
      <circle cx="12" cy="7" r="4" />
    </svg>
  );
}

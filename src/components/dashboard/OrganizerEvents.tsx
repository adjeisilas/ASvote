import { useState, useEffect } from 'react';
import { supabase } from '../../lib/supabase';
import { databaseService } from '../../services/database';
import { useAuth } from '../../contexts/AuthContext';
import { Event } from '../../types';
import { Card, CardContent } from '../ui/card';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import { format } from 'date-fns';
import { 
  Edit, 
  Eye, 
  Search, 
  Timer, 
  Trash2, 
  Plus,
  CheckCircle2, 
  Clock, 
  AlertCircle, 
  Users, 
  BarChart3,
  CalendarDays,
  LayoutGrid,
  Ticket,
  Tag
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'sonner';
import { ConfirmationDialog } from '../ui/confirmation-dialog';

export default function OrganizerEvents() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [events, setEvents] = useState<Event[]>([]);
  const [filteredEvents, setFilteredEvents] = useState<Event[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [eventToDelete, setEventToDelete] = useState<{ id: string, title: string } | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const fetchEvents = async () => {
    if (!user) return;
    try {
      const data = await databaseService.getEvents({ organizerId: user.uid });
      setEvents(data || []);
      setFilteredEvents(data || []);
    } catch (error) {
      console.error("Error fetching events:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEvents();

    if (!user) return;

    const channel = supabase.channel(`events-mgt-${user.uid}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'events',
        filter: `organizer_id=eq.${user.uid}`
      }, () => fetchEvents())
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [user]);

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredEvents(events);
    } else {
      const queryValue = searchQuery.toLowerCase();
      setFilteredEvents(events.filter(e => 
        e.title.toLowerCase().includes(queryValue) || 
        (e.description && e.description.toLowerCase().includes(queryValue))
      ));
    }
  }, [searchQuery, events]);

  const handleDeleteClick = (eventId: string, title: string) => {
    setEventToDelete({ id: eventId, title });
    setDeleteDialogOpen(true);
  };

  const confirmDeleteEvent = async () => {
    if (!eventToDelete) return;

    setIsDeleting(true);
    try {
      await databaseService.deleteEvent(eventToDelete.id);
      toast.success("Event deleted successfully.");
      setEventToDelete(null);
      setDeleteDialogOpen(false);
      fetchEvents();
    } catch (error: any) {
      toast.error(error.message || "Failed to delete event.");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatEventDate = (dateString: string | undefined | null, formatStr: string) => {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return format(date, formatStr);
    } catch (e) {
      return 'N/A';
    }
  };

  const getStatusConfig = (status: string) => {
    switch (status) {
      case 'active': return { 
        color: 'bg-green-50 text-green-700 border-green-200', 
        icon: <CheckCircle2 size={12} className="mr-1" />,
        label: 'Live'
      };
      case 'pending': return { 
        color: 'bg-amber-50 text-amber-700 border-amber-200', 
        icon: <Clock size={12} className="mr-1" />,
        label: 'Pending Approval'
      };
      case 'approved': return { 
        color: 'bg-blue-50 text-blue-700 border-blue-200', 
        icon: <CheckCircle2 size={12} className="mr-1" />,
        label: 'Approved'
      };
      case 'rejected': return { 
        color: 'bg-red-50 text-red-700 border-red-200', 
        icon: <AlertCircle size={12} className="mr-1" />,
        label: 'Rejected'
      };
      case 'ended': return { 
        color: 'bg-slate-50 text-slate-700 border-slate-200', 
        icon: <Timer size={12} className="mr-1" />,
        label: 'Finished'
      };
      default: return { 
        color: 'bg-slate-50 text-slate-700 border-slate-200', 
        icon: <Timer size={12} className="mr-1" />,
        label: status
      };
    }
  };

  if (loading) return (
    <div className="py-20 flex flex-col items-center justify-center text-slate-400">
      <LayoutGrid size={40} className="animate-pulse mb-4 opacity-20" />
      <p className="text-sm font-medium">Fetching your events...</p>
    </div>
  );

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-sm overflow-hidden bg-white">
        <div className="p-6 border-b border-slate-50 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="flex flex-col md:flex-row md:items-center gap-4 w-full justify-between">
            <div>
              <h3 className="text-lg font-bold text-slate-900">Events Management</h3>
              <div className="flex flex-wrap gap-x-4 gap-y-1 mt-0.5">
                <p className="text-xs text-slate-500">Total: {events.length}</p>
                <p className="text-xs text-amber-600 font-medium">Pending: {events.filter(e => e.status === 'pending').length}</p>
                <p className="text-xs text-green-600 font-medium">Approved: {events.filter(e => ['approved', 'active'].includes(e.status)).length}</p>
              </div>
            </div>
            <Button 
              className="bg-indigo-600 hover:bg-indigo-700 h-10 px-6 gap-2 shadow-lg shadow-indigo-100 font-bold transition-all hover:scale-105 active:scale-95"
              onClick={() => navigate('/organizer/new-event')}
            >
              <Plus size={18} /> Create New Event
            </Button>
          </div>
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <input 
              type="text" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Filter by title..." 
              className="pl-10 pr-4 py-2.5 w-full bg-slate-50 border border-slate-100 rounded-xl text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition-all outline-none"
            />
          </div>
        </div>
        
        <CardContent className="p-0">
          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader className="bg-slate-50/50">
                <TableRow className="hover:bg-transparent border-slate-100">
                  <TableHead className="font-bold text-slate-600 pl-6 h-12 text-[11px] uppercase tracking-wider">Event Details</TableHead>
                  <TableHead className="font-bold text-slate-600 h-12 text-[11px] uppercase tracking-wider">Type</TableHead>
                  <TableHead className="font-bold text-slate-600 h-12 text-[11px] uppercase tracking-wider">Analytics</TableHead>
                  <TableHead className="font-bold text-slate-600 h-12 text-[11px] uppercase tracking-wider">Timeline</TableHead>
                  <TableHead className="font-bold text-slate-600 h-12 text-[11px] uppercase tracking-wider">Status</TableHead>
                  <TableHead className="font-bold text-slate-600 text-right pr-6 h-12 text-[11px] uppercase tracking-wider">Manage</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredEvents.length > 0 ? (
                  filteredEvents.map((event) => {
                    const statusConfig = getStatusConfig(event.status);
                    return (
                      <TableRow key={event.id} className="hover:bg-slate-50/40 border-slate-50 transition-colors group">
                        <TableCell className="pl-6 py-4">
                          <div className="flex items-center gap-4">
                            <div className="w-12 h-12 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center overflow-hidden flex-shrink-0 shadow-sm group-hover:shadow-md transition-all">
                              {event.coverImage ? (
                                <img src={event.coverImage} className="w-full h-full object-cover" alt={event.title} />
                              ) : (
                                <CalendarDays className="w-6 h-6 text-indigo-400" />
                              )}
                            </div>
                            <div className="flex flex-col min-w-0">
                              <span className="font-bold text-slate-900 truncate max-w-[200px]">{event.title}</span>
                              <span className="text-[10px] text-slate-400 font-medium tracking-tight">ID: {event.id.slice(0, 8)}...</span>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="capitalize bg-slate-100 text-slate-600 border-none font-bold text-[10px] px-2 h-5">
                            {event.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-1.5 text-slate-700">
                              <BarChart3 size={14} className="text-slate-400" />
                              <span className="font-black text-sm">{(event.totalVotes || 0).toLocaleString()}</span>
                            </div>
                            <span className="text-[10px] text-slate-400 font-medium">{event.type === 'ticketing' ? 'Tickets Sold' : 'Votes Cast'}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex flex-col">
                            <span className="text-xs font-bold text-slate-700">
                              {formatEventDate(event.startDate, 'MMM d')} - {formatEventDate(event.endDate, 'MMM d')}
                            </span>
                            <span className="text-[10px] text-slate-400 font-medium">
                              {formatEventDate(event.endDate, 'yyyy')}
                            </span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge className={`${statusConfig.color} border font-bold capitalize px-2 py-0.5 text-[10px] flex items-center w-fit`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right pr-6">
                          <div className="flex justify-end items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2 border-slate-200 hover:border-orange-200 hover:bg-orange-50 hover:text-orange-600 transition-all" 
                              onClick={() => navigate(`/organizer/analytics/${event.id}`)}
                              title="View Analytics"
                            >
                              <BarChart3 size={14} className="mr-1.5" />
                              <span className="text-[10px] font-bold">Analytics</span>
                            </Button>

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-2 border-slate-200 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-600 transition-all font-bold" 
                              onClick={() => navigate(`/event/${event.id}`)}
                            >
                              <Eye size={14} className="mr-1.5" />
                              <span className="text-[10px]">Preview</span>
                            </Button>
                            
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-3 border-slate-200 hover:border-purple-200 hover:bg-purple-50 hover:text-purple-600 transition-all font-bold" 
                              onClick={() => navigate(`/organizer/manage/${event.id}`)}
                            >
                              <Users size={14} className="mr-1.5" />
                              <span className="text-[10px]">{event.type === 'ticketing' ? 'Tiers' : 'Nominees'}</span>
                            </Button>

                            {event.type === 'ticketing' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 transition-all font-bold text-emerald-600" 
                                onClick={() => navigate(`/organizer/tickets/${event.id}`)}
                              >
                                <Ticket size={14} className="mr-1.5" />
                                <span className="text-[10px]">Tickets</span>
                              </Button>
                            )}
    
                            {event.type === 'ticketing' && (
                              <Button 
                                variant="outline" 
                                size="sm" 
                                className="h-8 px-3 border-amber-200 hover:bg-amber-50 hover:text-amber-600 transition-all font-bold text-amber-600" 
                                onClick={() => navigate(`/organizer/promo/${event.id}`)}
                              >
                                <Tag size={14} className="mr-1.5" />
                                <span className="text-[10px]">Promo</span>
                              </Button>
                            )}

                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="h-8 px-3 border-slate-200 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-600 transition-all font-bold text-blue-600" 
                              onClick={() => navigate(`/organizer/edit/${event.id}`)}
                            >
                              <Edit size={14} className="mr-1.5" />
                              <span className="text-[10px]">Edit</span>
                            </Button>
    
                            <Button 
                              variant="ghost" 
                              size="sm" 
                              className="h-8 w-8 p-0 text-slate-400 hover:text-red-600 hover:bg-red-50 transition-all" 
                              onClick={() => handleDeleteClick(event.id, event.title)}
                            >
                              <Trash2 size={14} />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="h-64 text-center">
                      <div className="flex flex-col items-center justify-center p-8">
                        <div className="w-16 h-16 rounded-full bg-slate-50 flex items-center justify-center mb-4">
                          <Search size={24} className="text-slate-300" />
                        </div>
                        <h4 className="font-bold text-slate-900 mb-1">No matches found</h4>
                        <p className="text-sm text-slate-500 max-w-xs mx-auto">
                          {searchQuery ? "We couldn't find any events matching your search." : "You haven't created any events yet."}
                        </p>
                        {!searchQuery && (
                          <Button 
                            className="mt-6 bg-indigo-600 font-bold h-10 px-6 rounded-xl shadow-lg shadow-indigo-100"
                            onClick={() => navigate('/organizer/new-event')}
                          >
                            <CalendarDays size={16} className="mr-2" />
                            Create Your First Event
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </div>
    
          {/* Mobile Card List View */}
          <div className="block md:hidden divide-y divide-slate-100">
            {filteredEvents.length > 0 ? (
              filteredEvents.map((event) => {
                const statusConfig = getStatusConfig(event.status);
                return (
                  <div key={event.id} className="p-5 space-y-4">
                    <div className="flex gap-4">
                      <div className="w-16 h-16 shrink-0 rounded-xl bg-indigo-50 border border-indigo-100/50 flex items-center justify-center overflow-hidden shadow-sm">
                        {event.coverImage ? (
                          <img src={event.coverImage} className="w-full h-full object-cover" alt={event.title} />
                        ) : (
                          <CalendarDays className="w-8 h-8 text-indigo-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="font-bold text-slate-900 line-clamp-1">{event.title}</h4>
                          <Badge className={`${statusConfig.color} border font-bold capitalize px-1.5 py-0.5 text-[9px] shrink-0`}>
                            {statusConfig.icon}
                            {statusConfig.label}
                          </Badge>
                        </div>
                        <div className="flex items-center gap-2 mt-1">
                          <Badge variant="secondary" className="bg-slate-100 text-slate-600 border-none font-bold text-[9px] h-4 px-1.5">
                            {event.type}
                          </Badge>
                          <span className="text-[10px] text-slate-400 font-medium">ID: {event.id.slice(0, 6)}</span>
                        </div>
                        <div className="flex items-center gap-3 mt-2">
                          <div className="flex items-center gap-1 text-slate-700">
                            <BarChart3 size={12} className="text-slate-400" />
                            <span className="font-black text-xs">{(event.totalVotes || 0).toLocaleString()}</span>
                            <span className="text-[10px] text-slate-400">{event.type === 'ticketing' ? 'Sold' : 'Votes'}</span>
                          </div>
                          <div className="flex items-center gap-1 text-slate-500">
                            <CalendarDays size={12} className="text-slate-400" />
                            <span className="text-[10px] font-bold">
                              {formatEventDate(event.startDate, 'MMM d')} - {formatEventDate(event.endDate, 'MMM d')}
                            </span>
                          </div>
                        </div>
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-2 gap-2">
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 w-full border-orange-100 bg-orange-50/30 text-orange-600 font-bold text-[11px] gap-2" 
                        onClick={() => navigate(`/organizer/analytics/${event.id}`)}
                      >
                        <BarChart3 size={14} />
                        Analytics
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 w-full border-slate-200 font-bold text-[11px] gap-2" 
                        onClick={() => navigate(`/event/${event.id}`)}
                      >
                        <Eye size={14} className="text-slate-400" />
                        Preview
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 w-full border-purple-100 bg-purple-50/30 text-purple-600 font-bold text-[11px] gap-2" 
                        onClick={() => navigate(`/organizer/manage/${event.id}`)}
                      >
                        <Users size={14} />
                        {event.type === 'ticketing' ? 'Tiers' : 'Nominees'}
                      </Button>
                      {event.type === 'ticketing' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 w-full border-emerald-100 bg-emerald-50/30 text-emerald-600 font-bold text-[11px] gap-2" 
                          onClick={() => navigate(`/organizer/tickets/${event.id}`)}
                        >
                          <Ticket size={14} />
                          Check-ins
                        </Button>
                      )}
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="h-9 w-full border-blue-100 bg-blue-50/30 text-blue-600 font-bold text-[11px] gap-2" 
                        onClick={() => navigate(`/organizer/edit/${event.id}`)}
                      >
                        <Edit size={14} />
                        Edit Details
                      </Button>
                      {event.type === 'ticketing' && (
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="h-9 w-full border-amber-100 bg-amber-50/30 text-amber-600 font-bold text-[11px] gap-2" 
                          onClick={() => navigate(`/organizer/promo/${event.id}`)}
                        >
                          <Tag size={14} />
                          Promo Codes
                        </Button>
                      )}
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="h-9 w-full text-red-500 hover:bg-red-50 font-bold text-[11px] gap-2" 
                        onClick={() => handleDeleteClick(event.id, event.title)}
                      >
                        <Trash2 size={14} />
                        Delete
                      </Button>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="p-10 text-center">
                <div className="w-12 h-12 rounded-full bg-slate-50 flex items-center justify-center mx-auto mb-4">
                  <Search size={20} className="text-slate-300" />
                </div>
                <h4 className="font-bold text-slate-900 text-sm">No matches found</h4>
                <p className="text-xs text-slate-500 mt-1">Try a different search term.</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      <ConfirmationDialog
        open={deleteDialogOpen}
        onOpenChange={setDeleteDialogOpen}
        title="Delete Event"
        description={`Are you sure you want to delete "${eventToDelete?.title}"? This action cannot be undone and all associated data, participants, and transaction history will be permanently lost.`}
        confirmText="Delete Event"
        cancelText="Cancel"
        variant="destructive"
        onConfirm={confirmDeleteEvent}
        isLoading={isDeleting}
      />
    </div>
  );
}


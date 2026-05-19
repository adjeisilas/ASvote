import { supabase } from '../lib/supabase';
import { Event, Withdrawal, Notification, User as AppUser, Transaction, Category, Nominee, ActivityLog } from '../types';
import axios from '../lib/axios';

const CACHE_DURATION = 30000; // 30 seconds
const cache: {
  events: { data: any[]; timestamp: number } | null;
  eventDetails: Record<string, { data: any; timestamp: number }>;
} = {
  events: null,
  eventDetails: {},
};

export const databaseService = {
  // --- Profiles / Users ---
  async getUserProfile(uid: string) {
    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', uid)
      .single();
    if (error) return null;
    
    // Map snake_case to camelCase
    return {
      uid: data.id,
      email: data.email,
      role: data.role,
      status: data.status,
      emailVerified: data.email_verified,
      displayName: data.display_name,
      phoneNumber: data.phone_number,
      createdAt: data.created_at,
      updatedAt: data.updated_at
    };
  },

  async updateProfile(uid: string, updates: any) {
    const dbUpdates: any = {};
    
    // Explicitly map fields to ensure they go to the right columns
    if (updates.displayName !== undefined) dbUpdates.display_name = updates.displayName;
    if (updates.display_name !== undefined) dbUpdates.display_name = updates.display_name;
    
    if (updates.phoneNumber !== undefined) dbUpdates.phone_number = updates.phoneNumber;
    if (updates.phone_number !== undefined) dbUpdates.phone_number = updates.phone_number;
    
    if (updates.email !== undefined) dbUpdates.email = updates.email;
    if (updates.role !== undefined) dbUpdates.role = updates.role;
    if (updates.status !== undefined) dbUpdates.status = updates.status;
    
    if (updates.emailVerified !== undefined) dbUpdates.email_verified = updates.emailVerified;
    if (updates.email_verified !== undefined) dbUpdates.email_verified = updates.email_verified;

    // Explicitly handle updated_at
    dbUpdates.updated_at = new Date().toISOString();

    const { data, error } = await supabase
      .from('profiles')
      .update(dbUpdates)
      .eq('id', uid)
      .select();

    if (error) throw error;
    
    if (!data || data.length === 0) {
      // Check if the record exists at all
      const { data: exists } = await supabase.from('profiles').select('id').eq('id', uid).maybeSingle();
      if (!exists) {
        throw new Error("Profile record not found in database.");
      }
      throw new Error("Update failed: access denied or nothing changed.");
    }
    
    return data[0];
  },

  // --- Events ---
  async getEvents(filters?: { organizerId?: string; status?: string; type?: string }) {
    // Check cache for global events (no filters)
    if (!filters && cache.events && (Date.now() - cache.events.timestamp < CACHE_DURATION)) {
      return cache.events.data;
    }

    let query = supabase
      .from('events')
      .select('*, profiles(display_name)');
    
    if (filters?.organizerId) query = query.eq('organizer_id', filters.organizerId);
    if (filters?.status) query = query.eq('status', filters.status);
    if (filters?.type) query = query.eq('type', filters.type);
    
    const { data: rawData, error } = await query;
    if (error) throw error;
    
    // Fetch details separately for better resilience against foreign key cache issues
    const eventIds = (rawData || []).map(e => e.id);
    let votingDetails: any[] = [];
    let ticketingDetails: any[] = [];

    if (eventIds.length > 0) {
      const [{ data: vData }, { data: tData }] = await Promise.all([
        supabase.from('voting_events').select('*').in('event_id', eventIds),
        supabase.from('ticketing_events').select('*').in('event_id', eventIds)
      ]);
      votingDetails = vData || [];
      ticketingDetails = tData || [];
    }

    const data = (rawData || []).sort((a, b) => {
      const timeA = new Date(a.created_at || 0).getTime();
      const timeB = new Date(b.created_at || 0).getTime();
      return timeB - timeA;
    });
    
    const result = data.map(e => {
      const voting = votingDetails.find(v => v.event_id === e.id);
      const ticketing = ticketingDetails.find(t => t.event_id === e.id);
      return this.mapEventData({ ...e, voting_events: voting ? [voting] : [], ticketing_events: ticketing ? [ticketing] : [] });
    });

    // Cache if it was a global fetch
    if (!filters) {
      cache.events = { data: result, timestamp: Date.now() };
    }

    return result;
  },

  mapEventData(e: any): Event {
    const voting = e.voting_events?.[0] || e.voting_events;
    const ticketing = e.ticketing_events?.[0] || e.ticketing_events;
    
    return {
      id: e.id,
      organizerId: e.organizer_id,
      title: e.title,
      description: e.description,
      type: e.type,
      status: e.status,
      coverImage: e.cover_image,
      tags: e.tags,
      createdAt: e.created_at,
      updatedAt: e.updated_at,
      
      // Map extensions
      votingDetails: voting ? {
        startDate: voting.start_date,
        endDate: voting.end_date,
        totalVotes: voting.total_votes,
        commission: voting.commission,
        votingInstructions: voting.voting_instructions,
        multipleVotesEnabled: voting.multiple_votes_enabled
      } : undefined,

      ticketingDetails: ticketing ? {
        venue: ticketing.venue,
        doorsOpen: ticketing.doors_open,
        eventTime: ticketing.event_time,
        expectedEnd: ticketing.expected_end,
        eventDate: ticketing.event_date,
        organizerEmail: ticketing.organizer_email,
        organizerPhone: ticketing.organizer_phone,
        salesStart: ticketing.sales_start,
        salesEnd: ticketing.sales_end,
        refundPolicy: ticketing.refund_policy,
        maxTicketsPerUser: ticketing.max_tickets_per_user,
        commission: ticketing.commission
      } : undefined,

      // Compatibility layer for legacy UI parts
      commission: voting?.commission || ticketing?.commission || 0,
      startDate: voting?.start_date || ticketing?.event_date,
      endDate: voting?.end_date || ticketing?.event_date,
      totalVotes: voting?.total_votes || ticketing?.total_sales || 0,
      venue: ticketing?.venue,
      doorsOpen: ticketing?.doors_open,
      mainEventStart: ticketing?.event_time,
      expectedEnd: ticketing?.expected_end,
      organizerEmail: ticketing?.organizer_email,
      organizerPhone: ticketing?.organizer_phone,
      salesStart: ticketing?.sales_start,
      salesEnd: ticketing?.sales_end,
      refundPolicy: ticketing?.refund_policy,
      maxTicketsPerUser: ticketing?.max_tickets_per_user
    };
  },

  async getEventById(id: string): Promise<Event & { categories: any[] }> {
    // Check cache
    if (cache.eventDetails[id] && (Date.now() - cache.eventDetails[id].timestamp < CACHE_DURATION)) {
      return cache.eventDetails[id].data;
    }

    const { data, error } = await supabase
      .from('events')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;

    // Fetch details separately for resilience against schema cache issues
    const [
      { data: votingDetail }, 
      { data: ticketDetail },
      { data: vCats },
      { data: tTiers }
    ] = await Promise.all([
      supabase.from('voting_events').select('*').eq('event_id', id).maybeSingle(),
      supabase.from('ticketing_events').select('*').eq('event_id', id).maybeSingle(),
      supabase.from('voting_categories').select('*, nominees(*)').eq('event_id', id),
      supabase.from('ticket_tiers').select('*').eq('event_id', id)
    ]);
    
    const baseEvent = this.mapEventData({
      ...data,
      voting_events: votingDetail ? [votingDetail] : [],
      ticketing_events: ticketDetail ? [ticketDetail] : []
    });
    
    // Map categories/tiers into a unified Categories list for the UI
    const categories: any[] = [];
    
    if (vCats) {
      vCats.forEach((vc: any) => {
        categories.push({
          id: vc.id,
          eventId: vc.event_id,
          name: vc.name,
          description: vc.description,
          votePrice: vc.vote_price,
          nominees: (vc.nominees || []).map((n: any) => ({
            id: n.id,
            categoryId: n.category_id,
            eventId: n.event_id,
            name: n.name,
            code: n.code,
            imageUrl: n.image_url,
            description: n.description,
            voteCount: n.vote_count
          }))
        });
      });
    }

    if (tTiers) {
      tTiers.forEach((tt: any) => {
        categories.push({
          id: tt.id,
          eventId: tt.event_id,
          name: tt.name,
          description: tt.description,
          price: tt.price,
          capacity: tt.capacity,
          soldCount: tt.sold_count
        });
      });
    }
    
    const result = { ...baseEvent, categories };
    
    // Update cache
    cache.eventDetails[id] = { data: result, timestamp: Date.now() };

    return result;
  },

  async getCategories(eventId: string, type: 'voting' | 'ticketing' = 'voting') {
    if (type === 'voting') {
      const { data, error } = await supabase
        .from('voting_categories')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(c => ({
        id: c.id,
        eventId: c.event_id,
        name: c.name,
        description: c.description,
        votePrice: c.vote_price,
        createdAt: c.created_at
      }));
    } else {
      const { data, error } = await supabase
        .from('ticket_tiers')
        .select('*')
        .eq('event_id', eventId)
        .order('created_at', { ascending: true });
      if (error) throw error;
      return (data || []).map(c => ({
        id: c.id,
        eventId: c.event_id,
        name: c.name,
        description: c.description,
        price: c.price,
        capacity: c.capacity,
        soldCount: c.sold_count,
        createdAt: c.created_at
      }));
    }
  },

  async getNominees(eventId: string) {
    const { data, error } = await supabase
      .from('nominees')
      .select('*')
      .eq('event_id', eventId);
      
    if (error) throw error;
    
    const sortedData = (data || []).sort((a, b) => (b.vote_count || 0) - (a.vote_count || 0));
    
    return sortedData.map(n => ({
      id: n.id,
      categoryId: n.category_id,
      eventId: n.event_id,
      name: n.name,
      code: n.code,
      imageUrl: n.image_url,
      description: n.description,
      voteCount: n.vote_count,
      createdAt: n.created_at
    }));
  },

  async createEvent(eventData: any) {
    const { data: baseData, error: baseError } = await supabase
      .from('events')
      .insert([{
        organizer_id: eventData.organizerId || eventData.organizer_id,
        title: eventData.title,
        description: eventData.description,
        type: eventData.type,
        status: eventData.status || 'draft',
        cover_image: eventData.coverImage || eventData.cover_image,
        tags: eventData.tags
      }])
      .select()
      .single();
    
    if (baseError) throw baseError;
    const eventId = baseData.id;

    // Invalidate events cache
    cache.events = null;

    if (eventData.type === 'voting') {
      const { error: voteError } = await supabase
        .from('voting_events')
        .insert([{
          event_id: eventId,
          start_date: eventData.startDate || eventData.start_date,
          end_date: eventData.endDate || eventData.end_date,
          commission: eventData.commission || 0,
          voting_instructions: eventData.votingInstructions,
          multiple_votes_enabled: eventData.multipleVotesEnabled !== undefined ? eventData.multipleVotesEnabled : true
        }]);
      if (voteError) throw voteError;
    } else {
      const ticketPayload: any = {
        event_id: eventId,
        venue: eventData.venue || 'TBA',
        doors_open: eventData.doorsOpen,
        event_time: eventData.eventTime || eventData.mainEventStart,
        expected_end: eventData.expectedEnd,
        event_date: eventData.eventDate || eventData.startDate || eventData.start_date,
        organizer_email: eventData.organizerEmail,
        organizer_phone: eventData.organizerPhone,
        sales_start: eventData.salesStart,
        sales_end: eventData.salesEnd,
        refund_policy: eventData.refundPolicy,
        max_tickets_per_user: eventData.maxTicketsPerUser || 10,
        commission: eventData.commission || 0
      };

      const { error: ticketError } = await supabase
        .from('ticketing_events')
        .insert([ticketPayload]);
      
      if (ticketError) {
        if (ticketError.message?.includes('expected_end')) {
          console.warn("expected_end column missing in ticketing_events, retrying without it");
          const { expected_end, ...fallbackPayload } = ticketPayload;
          const { error: retryError } = await supabase
            .from('ticketing_events')
            .insert([fallbackPayload]);
          if (retryError) throw retryError;
        } else {
          throw ticketError;
        }
      }
    }

    return this.getEventById(eventId);
  },

  async updateEvent(eventId: string, updates: any) {
    // 1. Update Base
    const baseUpdates: any = {};
    if (updates.title) baseUpdates.title = updates.title;
    if (updates.description) baseUpdates.description = updates.description;
    if (updates.status) baseUpdates.status = updates.status;
    if (updates.coverImage) baseUpdates.cover_image = updates.coverImage;
    if (updates.tags) baseUpdates.tags = updates.tags;
    
    if (Object.keys(baseUpdates).length > 0) {
      const { error: baseError } = await supabase
        .from('events')
        .update(baseUpdates)
        .eq('id', eventId);
      if (baseError) throw baseError;
    }

    // 2. Fetch current event to know type
    const { data: current } = await supabase.from('events').select('type').eq('id', eventId).single();
    
    if (current?.type === 'voting') {
      const voteUpdates: any = {};
      if (updates.startDate) voteUpdates.start_date = updates.startDate;
      if (updates.endDate) voteUpdates.end_date = updates.endDate;
      if (updates.commission !== undefined) voteUpdates.commission = updates.commission;
      if (updates.votingInstructions !== undefined) voteUpdates.voting_instructions = updates.votingInstructions;
      if (updates.multipleVotesEnabled !== undefined) voteUpdates.multiple_votes_enabled = updates.multipleVotesEnabled;
      
      if (Object.keys(voteUpdates).length > 0) {
        const { data: existing } = await supabase.from('voting_events').select('event_id').eq('event_id', eventId).maybeSingle();
        if (existing) {
          await supabase.from('voting_events').update(voteUpdates).eq('event_id', eventId);
        } else {
          await supabase.from('voting_events').insert([{ event_id: eventId, ...voteUpdates }]);
        }
      }
    } else if (current?.type === 'ticketing') {
      const ticketUpdates: any = {};
      if (updates.venue !== undefined) ticketUpdates.venue = updates.venue;
      if (updates.doorsOpen !== undefined) ticketUpdates.doors_open = updates.doorsOpen;
      if (updates.eventTime !== undefined) ticketUpdates.event_time = updates.eventTime;
      if (updates.mainEventStart !== undefined) ticketUpdates.event_time = updates.mainEventStart;
      if (updates.expectedEnd !== undefined) ticketUpdates.expected_end = updates.expectedEnd;
      if (updates.eventDate !== undefined) ticketUpdates.event_date = updates.eventDate;
      if (updates.organizerEmail !== undefined) ticketUpdates.organizer_email = updates.organizerEmail;
      if (updates.organizerPhone !== undefined) ticketUpdates.organizer_phone = updates.organizerPhone;
      if (updates.salesStart !== undefined) ticketUpdates.sales_start = updates.salesStart;
      if (updates.salesEnd !== undefined) ticketUpdates.sales_end = updates.salesEnd;
      if (updates.refundPolicy !== undefined) ticketUpdates.refund_policy = updates.refundPolicy;
      if (updates.maxTicketsPerUser !== undefined) ticketUpdates.max_tickets_per_user = updates.maxTicketsPerUser;
      if (updates.commission !== undefined) ticketUpdates.commission = updates.commission;
      
      if (Object.keys(ticketUpdates).length > 0) {
        const { data: existing } = await supabase.from('ticketing_events').select('event_id').eq('event_id', eventId).maybeSingle();
        if (existing) {
          const { error: updateError } = await supabase.from('ticketing_events').update(ticketUpdates).eq('event_id', eventId);
          if (updateError && updateError.message?.includes('expected_end')) {
            console.warn("expected_end column missing during update, retrying without it");
            const { expected_end, ...fallbackUpdates } = ticketUpdates;
            await supabase.from('ticketing_events').update(fallbackUpdates).eq('event_id', eventId);
          } else if (updateError) {
            throw updateError;
          }
        } else {
          // If for some reason it's missing, we need to insert.
          // venue is NOT NULL, so we provide a default if it's missing from updates.
          const insertPayload = { 
            event_id: eventId, 
            venue: ticketUpdates.venue || 'TBD', // Guarantee venue present
            ...ticketUpdates 
          };
          await supabase.from('ticketing_events').insert([insertPayload]);
        }
      }
    }

    // Invalidate caches
    cache.events = null;
    delete cache.eventDetails[eventId];

    return this.getEventById(eventId);
  },

  // --- Categories & Nominees ---
  async createCategory(categoryData: any) {
    // Determine which table to use
    const { data: event } = await supabase.from('events').select('type').eq('id', categoryData.eventId).single();
    
    if (event?.type === 'voting') {
      const { data, error } = await supabase
        .from('voting_categories')
        .insert([{
          event_id: categoryData.eventId,
          name: categoryData.name,
          description: categoryData.description,
          vote_price: categoryData.votePrice || 1.0
        }])
        .select()
        .single();
      if (error) throw error;
      
      // Invalidate caches
      cache.events = null;
      delete cache.eventDetails[categoryData.eventId];
      
      return data;
    } else {
      const { data, error } = await supabase
        .from('ticket_tiers')
        .insert([{
          event_id: categoryData.eventId,
          name: categoryData.name,
          description: categoryData.description,
          price: categoryData.price || categoryData.votePrice || 0,
          capacity: categoryData.capacity || 100
        }])
        .select()
        .single();
      if (error) throw error;
      
      // Invalidate caches
      cache.events = null;
      delete cache.eventDetails[categoryData.eventId];
      
      return data;
    }
  },

  async updateCategory(id: string, updates: any, type: 'voting' | 'ticketing' = 'voting') {
    const table = type === 'voting' ? 'voting_categories' : 'ticket_tiers';
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.description !== undefined) dbUpdates.description = updates.description;
    
    if (type === 'voting') {
      if (updates.votePrice !== undefined) dbUpdates.vote_price = updates.votePrice;
    } else {
      if (updates.price !== undefined) dbUpdates.price = updates.price;
      if (updates.capacity !== undefined) dbUpdates.capacity = updates.capacity;
    }

    const { data, error } = await supabase
      .from(table)
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Invalidate cache
    cache.events = null;
    cache.eventDetails = {}; // Partial invalidation complex here
    
    return data;
  },

  async deleteCategory(id: string, type: 'voting' | 'ticketing' = 'voting') {
    const table = type === 'voting' ? 'voting_categories' : 'ticket_tiers';
    const { error } = await supabase
      .from(table)
      .delete()
      .eq('id', id);
    if (error) throw error;
    
    // Invalidate cache
    cache.events = null;
    cache.eventDetails = {};
  },

  async createNominee(nomineeData: any) {
    const dbData: any = {
      event_id: nomineeData.eventId || nomineeData.event_id,
      category_id: nomineeData.categoryId || nomineeData.category_id,
      name: nomineeData.name,
      code: nomineeData.code,
      image_url: nomineeData.imageUrl || nomineeData.image_url,
      description: nomineeData.description,
      capacity: nomineeData.capacity
    };
    const { data, error } = await supabase
      .from('nominees')
      .insert([dbData])
      .select();
    
    if (error) {
      if (error.code === 'PGRST204' || error.message?.includes('capacity')) {
        console.warn("capacity column missing in nominees table, retrying without it");
        const { capacity, ...fallbackData } = dbData;
        const { data: retryData, error: retryError } = await supabase
          .from('nominees')
          .insert([fallbackData])
          .select();
        if (retryError) throw retryError;
        
        // Invalidate cache
        cache.events = null;
        delete cache.eventDetails[nomineeData.eventId];
        
        return retryData[0];
      }
      throw error;
    }
    
    // Invalidate cache
    cache.events = null;
    delete cache.eventDetails[nomineeData.eventId];
    
    return data[0];
  },

  async updateNominee(id: string, updates: any) {
    const dbUpdates: any = {};
    if (updates.name !== undefined) dbUpdates.name = updates.name;
    if (updates.code !== undefined) dbUpdates.code = updates.code;
    
    const imageUrl = updates.imageUrl !== undefined ? updates.imageUrl : updates.image_url;
    if (imageUrl !== undefined) dbUpdates.image_url = imageUrl;
    
    if (updates.description !== undefined) dbUpdates.description = updates.description;

    const { data, error } = await supabase
      .from('nominees')
      .update(dbUpdates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteNominee(id: string) {
    const { error } = await supabase
      .from('nominees')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async incrementNomineeVote(nomineeId: string, count: number = 1) {
    const { error: nomineeError } = await supabase.rpc('increment_nominee_votes', { row_id: nomineeId, votes: count });
    if (nomineeError) throw nomineeError;
    
    // Increment total event votes
    const { data: nominee } = await supabase.from('nominees').select('event_id').eq('id', nomineeId).single();
    if (nominee) {
      await supabase.rpc('increment_event_votes', { row_id: nominee.event_id, votes: count });
      
      // Invalidate cache
      cache.events = null;
      delete cache.eventDetails[nominee.event_id];
    }
  },

  // --- Promo Codes ---
  async getPromoCodes(eventId: string) {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('event_id', eventId);
    if (error) throw error;
    return (data || []).map(p => ({
      id: p.id,
      eventId: p.event_id,
      code: p.code,
      discountType: p.discount_type,
      discountValue: p.discount_value,
      usageLimit: p.usage_limit,
      usageCount: p.usage_count,
      expiryDate: p.expiry_date,
      isActive: p.is_active
    }));
  },

  async deletePromoCode(id: string) {
    const { error } = await supabase
      .from('promo_codes')
      .delete()
      .eq('id', id);
    if (error) throw error;
  },

  async validatePromoCode(eventId: string, code: string) {
    const { data, error } = await supabase
      .from('promo_codes')
      .select('*')
      .eq('event_id', eventId)
      .eq('code', code)
      .eq('is_active', true)
      .single();
    
    if (error) return null;
    
    // Check expiry
    if (data.expiry_date && new Date(data.expiry_date) < new Date()) return null;
    
    // Check usage limit
    if (data.usage_limit && data.usage_count >= data.usage_limit) return null;
    
    return {
      id: data.id,
      eventId: data.event_id,
      code: data.code,
      discountType: data.discount_type,
      discountValue: data.discount_value,
      usageLimit: data.usage_limit,
      usageCount: data.usage_count,
      expiryDate: data.expiry_date,
      isActive: data.is_active
    };
  },

  async createPromoCode(promoData: any) {
    const dbData = {
      event_id: promoData.eventId,
      code: promoData.code,
      discount_type: promoData.discountType,
      discount_value: promoData.discountValue,
      usage_limit: promoData.usageLimit,
      expiry_date: promoData.expiryDate,
      is_active: promoData.isActive !== undefined ? promoData.isActive : true
    };
    const { data, error } = await supabase
      .from('promo_codes')
      .insert([dbData])
      .select();
    if (error) throw error;
    return data[0];
  },

  // --- Transactions ---
  async getTransactions(filters?: { eventId?: string; status?: string }) {
    let query = supabase.from('transactions').select('*, vote_transactions(*), tickets(*)');
    if (filters?.eventId) query = query.eq('event_id', filters.eventId);
    if (filters?.status) query = query.eq('status', filters.status);
    
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    
    return (data || []).map(t => ({
      id: t.id,
      voterEmail: t.voter_email,
      eventId: t.event_id,
      organizerId: t.organizer_id,
      amount: t.amount,
      type: t.type,
      status: t.status,
      paystackRef: t.paystack_ref,
      createdAt: t.created_at,
      discountApplied: t.discount_applied,
      promoCodeId: t.promo_code_id,
      // Map extensions
      votes: t.vote_transactions?.[0]?.vote_count || 0,
      nomineeId: t.vote_transactions?.[0]?.nominee_id,
      categoryId: t.vote_transactions?.[0]?.category_id,
      tickets: t.tickets || []
    }));
  },

  async createTransaction(transaction: any) {
    const { data: base, error: baseError } = await supabase
      .from('transactions')
      .insert([{
        voter_email: transaction.voterEmail,
        event_id: transaction.eventId,
        organizer_id: transaction.organizerId,
        amount: transaction.amount,
        type: transaction.type,
        status: transaction.status || 'pending',
        paystack_ref: transaction.paystackRef,
        discount_applied: transaction.discountApplied || 0,
        promo_code_id: transaction.promoCodeId
      }])
      .select()
      .single();

    if (baseError) throw baseError;
    const transactionId = base.id;

    // Invalidate caches
    cache.events = null;
    delete cache.eventDetails[transaction.eventId];

    if (transaction.type === 'vote') {
      const { error: voteError } = await supabase
        .from('vote_transactions')
        .insert([{
          transaction_id: transactionId,
          nominee_id: transaction.nomineeId,
          category_id: transaction.categoryId,
          vote_count: transaction.votes || 1
        }]);
      if (voteError) throw voteError;
    } else if (transaction.type === 'ticket' && transaction.tickets) {
      const ticketsToInsert = transaction.tickets.map((t: any) => ({
        transaction_id: transactionId,
        event_id: transaction.eventId,
        tier_id: t.tierId || transaction.categoryId,
        ticket_holder_name: t.holderName,
        ticket_holder_email: t.holderEmail,
        qr_code: t.qrCode
      }));
      
      const { error: ticketError } = await supabase.from('tickets').insert(ticketsToInsert);
      if (ticketError) throw ticketError;
    }

    return base;
  },

  // --- Withdrawals ---
  async getWithdrawals(organizerId?: string) {
    let query = supabase.from('withdrawals').select('*, profiles!organizer_id(display_name, email)');
    if (organizerId) query = query.eq('organizer_id', organizerId);
    
    const { data: rawData, error } = await query;
    if (error) throw error;
    
    // Manual sort for resilience
    const data = (rawData || []).sort((a, b) => {
      const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
      const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    
    return data.map(w => ({
      id: w.id,
      organizerId: w.organizer_id,
      amount: w.amount,
      status: w.status,
      createdAt: w.created_at || w.timestamp,
      organizerName: w.profiles?.display_name,
      organizerEmail: w.profiles?.email
    }));
  },

  async requestWithdrawal(withdrawalData: any) {
    const dbData = {
      organizer_id: withdrawalData.organizerId || withdrawalData.organizer_id,
      amount: withdrawalData.amount,
      status: 'pending'
    };
    const { data, error } = await supabase
      .from('withdrawals')
      .insert([dbData])
      .select();
    if (error) throw error;
    return data[0];
  },

  // --- Notifications ---
  async getNotifications(userId: string) {
    const { data, error } = await supabase
      .from('notifications')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return (data || []).map(n => ({
      id: n.id,
      userId: n.user_id,
      title: n.title,
      message: n.message,
      type: n.type,
      read: n.read,
      createdAt: n.created_at
    }));
  },

  subscribeToNotifications(userId: string, callback: (notifications: Notification[]) => void) {
    const sub = supabase
      .channel(`notifications-${userId}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table: 'notifications', 
        filter: `user_id=eq.${userId}` 
      }, async () => {
        const notifications = await this.getNotifications(userId);
        callback(notifications);
      })
      .subscribe();
    
    return () => {
      supabase.removeChannel(sub);
    };
  },

  async markNotificationAsRead(id: string) {
    await supabase.from('notifications').update({ read: true }).eq('id', id);
  },

  // --- Tickets ---
  async getTickets(filters: { eventId?: string; transactionId?: string; voterEmail?: string }) {
    let query = supabase.from('tickets').select('*, transactions(voter_email), ticket_tiers(name)');
    
    if (filters.eventId) query = query.eq('event_id', filters.eventId);
    if (filters.transactionId) query = query.eq('transaction_id', filters.transactionId);
    
    const { data, error } = await query;
    if (error) throw error;
    
    return (data || []).map(t => ({
      id: t.id,
      transactionId: t.transaction_id,
      eventId: t.event_id,
      tierId: t.tier_id,
      tierName: t.ticket_tiers?.name,
      holderName: t.ticket_holder_name,
      holderEmail: t.ticket_holder_email,
      qrCode: t.qr_code,
      checkedIn: t.checked_in,
      checkedInAt: t.checked_in_at,
      createdAt: t.created_at,
      voterEmail: (t.transactions as any)?.voter_email
    }));
  },

  async getTicketByQrCode(qrCode: string) {
    const { data, error } = await supabase
      .from('tickets')
      .select('*, events(title), ticket_tiers(name), transactions(voter_email)')
      .eq('qr_code', qrCode.toUpperCase())
      .single();
    
    if (error) throw error;
    
    return {
      id: data.id,
      transactionId: data.transaction_id,
      eventId: data.event_id,
      eventTitle: data.events?.title,
      tierName: data.ticket_tiers?.name,
      holderName: data.ticket_holder_name,
      holderEmail: data.ticket_holder_email,
      qrCode: data.qr_code,
      checkedIn: data.checked_in,
      checkedInAt: data.checked_in_at,
      voterEmail: (data.transactions as any)?.voter_email
    };
  },

  async checkInTicket(ticketId: string) {
    const { data, error } = await supabase
      .from('tickets')
      .update({
        checked_in: true,
        checked_in_at: new Date().toISOString()
      })
      .eq('id', ticketId)
      .select();
      
    if (error) throw error;
    return data[0];
  },

  // --- Activity Logs ---
  async logActivity(log: any) {
    const dbLog = {
      action: log.action,
      admin_id: log.adminId,
      details: log.details
    };
    const { data, error } = await supabase.from('activity_logs').insert([dbLog]);
    if (error) throw error;
    return data;
  },

  // --- Admin Methods ---
  async getOrganizers() {
    const { data: rawData, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('role', 'organizer');

    if (error) throw error;
    
    // Sort manually for resilience
    const data = (rawData || []).sort((a, b) => {
      const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
      const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    
    return data.map(o => ({
      uid: o.id,
      email: o.email,
      role: o.role,
      status: o.status,
      emailVerified: o.email_verified,
      displayName: o.display_name,
      phoneNumber: o.phone_number,
      createdAt: o.created_at || o.timestamp,
      updatedAt: o.updated_at
    }));
  },

  async getAllWithdrawals() {
    const { data: rawData, error } = await supabase
      .from('withdrawals')
      .select('*, profiles!organizer_id(id, display_name, email)');
      
    if (error) throw error;
    
    // Manual sort for resilience
    const data = (rawData || []).sort((a, b) => {
      const timeA = new Date(a.created_at || a.timestamp || 0).getTime();
      const timeB = new Date(b.created_at || b.timestamp || 0).getTime();
      return timeB - timeA;
    });
    
    return data.map(w => ({
      id: w.id,
      organizerId: w.organizer_id,
      amount: w.amount,
      status: w.status,
      createdAt: w.created_at || w.timestamp,
      organizerName: w.profiles?.display_name,
      organizerEmail: w.profiles?.email
    }));
  },

  async deleteProfile(id: string) {
    const { error } = await supabase.from('profiles').delete().eq('id', id);
    if (error) throw error;
  },

  async deleteUserAuth(userId: string, adminId: string) {
    const response = await axios.post('/api/admin/delete-user', {
      userId,
      adminId
    });
    return response.data;
  },

  async deleteEvent(id: string) {
    const { error } = await supabase.from('events').delete().eq('id', id);
    if (error) throw error;
  },

  async updateWithdrawalStatus(id: string, status: string) {
    const { data, error } = await supabase
      .from('withdrawals')
      .update({ status })
      .eq('id', id)
      .select();
    if (error) throw error;
    if (!data || data.length === 0) throw new Error("Withdrawal not found or access denied");
    return data[0];
  },

  async recordVoteOnServer(voteData: any, reference: string) {
    console.log("DatabaseService: recording vote on server...", reference);
    const response = await axios.post('/api/votes/record', {
      voteData,
      reference
    }, {
      timeout: 60000 // 60s timeout for payment verification + DB recording
    });
    return response.data;
  },

  async requestWithdrawalOnServer(uid: string, amount: number) {
    const response = await axios.post('/api/withdrawals/request', {
      uid,
      amount
    });
    return response.data;
  },

  async getOrganizerStats(uid: string) {
    try {
      // Fetch event IDs first to avoid redundant nested awaits
      const { data: userEvents, error: eventsError } = await supabase
        .from('events')
        .select('id, status')
        .eq('organizer_id', uid);
      
      if (eventsError) throw eventsError;
      
      const eventIds = userEvents?.map(e => e.id) || [];
      const hasEvents = eventIds.length > 0;

      const [transRes, withdrawalsRes, catsRes, tiersRes, nomsRes] = await Promise.all([
        supabase.from('transactions').select('amount, commission').eq('organizer_id', uid).eq('status', 'success'),
        supabase.from('withdrawals').select('amount, status').eq('organizer_id', uid),
        hasEvents ? supabase.from('voting_categories').select('id').in('event_id', eventIds) : Promise.resolve({ data: [] }),
        hasEvents ? supabase.from('ticket_tiers').select('id').in('event_id', eventIds) : Promise.resolve({ data: [] }),
        hasEvents ? supabase.from('nominees').select('id').in('event_id', eventIds) : Promise.resolve({ data: [] }),
      ]);

      if (transRes.error) {
        console.warn("Transactions fetch error:", transRes.error);
      }

      const events = userEvents || [];
      const transactions = (transRes.data as any[]) || [];
      const withdrawals = withdrawalsRes.data || [];
      const totalCategories = (catsRes.data?.length || 0) + (tiersRes.data?.length || 0);
      const totalNominees = nomsRes.data?.length || 0;

      const approvedCount = events.filter(e => ['approved', 'active', 'ended'].includes(e.status)).length;
      const pendingCount = events.filter(e => e.status === 'pending').length;
      const rejectedCount = events.filter(e => e.status === 'rejected').length;

      const totalEarnings = transactions.reduce((acc, t) => {
        const commission = Number(t.commission) || 0;
        return acc + (Number(t.amount) * (1 - commission / 100));
      }, 0);

      const grossEarnings = transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      const totalCommissions = transactions.reduce((acc, t) => {
        const commPercent = Number(t.commission) || 0;
        return acc + (Number(t.amount) * (commPercent / 100));
      }, 0);

      const pendingPayouts = withdrawals
        .filter(w => w.status === 'pending')
        .reduce((acc, w) => acc + (Number(w.amount) || 0), 0);

      const completedPayouts = withdrawals
        .filter(w => ['completed', 'approved'].includes(w.status))
        .reduce((acc, w) => acc + (Number(w.amount) || 0), 0);

      return {
        totalEvents: events.length,
        approvedCount,
        pendingCount,
        rejectedCount,
        totalEarnings: Math.floor(totalEarnings),
        grossEarnings: Math.floor(grossEarnings),
        totalCommissions: Math.floor(totalCommissions),
        pendingPayouts: Math.floor(pendingPayouts),
        completedPayouts: Math.floor(completedPayouts),
        totalCategories,
        totalNominees,
        pendingCountRaw: pendingCount
      };
    } catch (err) {
      console.error("Error in getOrganizerStats:", err);
      return {
        totalEvents: 0,
        approvedCount: 0,
        pendingCount: 0,
        rejectedCount: 0,
        totalEarnings: 0,
        grossEarnings: 0,
        totalCommissions: 0,
        pendingPayouts: 0,
        completedPayouts: 0,
        totalCategories: 0,
        totalNominees: 0
      };
    }
  },

  async getAdminStats() {
    try {
      const [eventsRes, transRes, withdrawalsRes, profilesRes] = await Promise.all([
        supabase.from('events').select('status'),
        supabase.from('transactions').select('amount, status, type, commission, quantity, vote_transactions(vote_count)').eq('status', 'success'),
        supabase.from('withdrawals').select('amount, status'),
        supabase.from('profiles').select('role', { count: 'exact' }).eq('role', 'organizer')
      ]);

      if (transRes.error) {
        console.warn("Transactions fetch error (maybe missing commission or quantity?), falling back.");
        const { data: fallbackTrans } = await supabase.from('transactions').select('amount, status, type, commission, quantity, vote_transactions(vote_count)').eq('status', 'success');
        (transRes as any).data = fallbackTrans;
      }

      const events = eventsRes.data || [];
      const transactions = (transRes.data as any[]) || [];
      const withdrawals = withdrawalsRes.data || [];
      const organizersCount = profilesRes.count || 0;

      const totalVolume = transactions.reduce((acc, t) => acc + (Number(t.amount) || 0), 0);
      
      const totalCommissions = transactions.reduce((acc, t) => {
        const commPercent = Number((t as any).commission) || 0;
        return acc + (Number(t.amount) * (commPercent / 100));
      }, 0);

      const totalPendingPayouts = withdrawals
        .filter(w => w.status === 'pending')
        .reduce((acc, w) => acc + (Number(w.amount) || 0), 0);

      const totalCompletedPayouts = withdrawals
        .filter(w => ['completed', 'approved'].includes(w.status))
        .reduce((acc, w) => acc + (Number(w.amount) || 0), 0);

      return {
        totalOrganizers: organizersCount,
        totalEvents: events.length,
        activeEvents: events.filter(e => e.status === 'active').length,
        totalVolume: Math.floor(totalVolume),
        totalCommissions: Math.floor(totalCommissions),
        totalPendingPayouts: Math.floor(totalPendingPayouts),
        totalCompletedPayouts: Math.floor(totalCompletedPayouts),
        totalVotes: transactions.reduce((acc, t) => {
          const count = Number((t as any).quantity) || 
                       (t.type === 'vote' ? 
                         (Array.isArray(t.vote_transactions) ? Number(t.vote_transactions[0]?.vote_count) : Number((t.vote_transactions as any)?.vote_count)) : 
                         1);
          return acc + (count || 0);
        }, 0)
      };
    } catch (err) {
      console.error("Error in getAdminStats:", err);
      return {
        totalOrganizers: 0,
        totalEvents: 0,
        activeEvents: 0,
        totalVolume: 0,
        totalCommissions: 0,
        totalPendingPayouts: 0,
        totalCompletedPayouts: 0,
        totalVotes: 0
      };
    }
  },

  async getVotingTrends(uid: string, eventId?: string) {
    let query = supabase
      .from('transactions')
      .select('created_at, amount, vote_transactions(vote_count)')
      .eq('organizer_id', uid)
      .eq('status', 'success');

    if (eventId) {
      query = query.eq('event_id', eventId);
    }

    const { data, error } = await query.order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(t => ({
      ...t,
      votes: Array.isArray(t.vote_transactions) ? t.vote_transactions[0]?.vote_count : (t.vote_transactions as any)?.vote_count || 0
    }));
  },

  async getGlobalVotingTrends() {
    const { data, error } = await supabase
      .from('transactions')
      .select('created_at, amount, vote_transactions(vote_count)')
      .eq('status', 'success')
      .order('created_at', { ascending: true });

    if (error) throw error;
    return (data || []).map(t => ({
      ...t,
      votes: Array.isArray(t.vote_transactions) ? t.vote_transactions[0]?.vote_count : (t.vote_transactions as any)?.vote_count || 0
    }));
  },

  async getRecentActivities() {
    // 1. Latest events
    const { data: events } = await supabase
      .from('events')
      .select('id, created_at, title, organizer_id, profiles(display_name)')
      .order('created_at', { ascending: false })
      .limit(20);

    // 2. Latest large transactions
    const { data: transactions } = await supabase
      .from('transactions')
      .select('created_at, amount, status, event_id, events(title)')
      .eq('status', 'success')
      .order('created_at', { ascending: false })
      .limit(30);

    // 3. Latest withdrawals
    const { data: withdrawals } = await supabase
      .from('withdrawals')
      .select('created_at, amount, status, organizer_id, profiles(id, display_name)')
      .order('created_at', { ascending: false })
      .limit(20);

    const activities: any[] = [];

    (events || []).forEach(e => {
      const prof = Array.isArray(e.profiles) ? e.profiles[0] : e.profiles;
      activities.push({
        id: `event-${e.created_at}-${e.title}`,
        type: 'event_created',
        timestamp: e.created_at,
        details: {
          id: e.id,
          title: e.title,
          organizer: prof?.display_name || 'Anonymous',
          organizerId: e.organizer_id
        }
      });
    });

    (transactions || []).forEach(t => {
      const eventData = Array.isArray(t.events) ? t.events[0] : t.events;
      activities.push({
        id: `trans-${t.created_at}-${t.amount}`,
        type: 'large_payment',
        timestamp: t.created_at,
        details: {
          id: t.event_id,
          amount: t.amount,
          event: eventData?.title || 'Unknown Event'
        }
      });
    });

    (withdrawals || []).forEach(w => {
      const prof = Array.isArray(w.profiles) ? w.profiles[0] : w.profiles;
      activities.push({
        id: `with-${w.created_at}-${w.amount}`,
        type: 'withdrawal_request',
        timestamp: w.created_at,
        details: {
          id: prof?.id,
          amount: w.amount,
          organizer: prof?.display_name || 'Anonymous',
          status: w.status
        }
      });
    });

    // Sort by timestamp descending
    return activities.sort((a, b) => 
      new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    ).slice(0, 50);
  },

  async getTopPerformers() {
    const { data: transactions } = await supabase
      .from('transactions')
      .select('amount, event_id, organizer_id, events(title), profiles!transactions_organizer_id_fkey(display_name)')
      .eq('status', 'success');

    if (!transactions) return { topEvents: [], topOrganizers: [] };

    // Aggregate by Event
    const eventMap: Record<string, any> = {};
    const organizerMap: Record<string, any> = {};

    transactions.forEach(t => {
      // Event aggregation
      if (t.event_id) {
        if (!eventMap[t.event_id]) {
          const eventData = Array.isArray(t.events) ? t.events[0] : t.events;
          eventMap[t.event_id] = { id: t.event_id, name: eventData?.title || 'Unknown', revenue: 0, count: 0 };
        }
        eventMap[t.event_id].revenue += t.amount || 0;
        eventMap[t.event_id].count += 1;
      }

      // Organizer aggregation
      if (t.organizer_id) {
        if (!organizerMap[t.organizer_id]) {
          // profiles mapping needs to account for possible mapping structure
          const prof = Array.isArray(t.profiles) ? t.profiles[0] : t.profiles;
          organizerMap[t.organizer_id] = { id: t.organizer_id, name: prof?.display_name || 'Anonymous', revenue: 0, count: 0 };
        }
        organizerMap[t.organizer_id].revenue += t.amount || 0;
        organizerMap[t.organizer_id].count += 1;
      }
    });

    const topEvents = Object.values(eventMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    const topOrganizers = Object.values(organizerMap)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 5);

    return { topEvents, topOrganizers };
  },

  async getOrganizerDetail(organizerId: string) {
    // 1. Fetch Profile
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', organizerId)
      .single();

    if (profileError) throw profileError;

    // 2. Fetch Events
    const { data: events, error: eventsError } = await supabase
      .from('events')
      .select('*')
      .eq('organizer_id', profile.uid) // Note: events uses uid for organizer reference usually
      .order('created_at', { ascending: false });

    // 3. Fetch Withdrawals
    const { data: withdrawals, error: withError } = await supabase
      .from('withdrawals')
      .select('*')
      .eq('organizer_id', profile.uid)
      .order('created_at', { ascending: false });

    // 4. Fetch Transactions for lifetime volume
    const { data: transactions, error: transError } = await supabase
      .from('transactions')
      .select('amount')
      .eq('organizer_id', profile.uid)
      .eq('status', 'success');

    const totalVolume = (transactions || []).reduce((sum, t) => sum + (t.amount || 0), 0);

    return {
      profile,
      events: events || [],
      withdrawals: withdrawals || [],
      totalVolume
    };
  },

  async getSystemLogs() {
    const { data, error } = await supabase
      .from('activity_logs')
      .select('*, profiles(display_name)')
      .order('created_at', { ascending: false })
      .limit(100);

    if (error) {
      console.error("Error fetching system logs:", error);
      return [];
    }
    return data || [];
  },

  async logAction(action: string, details: any, targetId?: string, targetType?: string) {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase
      .from('activity_logs')
      .insert({
        admin_id: user.id,
        action,
        details,
        target_id: targetId,
        target_type: targetType,
        created_at: new Date().toISOString()
      });

    if (error) console.error("Error creating system log:", error);
  }
};


import { createClient, SupabaseClient } from '@supabase/supabase-js';

let internalClient: SupabaseClient | null = null;
let isMockLoaded = false;

// Store auth listeners
const authListeners = new Set<(event: string, session: any) => void>();

// Seed default mock structure in localStorage
const initializeMockData = () => {
  if (typeof window === 'undefined') return;
  
  const tables = [
    'profiles',
    'events',
    'voting_events',
    'ticketing_events',
    'voting_categories',
    'ticket_tiers',
    'nominees',
    'promo_codes',
    'transactions',
    'vote_transactions',
    'tickets',
    'withdrawals',
    'notifications',
    'activity_logs'
  ];

  tables.forEach(table => {
    const key = `asvote_mock_table_${table}`;
    if (!localStorage.getItem(key)) {
      let defaultData: any[] = [];
      
      if (table === 'profiles') {
        defaultData = [
          {
            id: "mock-admin-id",
            email: "admin@test.com",
            role: "admin",
            display_name: "ASVote System Administrator",
            phone_number: "+233 55 123 4567",
            status: "approved",
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "mock-organizer-id",
            email: "organizer@test.com",
            role: "organizer",
            display_name: "Silas Event Solutions",
            phone_number: "+233 24 987 6543",
            status: "approved",
            email_verified: true,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      } else if (table === 'events') {
        defaultData = [
          {
            id: "event-1",
            organizer_id: "mock-organizer-id",
            title: "National Spotlight Music Awards 2026",
            description: "Join us in celebrating outstanding musical achievements across the nation. This prestigious voting event is curated for fans to cast unlimited secure ballots for their beloved creators across various categories with premium, fully verified real-time lead analytics.",
            type: "voting",
            status: "active",
            cover_image: "https://picsum.photos/seed/vibrant/1200/600",
            tags: ["Music", "Awards", "Fan-Vote"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          },
          {
            id: "event-2",
            organizer_id: "mock-organizer-id",
            title: "Global AI & Web Innovation Summit",
            description: "Experience the ultimate frontier of technology. The 2026 web summit registers elite panel speakers, immersive developer hubs, networking lunches, and immersive check-ins. Grab your premium General Admission or VIP entry ticket code today.",
            type: "ticketing",
            status: "active",
            cover_image: "https://picsum.photos/seed/tech/1200/600",
            tags: ["Tech", "AI", "Startup"],
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }
        ];
      } else if (table === 'voting_events') {
        defaultData = [
          {
            event_id: "event-1",
            start_date: new Date().toISOString(),
            end_date: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
            commission: 10,
            voting_instructions: "Select your chosen nominee, enter your email and ticketing reference, and process the secure Paystack checkout. Each credit corresponds to one certified vote.",
            multiple_votes_enabled: true,
            total_votes: 1110
          }
        ];
      } else if (table === 'ticketing_events') {
        defaultData = [
          {
            event_id: "event-2",
            venue: "Silicon Accra Innovation Center Complex",
            doors_open: "08:00 AM",
            event_time: "09:00 AM",
            expected_end: "05:00 PM",
            event_date: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
            organizer_email: "support@silasevents.com",
            organizer_phone: "+233 24 987 6543",
            sales_start: new Date().toISOString(),
            sales_end: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(),
            refund_policy: "Refunds are processed up to 72 hours before opening doors.",
            max_tickets_per_user: 10,
            commission: 5
          }
        ];
      } else if (table === 'voting_categories') {
        defaultData = [
          {
            id: "cat-1",
            event_id: "event-1",
            name: "Vocalist of the Year",
            description: "Celebrating outstanding solo vocal performances and exceptional lyrical delivery.",
            vote_price: 1.5,
            created_at: new Date().toISOString()
          },
          {
            id: "cat-2",
            event_id: "event-1",
            name: "Next-Gen Producer of the Year",
            description: "Recognizing visionary engineering and outstanding sound architecture in hit releases.",
            vote_price: 1.0,
            created_at: new Date().toISOString()
          }
        ];
      } else if (table === 'ticket_tiers') {
        defaultData = [
          {
            id: "tier-1",
            event_id: "event-2",
            name: "General Delegate Pass",
            description: "Provides full access to all developer keynotes, tech presentations, exhibition stalls, and refreshments.",
            price: 50.0,
            capacity: 500,
            sold_count: 32,
            created_at: new Date().toISOString()
          },
          {
            id: "tier-2",
            event_id: "event-2",
            name: "VIP Networking Gold Pass",
            description: "All access plus masterclass workshops, gourmet luncheon with delegates, and limited summit merchandise swag packs.",
            price: 150.0,
            capacity: 80,
            sold_count: 14,
            created_at: new Date().toISOString()
          }
        ];
      } else if (table === 'nominees') {
        defaultData = [
          {
            id: "nom-1",
            category_id: "cat-1",
            event_id: "event-1",
            name: "Aria Sterling",
            code: "ARIA",
            image_url: "https://picsum.photos/seed/aria/400/400",
            description: "Neo-soul genius whose latest acoustic album spent 6 consecutive weeks riding the top billboards.",
            vote_count: 640,
            created_at: new Date().toISOString()
          },
          {
            id: "nom-2",
            category_id: "cat-1",
            event_id: "event-1",
            name: "Gabriel Cross",
            code: "GABRIEL",
            image_url: "https://picsum.photos/seed/gabriel/400/400",
            description: "High-octane alternative rock frontman celebrated for magnificent arena presence.",
            vote_count: 470,
            created_at: new Date().toISOString()
          },
          {
            id: "nom-3",
            category_id: "cat-2",
            event_id: "event-1",
            name: "Neon Pulse (DJ)",
            code: "NEON",
            image_url: "https://picsum.photos/seed/noon/400/400",
            description: "Pioneering producer who crafted three platinum synthwave viral sensation hits.",
            vote_count: 230,
            created_at: new Date().toISOString()
          },
          {
            id: "nom-4",
            category_id: "cat-2",
            event_id: "event-1",
            name: "Sienna Wood",
            code: "SIENNA",
            image_url: "https://picsum.photos/seed/sienna/400/400",
            description: "Folk orchestral producer whose organic string mixes won international engineering acclaim.",
            vote_count: 180,
            created_at: new Date().toISOString()
          }
        ];
      } else if (table === 'promo_codes') {
        defaultData = [
          {
            id: "promo-1",
            event_id: "event-2",
            code: "AISUMMIT10",
            discount_type: "percentage",
            discount_value: 10,
            usage_limit: 100,
            usage_count: 0,
            expiry_date: new Date(Date.now() + 10 * 24 * 3600 * 1000).toISOString(),
            is_active: true
          }
        ];
      } else if (table === 'notifications') {
        defaultData = [
          {
            id: "notif-1",
            user_id: "mock-organizer-id",
            title: "Welcome to ASVote",
            message: "Get started by creating your stunning ticketing or live voting competition in seconds.",
            type: "info",
            read: false,
            created_at: new Date().toISOString()
          }
        ];
      }

      localStorage.setItem(key, JSON.stringify(defaultData));
    }
  });

  isMockLoaded = true;
  console.log('✨ ASVote Local Storage Mock Seed Database Initialized Perfectly!');
};

// Mock Query Chain Proxy Builder
function createQueryChain(table: string) {
  const chain: any = {
    _table: table,
    _eq: [] as { col: string; val: any }[],
    _in: [] as { col: string; vals: any[] }[],
    _single: false,
    _maybeSingle: false,
    _order: null as { col: string; asc: boolean } | null,
    _limit: null as number | null,
    _insertData: null as any,
    _updateData: null as any,
    _isDelete: false,
  };

  const getTableRecords = (): any[] => {
    try {
      const stored = localStorage.getItem(`asvote_mock_table_${table}`);
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  };

  const setTableRecords = (recs: any[]) => {
    localStorage.setItem(`asvote_mock_table_${table}`, JSON.stringify(recs));
  };

  const executeQuery = () => {
    let records = getTableRecords();

    // 1. Filter by equality filters
    chain._eq.forEach((filter: any) => {
      records = records.filter(r => {
        const recordVal = r[filter.col];
        // handle both snake_case and camelCase field queries
        if (recordVal !== undefined) return String(recordVal) === String(filter.val);
        
        // try looking up nested values or alternate cases
        const snakeCol = filter.col.replace(/([A-Z])/g, "_$1").toLowerCase();
        if (r[snakeCol] !== undefined) return String(r[snakeCol]) === String(filter.val);
        
        return true; // fail-safe (don't evict if field isn't defined)
      });
    });

    // 2. Filter by in filters
    chain._in.forEach((filter: any) => {
      records = records.filter(r => {
        let recordVal = r[filter.col];
        if (recordVal === undefined) {
          const snakeCol = filter.col.replace(/([A-Z])/g, "_$1").toLowerCase();
          recordVal = r[snakeCol];
        }
        return recordVal !== undefined ? filter.vals.map(String).includes(String(recordVal)) : false;
      });
    });

    // 3. Write actions
    if (chain._insertData) {
      const itemsToInsert = Array.isArray(chain._insertData) ? chain._insertData : [chain._insertData];
      const inserted = itemsToInsert.map((item: any) => {
        const newItem = {
          id: item.id || `mock-id-${Math.floor(Math.random() * 1000000)}`,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          ...item
        };
        return newItem;
      });
      const allRecs = [...getTableRecords(), ...inserted];
      setTableRecords(allRecs);
      
      // Invalidate event caches if events or details are created
      if (typeof window !== 'undefined') {
        localStorage.removeItem('asvote_cache_events');
      }

      return Array.isArray(chain._insertData) ? inserted : inserted[0];
    }

    if (chain._updateData) {
      const allRecs = getTableRecords();
      let updatedItems: any[] = [];
      
      const modifiedRecs = allRecs.map(r => {
        let match = true;
        
        chain._eq.forEach((filter: any) => {
          let recordVal = r[filter.col];
          if (recordVal === undefined) {
            const snakeCol = filter.col.replace(/([A-Z])/g, "_$1").toLowerCase();
            recordVal = r[snakeCol];
          }
          if (recordVal !== undefined && String(recordVal) !== String(filter.val)) {
            match = false;
          }
        });

        if (match) {
          const updated = {
            ...r,
            ...chain._updateData,
            updated_at: new Date().toISOString()
          };
          updatedItems.push(updated);
          return updated;
        }
        return r;
      });

      setTableRecords(modifiedRecs);
      return chain._single || chain._maybeSingle ? updatedItems[0] || null : updatedItems;
    }

    if (chain._isDelete) {
      const allRecs = getTableRecords();
      const kept = allRecs.filter(r => {
        let match = true;
        chain._eq.forEach((filter: any) => {
          let recordVal = r[filter.col];
          if (recordVal === undefined) {
            const snakeCol = filter.col.replace(/([A-Z])/g, "_$1").toLowerCase();
            recordVal = r[snakeCol];
          }
          if (recordVal !== undefined && String(recordVal) !== String(filter.val)) {
            match = false;
          }
        });
        return !match;
      });
      setTableRecords(kept);
      return null;
    }

    // Sort order
    if (chain._order) {
      const { col, asc } = chain._order;
      records.sort((a, b) => {
        const valA = a[col] ?? '';
        const valB = b[col] ?? '';
        return asc ? (valA > valB ? 1 : -1) : (valA < valB ? 1 : -1);
      });
    }

    // Limit records
    if (chain._limit) {
      records = records.slice(0, chain._limit);
    }

    if (chain._single) {
      return records[0] || null;
    }
    
    if (chain._maybeSingle) {
      return records[0] || null;
    }

    return records;
  };

  const builderProxy: any = new Proxy(chain, {
    get(target, prop) {
      // Treat as Promise when awaited/thenable
      if (prop === 'then') {
        return (onfulfilled: any) => {
          const result = executeQuery();
          return Promise.resolve(onfulfilled({ data: result, error: null }));
        };
      }

      // Fluent builders
      if (prop === 'select') {
        return () => builderProxy;
      }
      if (prop === 'eq') {
        return (col: string, val: any) => {
          target._eq.push({ col, val });
          return builderProxy;
        };
      }
      if (prop === 'neq') {
        return (col: string, val: any) => {
          return builderProxy;
        };
      }
      if (prop === 'in') {
        return (col: string, vals: any[]) => {
          target._in.push({ col, vals });
          return builderProxy;
        };
      }
      if (prop === 'single') {
        target._single = true;
        return builderProxy;
      }
      if (prop === 'maybeSingle') {
        target._maybeSingle = true;
        return builderProxy;
      }
      if (prop === 'order') {
        return (col: string, opts?: { ascending: boolean }) => {
          target._order = { col, asc: opts?.ascending ?? true };
          return builderProxy;
        };
      }
      if (prop === 'limit') {
        return (limitNum: number) => {
          target._limit = limitNum;
          return builderProxy;
        };
      }
      if (prop === 'insert') {
        return (dataBlock: any) => {
          target._insertData = dataBlock;
          return builderProxy;
        };
      }
      if (prop === 'update') {
        return (dataBlock: any) => {
          target._updateData = dataBlock;
          return builderProxy;
        };
      }
      if (prop === 'delete') {
        return () => {
          target._isDelete = true;
          return builderProxy;
        };
      }

      return (target as any)[prop];
    }
  });

  return builderProxy;
}

// Global window checking for missing keys
export const checkSupabaseConfigured = (): boolean => {
  if (typeof window === 'undefined') return true;
  
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL);
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY);
  
  return !!(supabaseUrl && supabaseAnonKey && supabaseUrl.startsWith('http'));
};

const getSupabaseMock = (): any => {
  if (typeof window === 'undefined') {
    return {
      auth: {
        getUser: () => Promise.resolve({ data: { user: null }, error: null }),
        getSession: () => Promise.resolve({ data: { session: null }, error: null }),
        onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
        signOut: () => Promise.resolve({ error: null })
      },
      from: () => ({
        select: () => ({
          eq: () => ({
            order: () => Promise.resolve({ data: [], error: null }),
            single: () => Promise.resolve({ data: null, error: null }),
            maybeSingle: () => Promise.resolve({ data: null, error: null })
          }),
          order: () => Promise.resolve({ data: [], error: null })
        }),
        insert: () => Promise.resolve({ data: [], error: null }),
        update: () => Promise.resolve({ data: [], error: null }),
        delete: () => Promise.resolve({ data: [], error: null })
      }),
      rpc: () => Promise.resolve({ data: null, error: null }),
      channel: () => ({ on: () => ({ subscribe: () => ({ unsubscribe: () => {} }) }) })
    };
  }

  if (!isMockLoaded) {
    initializeMockData();
  }

  const mockUser = (): any => {
    try {
      const stored = localStorage.getItem('asvote_mock_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  };

  const getMockSession = (): any => {
    const user = mockUser();
    return user ? { user, access_token: 'mock-authorization-jwt' } : null;
  };

  const notifyListeners = (event: string, session: any) => {
    authListeners.forEach(listener => {
      try {
        listener(event, session);
      } catch (err) {
        console.error('Error in auth event listener: ', err);
      }
    });
  };

  return {
    auth: {
      async getSession() {
        return { data: { session: getMockSession() }, error: null };
      },
      async getUser() {
        const u = mockUser();
        return { data: { user: u }, error: null };
      },
      onAuthStateChange(callback: (event: string, session: any) => void) {
        authListeners.add(callback);
        // Fire immediately with initial state
        const session = getMockSession();
        setTimeout(() => callback('SIGNED_IN', session), 10);
        return {
          data: {
            subscription: {
              unsubscribe() {
                authListeners.delete(callback);
              }
            }
          }
        };
      },
      async signUp({ email, password, options }: any) {
        const key = 'asvote_mock_table_profiles';
        const profilesString = localStorage.getItem(key) || '[]';
        const profiles = JSON.parse(profilesString);
        
        const existing = profiles.find((p: any) => p.email === email);
        if (existing) {
          return { data: { user: null }, error: { message: "An account with this email already exists." } };
        }

        const role = options?.data?.role || 'organizer';
        const displayName = options?.data?.displayName || email.split('@')[0];

        const newUserProfile = {
          id: `profile-${Math.floor(Math.random() * 1000000)}`,
          email,
          role,
          display_name: displayName,
          phone_number: options?.data?.phoneNumber || "",
          status: 'approved', // Auto-approve demo orgs
          email_verified: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };

        profiles.push(newUserProfile);
        localStorage.setItem(key, JSON.stringify(profiles));

        const user = {
          id: newUserProfile.id,
          email,
          role,
          email_confirmed_at: new Date().toISOString(),
          user_metadata: {
            displayName,
            role
          }
        };

        return { data: { user, session: null }, error: null };
      },
      async signInWithPassword({ email, password }: any) {
        const profilesString = localStorage.getItem('asvote_mock_table_profiles') || '[]';
        const profiles = JSON.parse(profilesString);
        
        const found = profiles.find((p: any) => p.email.toLowerCase() === email.toLowerCase());
        
        if (!found) {
          return { data: { user: null, session: null }, error: { message: "Invalid login credentials. Sign up or try developer logins: organizer@test.com / admin@test.com" } };
        }

        const userObj = {
          id: found.id,
          email: found.email,
          user_metadata: {
            displayName: found.display_name,
            role: found.role
          }
        };

        localStorage.setItem('asvote_mock_user', JSON.stringify(userObj));
        
        const session = { user: userObj, access_token: 'mock-token' };
        notifyListeners('SIGNED_IN', session);

        return { data: { user: userObj, session }, error: null };
      },
      async signOut() {
        localStorage.removeItem('asvote_mock_user');
        notifyListeners('SIGNED_OUT', null);
        return { error: null };
      },
      async updateCurrentUser(updates: any) {
        const user = mockUser();
        if (!user) return { error: { message: "No active user session." } };
        
        const profilesString = localStorage.getItem('asvote_mock_table_profiles') || '[]';
        const profiles = JSON.parse(profilesString);
        
        const index = profiles.findIndex((p: any) => p.id === user.id);
        if (index !== -1) {
          profiles[index].display_name = updates.data?.displayName || profiles[index].display_name;
          profiles[index].phone_number = updates.data?.phoneNumber || profiles[index].phone_number;
          localStorage.setItem('asvote_mock_table_profiles', JSON.stringify(profiles));
        }

        user.user_metadata = {
          ...user.user_metadata,
          ...updates.data
        };
        localStorage.setItem('asvote_mock_user', JSON.stringify(user));

        return { data: { user }, error: null };
      }
    },
    from(table: string) {
      return createQueryChain(table);
    },
    rpc(fn: string, args: any) {
      if (fn === 'increment_nominee_votes' && args?.row_id) {
        const nominees = JSON.parse(localStorage.getItem('asvote_mock_table_nominees') || '[]');
        const idx = nominees.findIndex((n: any) => n.id === args.row_id);
        if (idx !== -1) {
          nominees[idx].vote_count = (nominees[idx].vote_count || 0) + (args.votes || 1);
          localStorage.setItem('asvote_mock_table_nominees', JSON.stringify(nominees));
        }
      }
      if (fn === 'increment_event_votes' && args?.row_id) {
        const votes = JSON.parse(localStorage.getItem('asvote_mock_table_voting_events') || '[]');
        const idx = votes.findIndex((v: any) => v.event_id === args.row_id);
        if (idx !== -1) {
          votes[idx].total_votes = (votes[idx].total_votes || 0) + (args.votes || 1);
          localStorage.setItem('asvote_mock_table_voting_events', JSON.stringify(votes));
        }
      }
      return Promise.resolve({ data: null, error: null });
    },
    channel() {
      return {
        on() {
          return this;
        },
        subscribe() {
          return {
            unsubscribe() {}
          };
        }
      };
    },
    removeChannel() {}
  };
};

export const supabase = new Proxy({} as SupabaseClient, {
  get(target, prop) {
    if (!internalClient) {
      const isConfigured = checkSupabaseConfigured();
      if (!isConfigured) {
        // Return fully responsive client-side mock implementation so that developers have a perfectly functional preview app!
        const mockClient = getSupabaseMock();
        return (mockClient as any)[prop];
      }

      const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_URL) || "";
      const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || (typeof import.meta !== 'undefined' && import.meta.env?.VITE_SUPABASE_ANON_KEY) || "";

      internalClient = createClient(supabaseUrl, supabaseAnonKey);
    }
    
    const value = (internalClient as any)[prop];
    return typeof value === 'function' ? value.bind(internalClient) : value;
  }
});

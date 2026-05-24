import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

let internalClient: any = null;

const getSupabase = () => {
  if (internalClient) return internalClient;

  const supabaseUrl = process.env.SUPABASE_URL || process.env.NEXT_PUBLIC_SUPABASE_URL || process.env.VITE_SUPABASE_URL || "";
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY || process.env.SUPABASE_ANON_KEY || "";

  if (!supabaseUrl || !supabaseServiceKey || !supabaseUrl.startsWith('http')) {
    if (!supabaseUrl) console.warn("WARNING: SUPABASE_URL is missing! Server-side will run in high-fidelity mock mode.");
    else if (!supabaseUrl.startsWith('http')) console.warn("WARNING: SUPABASE_URL is invalid, running in mock mode:", supabaseUrl);
    
    if (!supabaseServiceKey) console.warn("WARNING: SUPABASE_SERVICE_ROLE_KEY is missing! Server-side will run in mock mode.");
    
    return null;
  }

  try {
    internalClient = createClient(supabaseUrl, supabaseServiceKey);
    return internalClient;
  } catch (err) {
    console.error("Failed to initialize Supabase client:", err);
    return null;
  }
};

// -----------------------------------------------------
// Server-side High-Fidelity Mock Fallback Configuration
// -----------------------------------------------------

const initServerMocks = () => {
  (globalThis as any).asvote_server_mocks = {
    profiles: [
      {
        id: "mock-admin-id",
        email: "admin@asvote.com",
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
        email: "organizer@asvote.com",
        role: "organizer",
        display_name: "Silas Event Solutions",
        phone_number: "+233 24 987 6543",
        status: "approved",
        email_verified: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    events: [
      {
        id: "fallback-system",
        organizer_id: "mock-organizer-id",
        title: "Host Your First Event",
        description: "Create and launch highly customized live voting campaigns and secure ticketing experiences on ASVote.",
        cover_image: "https://images.unsplash.com/photo-1540575861501-7cf05a4b125a?auto=format&fit=crop&q=80&w=1000",
        type: "voting",
        status: "active",
        tags: ["demo", "live"],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }
    ],
    voting_events: [
      {
        event_id: "fallback-system",
        start_date: new Date().toISOString(),
        end_date: new Date(Date.now() + 86400000 * 30).toISOString(),
        total_votes: 0,
        commission: 10,
        voting_instructions: "Select your favorite nominee and checkout.",
        multiple_votes_enabled: true
      }
    ],
    ticketing_events: [],
    voting_categories: [],
    nominees: [],
    ticket_tiers: [],
    transactions: [],
    promo_codes: [],
    vote_transactions: [],
    tickets: [],
    withdrawals: [],
    notifications: [],
    activity_logs: []
  };
};

function createServerQueryChain(table: string) {
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
    if (!(globalThis as any).asvote_server_mocks) {
      initServerMocks();
    }
    return (globalThis as any).asvote_server_mocks[table] || [];
  };

  const setTableRecords = (recs: any[]) => {
    if (!(globalThis as any).asvote_server_mocks) {
      initServerMocks();
    }
    (globalThis as any).asvote_server_mocks[table] = recs;
  };

  const executeQuery = () => {
    let records = [...getTableRecords()];

    // 1. Filter by equality filters
    chain._eq.forEach((filter: any) => {
      records = records.filter(r => {
        const recordVal = r[filter.col];
        if (recordVal !== undefined) return String(recordVal) === String(filter.val);
        
        const snakeCol = filter.col.replace(/([A-Z])/g, "_$1").toLowerCase();
        if (r[snakeCol] !== undefined) return String(r[snakeCol]) === String(filter.val);
        
        return true;
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
      if (prop === 'then') {
        return (onfulfilled: any) => {
          const result = executeQuery();
          return Promise.resolve(onfulfilled({ data: result, error: null }));
        };
      }

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
        return () => {
          target._single = true;
          return builderProxy;
        };
      }
      if (prop === 'maybeSingle') {
        return () => {
          target._maybeSingle = true;
          return builderProxy;
        };
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

const getServerSupabaseMock = () => {
  if (!(globalThis as any).asvote_server_mocks) {
    initServerMocks();
  }
  return {
    auth: {
      async getUser(token?: string) {
        let userId = "mock-organizer-id";
        if (token) {
          if (token.includes(":")) {
            userId = token.split(":")[1];
          } else if (token.includes("admin")) {
            userId = "mock-admin-id";
          }
        }
        const profiles = (globalThis as any).asvote_server_mocks.profiles;
        const foundProfile = profiles.find((p: any) => p.id === userId) || profiles[1] || profiles[0];
        
        const userObj = {
          id: foundProfile.id,
          email: foundProfile.email,
          role: foundProfile.role,
          user_metadata: {
            role: foundProfile.role,
            displayName: foundProfile.display_name,
            full_name: foundProfile.display_name,
            name: foundProfile.display_name,
          }
        };
        return { data: { user: userObj }, error: null };
      },
      admin: {
        async deleteUser(userId: string) {
          const profiles = (globalThis as any).asvote_server_mocks.profiles;
          (globalThis as any).asvote_server_mocks.profiles = profiles.filter((p: any) => p.id !== userId);
          return { error: null };
        }
      }
    },
    from(table: string) {
      return createServerQueryChain(table);
    },
    rpc: () => Promise.resolve({ data: null, error: null }),
  };
};

export const supabase = new Proxy({} as any, {
  get(target, prop) {
    const client = getSupabase();
    if (!client) {
      const mockClient = getServerSupabaseMock();
      return (mockClient as any)[prop];
    }
    const value = (client as any)[prop];
    return typeof value === 'function' ? value.bind(client) : value;
  }
});

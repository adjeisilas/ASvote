import { NextRequest } from "next/server";
import { supabase } from "../../../../server/lib/supabase";
import { initializePaystackCharge } from "../../../../server/services/payment.service";
import { ussdSchema } from "../../../../server/lib/schemas";

export async function GET() {
  return new Response(
    "CON USSD Service is running. Please use POST to interact with this endpoint.",
    {
      headers: { "Content-Type": "text/plain" },
    }
  );
}

export async function POST(req: NextRequest) {
  let sessionID = "";
  try {
    const rawBody = await req.json().catch(() => ({}));
    const validated = ussdSchema.safeParse(rawBody);
    const body = validated.success ? validated.data : rawBody;

    sessionID = body.sessionID || body.sessionId;
    const rawMsisdn = body.msisdn || body.phoneNumber;
    const msisdn = rawMsisdn ? rawMsisdn.replace('+', '') : null;
    const userDataRaw = body.userData || body.text || "";
    let rawNetwork = body.network || body.networkCode || '';
    
    // Normalize network for Paystack (mtn, vod, tgo)
    let network = 'mtn';
    if (!rawNetwork && msisdn) {
      const normalized = msisdn.startsWith('233') ? msisdn.slice(3) : msisdn;
      if (normalized.startsWith('020') || normalized.startsWith('20') || 
          normalized.startsWith('050') || normalized.startsWith('50')) {
        network = 'vod';
      } else if (normalized.startsWith('027') || normalized.startsWith('27') || 
                 normalized.startsWith('057') || normalized.startsWith('57') || 
                 normalized.startsWith('026') || normalized.startsWith('26') || 
                 normalized.startsWith('056') || normalized.startsWith('56')) {
        network = 'tgo';
      } else {
        network = 'mtn';
      }
    } else {
      rawNetwork = (rawNetwork || '').toLowerCase();
      if (rawNetwork.includes('mtn')) network = 'mtn';
      else if (rawNetwork.includes('vod') || rawNetwork.includes('telecel')) network = 'vod';
      else if (rawNetwork.includes('tgo') || rawNetwork.includes('airtel') || rawNetwork.includes('tigo')) network = 'tgo';
    }

    if (!sessionID || !msisdn) {
      console.error("USSD Error: Missing sessionID or MSISDN", body);
      return new Response("END Bad Request", {
        headers: { "Content-Type": "text/plain" },
      });
    }

    const inputs = userDataRaw.split('*').filter((x: string) => x.trim().length > 0);
    const userData = inputs.length > 0 ? inputs[inputs.length - 1] : "";
    
    let session: any = { step: 'WELCOME' };
    
    // Periodically cleanup stale sessions (older than 2 hours)
    supabase.from('ussd_sessions')
      .delete()
      .lt('updated_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .then(({ error }: { error: any }) => { if (error) console.error("USSD Cleanup Error:", error); });

    // Fetch session
    const { data: dbSession } = await supabase
      .from('ussd_sessions')
      .select('data')
      .eq('id', sessionID)
      .single();
    
    if (dbSession) {
      session = dbSession.data;
    }

    let responseText = "";
    
    const isNewSession = !dbSession || body.newSession === true || body.newSession === "true" || (inputs.length === 0 && session.step === 'WELCOME');

    if (isNewSession) {
      responseText = "CON Welcome to ASVote\n1. Vote\n2. Buy Ticket";
      const startData = { step: 'SERVICE_SELECT', msisdn };
      await supabase.from('ussd_sessions').upsert({
        id: sessionID,
        msisdn,
        data: startData,
        updated_at: new Date().toISOString()
      });
    } else {
      switch (session.step) {
        case 'WELCOME':
        case 'SERVICE_SELECT':
          if (userData === '1') {
            responseText = "CON Enter Nominee Code (e.g. NAM-01):";
            session = { ...session, step: 'NOMINEE_VOTE_CODE', type: 'vote' };
          } else if (userData === '2') {
            responseText = "CON Enter Event Code:";
            session = { ...session, step: 'EVENT_TICKET_CODE', type: 'ticket' };
          } else {
            responseText = "CON Invalid option.\n1. Vote\n2. Buy Ticket";
          }
          break;

        case 'EVENT_TICKET_CODE':
          const { data: event } = await supabase
            .from('events')
            .select('id, title, type, organizer_id')
            .ilike('title', `%${userData}%`)
            .eq('type', 'ticketing')
            .limit(1)
            .single();

          if (event) {
            const { data: tiers } = await supabase
              .from('ticket_tiers')
              .select('id, name, price')
              .eq('event_id', event.id);

            if (tiers && tiers.length > 0) {
              let tierList = `CON ${event.title}\nSelect Tier:\n`;
              tiers.forEach((t: any, i: number) => {
                tierList += `${i + 1}. ${t.name} (${t.price} GHS)\n`;
              });
              responseText = tierList;
              session = { ...session, step: 'TICKET_TIER_SELECT', eventId: event.id, eventTitle: event.title, organizerId: event.organizer_id, tiers };
            } else {
              responseText = "END This event has no ticket tiers available.";
              session = null;
            }
          } else {
            responseText = "CON Event not found.\nEnter Event Code (Title):";
          }
          break;

        case 'TICKET_TIER_SELECT':
          const tierIdx = parseInt(userData) - 1;
          if (session.tiers && session.tiers[tierIdx]) {
            const selectedTier = session.tiers[tierIdx];
            responseText = `CON Tier: ${selectedTier.name}\nPrice: ${selectedTier.price} GHS\nEnter quantity:`;
            session = { ...session, step: 'TICKET_QUANTITY', tierId: selectedTier.id, tierName: selectedTier.name, price: selectedTier.price };
          } else {
            responseText = "CON Invalid tier selection.\nSelect Tier:";
          }
          break;

        case 'TICKET_QUANTITY':
          const qty = parseInt(userData);
          if (isNaN(qty) || qty <= 0) {
            responseText = "CON Invalid quantity.\nEnter quantity:";
          } else {
            const totalAmount = qty * session.price;
            responseText = `CON Confirm ${qty} ${session.tierName} tickets for ${session.eventTitle}\nTotal: ${totalAmount} GHS\n1. Confirm\n2. Cancel`;
            session = { ...session, step: 'CONFIRM_PAYMENT', quantity: qty, total: totalAmount };
          }
          break;

        case 'NOMINEE_VOTE_CODE':
          const { data: nominee } = await supabase
            .from('nominees')
            .select('id, name, code, event_id, events(organizer_id), voting_categories(id, vote_price)')
            .eq('code', userData.toUpperCase())
            .single();

          if (nominee) {
            const category = Array.isArray(nominee.voting_categories) ? nominee.voting_categories[0] : nominee.voting_categories;
            const price = category?.vote_price || 1.0;
            const organizerId = (nominee.events as any)?.organizer_id;
            const categoryId = category?.id;
            
            responseText = `CON Nominee: ${nominee.name}\nPrice: ${price} GHS/vote\nEnter number of votes:`;
            session = { 
              ...session, 
              step: 'VOTE_QUANTITY', 
              nomineeId: nominee.id, 
              nomineeName: nominee.name, 
              eventId: nominee.event_id, 
              organizerId,
              categoryId,
              price 
            };
          } else {
            responseText = "CON Nominee not found.\nEnter Nominee Code:";
          }
          break;

        case 'VOTE_QUANTITY':
          const votes = parseInt(userData);
          if (isNaN(votes) || votes <= 0) {
            responseText = "CON Invalid number.\nEnter number of votes:";
          } else {
            const total = votes * session.price;
            responseText = `CON Confirm ${votes} votes for ${session.nomineeName}\nTotal: ${total} GHS\n1. Confirm\n2. Cancel`;
            session = { ...session, step: 'CONFIRM_PAYMENT', quantity: votes, total };
          }
          break;

        case 'CONFIRM_PAYMENT':
          if (userData === '1') {
            try {
              const paystackRes = await initializePaystackCharge({
                email: `${msisdn}@asvote.ussd`,
                amount: Math.round(session.total * 100),
                currency: "GHS",
                mobile_money: {
                  phone: msisdn,
                  provider: network
                },
                metadata: {
                  ussd_session: sessionID,
                  voteData: {
                    voter_email: `${msisdn}@asvote.ussd`,
                    event_id: session.eventId,
                    organizer_id: session.organizerId,
                    nominee_id: session.type === 'vote' ? session.nomineeId : session.tierId,
                    category_id: session.categoryId,
                    votes: session.quantity,
                    amount: session.total,
                    type: session.type,
                    status: 'pending'
                  }
                }
              });

              if (paystackRes.status) {
                const typeLabel = session.type === 'vote' ? 'vote' : 'ticket';
                responseText = `END A payment prompt has been sent to your phone. Your ${typeLabel} will be recorded once paid. Thank you!`;
              } else {
                responseText = "END Payment initialization failed. Please try again later.";
              }
            } catch (e: any) {
              console.error("Paystack USSD Charge Error:", e.response?.data || e.message);
              responseText = "END Error initiating payment. Check your MoMo balance/connectivity.";
            }
            session = null;
          } else {
            responseText = "END Transaction cancelled.";
            session = null;
          }
          break;

        default:
          responseText = "END Session error. Please start again.";
          session = null;
      }

      if (session === null) {
        await supabase.from('ussd_sessions').delete().eq('id', sessionID);
      } else {
        await supabase.from('ussd_sessions').update({ 
          data: session,
          updated_at: new Date().toISOString()
        }).eq('id', sessionID);
      }
    }

    return new Response(responseText, {
      headers: { "Content-Type": "text/plain" },
    });
  } catch (err: any) {
    console.error("USSD Error:", err);
    if (sessionID) {
      await supabase.from('ussd_sessions').delete().eq('id', sessionID).catch(() => {});
    }
    return new Response("END An error occurred. Please try again.", {
      headers: { "Content-Type": "text/plain" },
    });
  }
}
export const dynamic = "force-dynamic";

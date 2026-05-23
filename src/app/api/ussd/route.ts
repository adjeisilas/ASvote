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
      responseText = "CON Welcome To ASVotes\n\n1.Vote for a Contestant\n2.Buy Event Ticket\n3.Retieve My Tickets\n4.Help & Support\n0. Exit";
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
            // Retrieve all live tickets
            const { data: liveEvents } = await supabase
              .from('events')
              .select('id, title, organizer_id')
              .eq('type', 'ticketing')
              .in('status', ['active', 'approved']);

            const eventIds = liveEvents?.map((e: any) => e.id) || [];
            if (eventIds.length === 0) {
              responseText = "END No active even available at this time.  Please try again.";
              session = null;
            } else {
              const { data: tiers } = await supabase
                .from('ticket_tiers')
                .select('id, name, price, event_id')
                .in('event_id', eventIds);

              if (!tiers || tiers.length === 0) {
                responseText = "END No active even available at this time.  Please try again.";
                session = null;
              } else {
                let tierList = "CON Select Ticket:\n";
                const mappedTiers = tiers.map((t: any) => {
                  const parentEvent = liveEvents.find((e: any) => e.id === t.event_id);
                  return {
                    ...t,
                    eventTitle: parentEvent?.title || "Event",
                    organizerId: parentEvent?.organizer_id
                  };
                });
                
                mappedTiers.forEach((t: any, i: number) => {
                  tierList += `${i + 1}. ${t.eventTitle} - ${t.name} (${t.price} GHS)\n`;
                });
                responseText = tierList;
                session = {
                  ...session,
                  step: 'LIVE_TICKET_SELECT',
                  type: 'ticket',
                  tiers: mappedTiers
                };
              }
            }
          } else if (userData === '3') {
            const msisdnUssdEmail = `${msisdn}@asvote.ussd`;
            // Fetch transactions
            const { data: txs } = await supabase
              .from('transactions')
              .select('id')
              .eq('status', 'success')
              .eq('type', 'ticket')
              .or(`voter_email.eq.${msisdn},voter_email.eq.${msisdnUssdEmail}`);

            const txIds = txs?.map((t: any) => t.id) || [];
            
            // also fetch tickets that might have ticket_holder_email equal to msisdn
            const [ticketsByNameEmailRes, ticketsByTxRes] = await Promise.all([
              supabase
                .from('tickets')
                .select('id, transaction_id, events(title), ticket_tiers(name), qr_code')
                .or(`ticket_holder_email.eq.${msisdn},ticket_holder_email.eq.${msisdnUssdEmail},ticket_holder_name.eq.${msisdn}`),
              txIds.length > 0
                ? supabase
                    .from('tickets')
                    .select('id, transaction_id, events(title), ticket_tiers(name), qr_code')
                    .in('transaction_id', txIds)
                : Promise.resolve({ data: [] })
            ]);

            const allTickets = [
              ...(ticketsByNameEmailRes.data || []),
              ...(ticketsByTxRes.data || [])
            ];

            // deduplicate by id
            const phoneTickets = Array.from(new Map(allTickets.map((t: any) => [t.id, t])).values());

            if (phoneTickets.length > 0) {
              let ticketMsg = `END Ticket(s) found and sent via SMS to ${msisdn}.\n\n`;
              phoneTickets.forEach((t: any, idx: number) => {
                const eventName = (t.events as any)?.title || "Event";
                const tierName = (t.ticket_tiers as any)?.name || "Ticket";
                ticketMsg += `${idx + 1}. ${eventName} - ${tierName}\nCode: ${t.qr_code}\n\n`;
              });
              if (ticketMsg.length > 250) {
                ticketMsg = ticketMsg.substring(0, 247) + "...";
              }
              responseText = ticketMsg;
            } else {
              responseText = `END No ticket found for this phone ${msisdn}.  Please try again.`;
            }
            session = null;
          } else if (userData === '4') {
            responseText = "END ASVotes Support.  \nFor assistance, contact:\nEmail: support@asvotes.com\nPhone: +233247558915\nVisit: www.asvotes.com";
            session = null;
          } else if (userData === '0') {
            responseText = "END Thank you for using ASVotes.";
            session = null;
          } else {
            responseText = "CON Invalid option.\n\nWelcome To ASVotes\n1.Vote for a Contestant\n2.Buy Event Ticket\n3.Retieve My Tickets\n4.Help & Support\n0. Exit";
          }
          break;

        case 'LIVE_TICKET_SELECT':
          const liveTierIdx = parseInt(userData) - 1;
          if (session.tiers && session.tiers[liveTierIdx]) {
            const selectedTier = session.tiers[liveTierIdx];
            responseText = `CON Tier: ${selectedTier.name}\nPrice: ${selectedTier.price} GHS\nEnter quantity:`;
            session = { 
              ...session, 
              step: 'TICKET_QUANTITY', 
              eventId: selectedTier.event_id,
              eventTitle: selectedTier.eventTitle,
              organizerId: selectedTier.organizerId,
              tierId: selectedTier.id, 
              tierName: selectedTier.name, 
              price: selectedTier.price,
              type: 'ticket'
            };
          } else {
            responseText = "CON Invalid tier selection.\nSelect Ticket:";
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
              session = { ...session, step: 'TICKET_TIER_SELECT', eventId: event.id, eventTitle: event.title, organizerId: event.organizer_id, tiers, type: 'ticket' };
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
            session = { ...session, step: 'TICKET_QUANTITY', tierId: selectedTier.id, tierName: selectedTier.name, price: selectedTier.price, type: 'ticket' };
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
            .select('id, name, code, event_id, events(organizer_id, status, voting_events(end_date)), voting_categories(id, vote_price)')
            .eq('code', userData.toUpperCase())
            .single();

          if (nominee) {
            const eventObj = Array.isArray(nominee.events) ? nominee.events[0] : nominee.events;
            const eventStatus = eventObj?.status;
            const rawVotingEvents = eventObj?.voting_events;
            const votingEventObj = Array.isArray(rawVotingEvents) ? rawVotingEvents[0] : rawVotingEvents;
            const endDateStr = votingEventObj?.end_date;

            let isEnded = false;
            if (eventStatus === 'ended') {
              isEnded = true;
            } else if (endDateStr && new Date(endDateStr) < new Date()) {
              isEnded = true;
            } else if (eventStatus !== 'active' && eventStatus !== 'approved') {
              isEnded = true;
            }

            if (isEnded) {
              responseText = "END Voting has ended.";
              session = null;
            } else {
              const category = Array.isArray(nominee.voting_categories) ? nominee.voting_categories[0] : nominee.voting_categories;
              const price = category?.vote_price || 1.0;
              const organizerId = eventObj?.organizer_id;
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
            }
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

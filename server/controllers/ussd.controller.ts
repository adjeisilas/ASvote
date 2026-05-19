import { Request, Response } from "express";
import { supabase } from "../lib/supabase.js";
import { initializePaystackCharge } from "../services/payment.service.js";

export const handleUSSD = async (req: Request, res: Response) => {
  const sessionID = req.body.sessionID || req.body.sessionId;
  const msisdn = req.body.msisdn || req.body.phoneNumber;
  const userDataRaw = req.body.userData || req.body.text || "";
  const network = req.body.network || req.body.networkCode || 'mtn';

  if (!sessionID || !msisdn) {
    console.error("USSD Error: Missing sessionID or MSISDN", req.body);
    return res.send("END Bad Request");
  }

  // Some providers (Africa's Talking) accumulate inputs: "1*2*NAM-01"
  // We only need the latest input if we're using our own state management
  const inputs = userDataRaw.split('*').filter((x: string) => x.trim().length > 0);
  const userData = inputs.length > 0 ? inputs[inputs.length - 1] : "";
  
  let session: any = { step: 'WELCOME' };
  
  try {
    // 0. Periodically cleanup stale sessions (older than 2 hours)
    supabase.from('ussd_sessions')
      .delete()
      .lt('updated_at', new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString())
      .then(({ error }: { error: any }) => { if (error) console.error("USSD Cleanup Error:", error); });

    // 1. Fetch current session from database
    const { data: dbSession } = await supabase
      .from('ussd_sessions')
      .select('data')
      .eq('id', sessionID)
      .single();
    
    if (dbSession) {
      session = dbSession.data;
    }

    let responseText = "";
    
    // Determine if it's a new session
    const isNewSession = !dbSession || req.body.newSession === true || req.body.newSession === "true" || (inputs.length === 0 && session.step === 'WELCOME');

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
                email: `${session.msisdn}@asvote.ussd`,
                amount: Math.round(session.total * 100),
                mobile_money: {
                  phone: session.msisdn,
                  provider: network || 'mtn'
                },
                metadata: {
                  ussd_session: sessionID,
                  voteData: {
                    voter_email: `${session.msisdn}@asvote.ussd`,
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

      // Update or delete session in DB
      if (session === null) {
        await supabase.from('ussd_sessions').delete().eq('id', sessionID);
      } else {
        await supabase.from('ussd_sessions').update({ 
          data: session,
          updated_at: new Date().toISOString()
        }).eq('id', sessionID);
      }
    }

    res.set('Content-Type', 'text/plain');
    res.send(responseText);
  } catch (err) {
    console.error("USSD Error:", err);
    res.set('Content-Type', 'text/plain');
    res.send("END An error occurred. Please try again.");
    await supabase.from('ussd_sessions').delete().eq('id', sessionID);
  }
};

import { supabase } from "../lib/supabase.js";
import crypto from "crypto";
import { sendTicketEmail } from "../lib/email.js";

export const processSuccessfulPayment = async (reference: string, voteData: any) => {
  // Check if transaction already exists to prevent double processing
  const { data: existingTx, error: existingCheckError } = await supabase
    .from('transactions')
    .select('id')
    .eq('paystack_ref', reference)
    .maybeSingle();

  if (existingCheckError) {
    console.error("Error checking for existing transaction:", existingCheckError);
    throw new Error(`Database check failed: ${existingCheckError.message}`);
  }

  if (existingTx) {
    console.log(`Transaction ${reference} already processed.`);
    return { success: true, alreadyProcessed: true };
  }

  const isTicketing = voteData.type === 'ticket';

  // Define allowed columns for transactions table
  const allowedColumns = [
    'voter_email', 'event_id', 'organizer_id', 
    'amount', 'type', 'status', 'paystack_ref', 
    'discount_applied', 'promo_code_id', 'commission', 'quantity', 'created_at'
  ];

  // Build safe object
  const safeTxData: any = {};
  Object.keys(voteData).forEach(key => {
    if (allowedColumns.includes(key)) {
      safeTxData[key] = voteData[key];
    }
  });
  
  if (voteData.votes && !safeTxData.quantity) {
    safeTxData.quantity = Number(voteData.votes);
  }
  
  if (safeTxData.amount) safeTxData.amount = Number(safeTxData.amount);
  if (safeTxData.commission) safeTxData.commission = Number(safeTxData.commission);
  if (safeTxData.discount_applied) safeTxData.discount_applied = Number(safeTxData.discount_applied);
  if (safeTxData.quantity) safeTxData.quantity = Number(safeTxData.quantity);
  
  safeTxData.paystack_ref = reference;
  safeTxData.status = 'success';

  const { data: transArr, error: transError } = await supabase
    .from('transactions')
    .insert([safeTxData])
    .select();

  if (transError) {
    console.error(`[${reference}] Transaction insert error:`, transError);
    // Log the actual payload that failed for easier debugging
    console.log(`[${reference}] Failed payload:`, JSON.stringify(safeTxData));
    throw new Error(`Database transaction recording failed: ${transError.message} (${transError.code || 'no code'})`);
  }

  const transactionRecord = transArr?.[0];
  const transactionId = transactionRecord?.id;

  if (isTicketing && transactionId && voteData.event_id) {
    const ticketCount = voteData.votes || 1;
    const tickets: any[] = [];
    const tierId = voteData.nominee_id; 
    
    for (let i = 0; i < ticketCount; i++) {
      tickets.push({
        transaction_id: transactionId,
        event_id: voteData.event_id,
        tier_id: tierId,
        ticket_holder_name: voteData.recipient_name,
        ticket_holder_email: voteData.voter_email,
        qr_code: crypto.randomBytes(8).toString('hex').toUpperCase(),
        checked_in: false,
        created_at: new Date().toISOString()
      });
    }
    
    const { data: createdTickets, error: ticketError } = await supabase
      .from('tickets')
      .insert(tickets)
      .select('*, ticket_tiers(name)');
      
    if (ticketError) {
      console.error("Error creating tickets:", ticketError);
    } else {
      // Send email
      const { data: eventData } = await supabase.from('events').select('title').eq('id', voteData.event_id).single();
      const { data: tierData } = tierId ? 
        await supabase.from('ticket_tiers').select('name').eq('id', tierId).single() : 
        { data: null };
      
      // Send email without awaiting to speed up response
      sendTicketEmail(
        voteData.voter_email, 
        eventData?.title || 'Unknown Event', 
        tierData?.name, 
        tickets
      ).catch(err => console.error("Background email sending failure:", err));
      
      console.log(`Email trigger initiated for ${voteData.voter_email}`);

      // Append tickets to record for response
      if (transactionRecord) {
        (transactionRecord as any).tickets = (createdTickets || []).map((t: any) => ({
          id: t.id,
          qrCode: t.qr_code,
          tierName: t.ticket_tiers?.name
        }));
      }
    }

    // Increment Tier and Event Sales
    try {
      if (tierId) {
        await supabase.rpc('increment_tier_sold_count', { row_id: tierId, tickets: ticketCount });
      }
      await supabase.rpc('increment_event_sales', { row_id: voteData.event_id, tickets: ticketCount });
    } catch (e) {
      console.error("Error incrementing counts:", e);
    }

  } else if (!isTicketing && transactionId && voteData.event_id) {
    // For Voting
    console.log("Recording vote transaction in DB...");
    const { error: voteTxErr } = await supabase
      .from('vote_transactions')
      .insert([{
        transaction_id: transactionId,
        nominee_id: voteData.nominee_id,
        category_id: voteData.category_id,
        vote_count: Number(voteData.votes)
      }]);
    
    if (voteTxErr) {
      console.error("Error recording vote_transactions:", voteTxErr);
      // We don't throw here to ensure the transaction record is still returned
    }

    // Increment Nominee and Event Votes
    const votesToIncrement = Number(voteData.votes || voteData.quantity || 1);
    console.log(`Incrementing votes (${votesToIncrement}) via RPC for nominee: ${voteData.nominee_id} and event: ${voteData.event_id}`);
    
    try {
      if (voteData.nominee_id) {
        const { error: rpcErr1 } = await supabase.rpc('increment_nominee_votes', { 
          row_id: voteData.nominee_id, 
          votes: votesToIncrement 
        });
        if (rpcErr1) console.error("RPC increment_nominee_votes failed:", rpcErr1.message);
      }
      
      const { error: rpcErr2 } = await supabase.rpc('increment_event_votes', { 
        row_id: voteData.event_id, 
        votes: votesToIncrement 
      });
      if (rpcErr2) console.error("RPC increment_event_votes failed:", rpcErr2.message);
    } catch (e) {
      console.error("Critical error during Voting RPC increment:", e);
    }
  }

  return { success: true, transaction: transactionRecord };
};

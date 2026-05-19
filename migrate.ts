import { initializeApp } from 'firebase/app';
import { getFirestore, collection, getDocs, getDocsFromServer } from 'firebase/firestore';
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { join } from 'path';

dotenv.config();

const firebaseConfig = JSON.parse(readFileSync(join(process.cwd(), 'firebase-applet-config.json'), 'utf8'));

const firebaseApp = initializeApp(firebaseConfig);
const db = getFirestore(firebaseApp, firebaseConfig.firestoreDatabaseId);

const supabaseUrl = process.env.VITE_SUPABASE_URL || '';
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseUrl || !supabaseKey) {
  console.error("Missing Supabase credentials in .env");
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function migrate() {
  console.log("Starting migration...");

  // 1. Users -> Profiles
  console.log("Migrating users...");
  const usersSnap = await getDocs(collection(db, 'users'));
  for (const doc of usersSnap.docs) {
    const data = doc.data();
    const { error } = await supabase.from('profiles').upsert({
      id: doc.id,
      email: data.email,
      display_name: data.displayName,
      role: data.role,
      status: data.status,
      phone_number: data.phoneNumber,
      created_at: data.createdAt,
      updated_at: data.updatedAt || data.createdAt
    });
    if (error) console.error(`Error migrating user ${doc.id}:`, error);
  }

  // 2. Events
  console.log("Migrating events...");
  const eventsSnap = await getDocs(collection(db, 'events'));
  for (const doc of eventsSnap.docs) {
    const data = doc.data();
    const { error } = await supabase.from('events').upsert({
      id: doc.id,
      organizer_id: data.organizerId,
      title: data.title,
      description: data.description,
      type: data.type,
      status: data.status,
      commission: data.commission,
      start_date: data.startDate,
      end_date: data.endDate,
      cover_image: data.coverImage,
      tags: data.tags,
      total_votes: data.totalVotes || 0,
      created_at: data.createdAt,
      updated_at: data.updatedAt || data.createdAt
    });
    if (error) {
      console.error(`Error migrating event ${doc.id}:`, error);
      continue;
    }

    // Subcollections: Categories
    console.log(`Migrating categories for event ${doc.id}...`);
    const catsSnap = await getDocs(collection(db, `events/${doc.id}/categories`));
    for (const cDoc of catsSnap.docs) {
      const cData = cDoc.data();
      const { error: cError } = await supabase.from('categories').upsert({
        id: cDoc.id,
        event_id: doc.id,
        name: cData.name,
        description: cData.description,
        vote_price: cData.votePrice
      });
      if (cError) console.error(`Error migrating category ${cDoc.id}:`, cError);
    }

    // Subcollections: Nominees
    console.log(`Migrating nominees for event ${doc.id}...`);
    const nomsSnap = await getDocs(collection(db, `events/${doc.id}/nominees`));
    for (const nDoc of nomsSnap.docs) {
      const nData = nDoc.data();
      const { error: nError } = await supabase.from('nominees').upsert({
        id: nDoc.id,
        event_id: doc.id,
        category_id: nData.categoryId,
        name: nData.name,
        code: nData.code,
        image_url: nData.imageUrl,
        description: nData.description,
        vote_count: nData.voteCount || 0,
        created_at: nData.createdAt || data.createdAt
      });
      if (nError) console.error(`Error migrating nominee ${nDoc.id}:`, nError);
    }
  }

  // 3. Transactions
  console.log("Migrating transactions...");
  const transSnap = await getDocs(collection(db, 'transactions'));
  for (const doc of transSnap.docs) {
    const data = doc.data();
    const { error } = await supabase.from('transactions').upsert({
      id: doc.id,
      voter_email: data.voterEmail,
      event_id: data.eventId,
      organizer_id: data.organizerId,
      category_id: data.categoryId,
      nominee_id: data.nomineeId,
      amount: data.amount,
      votes: data.votes,
      type: data.type,
      status: data.status,
      commission: data.commission,
      paystack_ref: data.paystackRef,
      timestamp: data.timestamp
    });
    if (error) console.error(`Error migrating transaction ${doc.id}:`, error);
  }

  // 4. Withdrawals
  console.log("Migrating withdrawals...");
  const withdrawalsSnap = await getDocs(collection(db, 'withdrawals'));
  for (const doc of withdrawalsSnap.docs) {
    const data = doc.data();
    const { error } = await supabase.from('withdrawals').upsert({
      id: doc.id,
      organizer_id: data.organizerId,
      amount: data.amount,
      status: data.status,
      timestamp: data.timestamp || data.createdAt,
      tx_ref: data.txRef,
      bank_code: data.bankCode,
      account_number: data.accountNumber,
      account_name: data.accountName,
      processed_by: data.processedBy,
      processed_at: data.processedAt
    });
    if (error) console.error(`Error migrating withdrawal ${doc.id}:`, error);
  }

  // 5. Notifications
  console.log("Migrating notifications...");
  const notesSnap = await getDocs(collection(db, 'notifications'));
  for (const doc of notesSnap.docs) {
    const data = doc.data();
    const { error } = await supabase.from('notifications').upsert({
      id: doc.id,
      user_id: data.userId,
      title: data.title,
      message: data.message,
      type: data.type,
      read: data.read,
      timestamp: data.timestamp || data.createdAt
    });
    if (error) console.error(`Error migrating notification ${doc.id}:`, error);
  }

  console.log("Migration complete!");
}

migrate().catch(err => {
  console.error("Migration failed:", err);
  process.exit(1);
});

/**
 * Backfill script: rebuilds aggregates/daily and aggregates/summary from
 * existing /tickets data.
 *
 * Why this is needed:
 * The onTicketCreate trigger (functions/adminFunctions.js) was never actually
 * deployed, because functions/index.js only did `require('./adminFunctions')`
 * instead of re-exporting its functions. That means every ticket sold before
 * the fix landed never updated aggregates/daily or aggregates/summary, so the
 * admin sales chart and dashboard totals were built from empty data.
 *
 * This script walks /tickets once and reconstructs those aggregates so
 * historical sales show up immediately. Run it once, right after deploying
 * the index.js fix. New tickets going forward will be aggregated live by the
 * (now correctly deployed) trigger.
 *
 * Usage:
 *   This uses the SAME credentials your Render server already uses (see
 *   server/server.js: buildFirebaseCredential), instead of a downloaded
 *   service account JSON file. Set these env vars before running (you can
 *   copy the values straight from Render > your service > Environment tab):
 *
 *     FIREBASE_PROJECT_ID
 *     FIREBASE_CLIENT_EMAIL
 *     FIREBASE_PRIVATE_KEY   (keep the \n escapes as stored in Render)
 *     FIREBASE_DATABASE_URL
 *
 *   Then run:
 *        node scripts/backfill-aggregates.cjs
 *      Add --dry-run to preview without writing:
 *        node scripts/backfill-aggregates.cjs --dry-run
 *
 *   Alternative: if you'd rather use a downloaded service account JSON key
 *   instead, set SERVICE_ACCOUNT_PATH to point at it and this script will
 *   use that instead of the three FIREBASE_* env vars above.
 */

require('dotenv').config();
const admin = require('firebase-admin');
const { getDatabase } = require('firebase-admin/database');

const DATABASE_URL = process.env.FIREBASE_DATABASE_URL;
const DRY_RUN = process.argv.includes('--dry-run');

function buildCredential() {
  // Option 1: explicit service account JSON file (optional, not required)
  if (process.env.SERVICE_ACCOUNT_PATH) {
    try {
      const serviceAccount = require(process.env.SERVICE_ACCOUNT_PATH);
      return admin.cert(serviceAccount);
    } catch (err) {
      console.error(`Could not load service account key at ${process.env.SERVICE_ACCOUNT_PATH}`);
      process.exit(1);
    }
  }

  // Option 2 (default): same three env vars server/server.js uses
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return admin.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // Same unescaping server.js does, since Render stores the key with
      // literal \n instead of real newlines.
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }

  console.error('Missing credentials. Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL and');
  console.error('FIREBASE_PRIVATE_KEY (copy from Render), or set SERVICE_ACCOUNT_PATH to a');
  console.error('downloaded service account JSON file instead.');
  process.exit(1);
}

function init() {
  if (!DATABASE_URL) {
    console.error('Set FIREBASE_DATABASE_URL env var, e.g.');
    console.error('  set FIREBASE_DATABASE_URL=https://novaekoevents-default-rtdb.firebaseio.com');
    process.exit(1);
  }

  admin.initializeApp({
    credential: buildCredential(),
    databaseURL: DATABASE_URL,
  });
}

async function backfill() {
  const db = getDatabase();

  console.log('Fetching /tickets ...');
  const ticketsSnap = await db.ref('tickets').once('value');
  const tickets = ticketsSnap.val() || {};
  const ticketEntries = Object.values(tickets);
  console.log(`Found ${ticketEntries.length} tickets.`);

  // --- Rebuild aggregates/daily ---
  const daily = {}; // { 'YYYY-MM-DD': { total, tickets } }

  // --- Rebuild aggregates/summary ---
  let totalTicketsSold = 0;
  let totalRevenue = 0;
  const uniqueEmailHashes = new Set();
  const crypto = require('crypto');

  for (const ticket of ticketEntries) {
    const totalPaid = Number(ticket.totalPaid || ticket.totalCharged || 0);
    const quantity = Number(ticket.quantity || 1);

    // Daily bucket, mirrors onTicketCreate's date handling
    const d = new Date(Number(ticket.timestamp) || Date.now());
    d.setHours(0, 0, 0, 0);
    const iso = d.toISOString().slice(0, 10);

    if (!daily[iso]) daily[iso] = { total: 0, tickets: 0 };
    daily[iso].total += totalPaid;
    daily[iso].tickets += quantity;

    totalTicketsSold += quantity;
    totalRevenue += totalPaid;

    const email = (ticket.email || '').trim().toLowerCase();
    if (email) {
      uniqueEmailHashes.add(crypto.createHash('sha256').update(email).digest('hex'));
    }
  }

  const uniqueAttendees = uniqueEmailHashes.size;

  console.log(`Computed ${Object.keys(daily).length} daily buckets.`);
  console.log(`totalTicketsSold=${totalTicketsSold} totalRevenue=${totalRevenue} uniqueAttendees=${uniqueAttendees}`);

  if (DRY_RUN) {
    console.log('\n--dry-run set, not writing anything. Sample of daily buckets:');
    console.log(JSON.stringify(daily, null, 2).slice(0, 2000));
    return;
  }

  console.log('\nWriting aggregates/daily ...');
  await db.ref('aggregates/daily').set(daily);

  console.log('Writing aggregates/summary (merging, not clobbering unrelated fields) ...');
  await db.ref('aggregates/summary').update({
    totalTicketsSold,
    totalRevenue,
    uniqueAttendees,
  });

  // Also seed aggregates/uniqueHashes so future onTicketCreate runs don't
  // double-count attendees already counted here.
  console.log('Writing aggregates/uniqueHashes ...');
  const uniqueHashesUpdate = {};
  uniqueEmailHashes.forEach((hash) => {
    uniqueHashesUpdate[hash] = { firstSeen: Date.now(), backfilled: true };
  });
  await db.ref('aggregates/uniqueHashes').update(uniqueHashesUpdate);

  console.log('\nDone.');
}

(async () => {
  init();
  try {
    await backfill();
  } catch (err) {
    console.error('Backfill failed:', err);
    process.exitCode = 1;
  } finally {
    process.exit();
  }
})();

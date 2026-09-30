/**
 * Repairs missing event/host metadata on existing /tickets records.
 *
 * Preview first:
 *   node scripts/backfill-ticket-metadata.cjs
 *
 * Apply changes:
 *   node scripts/backfill-ticket-metadata.cjs --apply
 *
 * Required environment variables are the same as the server:
 *   FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY,
 *   FIREBASE_DATABASE_URL
 */

try {
  require("dotenv").config();
} catch {
  // Environment variables can also be supplied directly by the shell.
}
const admin = require("firebase-admin");

const APPLY = process.argv.includes("--apply");
const databaseUrl = process.env.FIREBASE_DATABASE_URL;

function buildCredential() {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (!FIREBASE_PROJECT_ID || !FIREBASE_CLIENT_EMAIL || !FIREBASE_PRIVATE_KEY) {
    throw new Error(
      "Set FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, and FIREBASE_PRIVATE_KEY."
    );
  }

  return admin.credential.cert({
    projectId: FIREBASE_PROJECT_ID,
    clientEmail: FIREBASE_CLIENT_EMAIL,
    privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, "\n"),
  });
}

function normalize(value) {
  return String(value || "").trim().toLowerCase();
}

function firstValue(...values) {
  return values.find((value) => String(value || "").trim()) || "";
}

function eventMatchesTicket(eventKey, event, ticket) {
  const ticketEventId = firstValue(
    ticket.eventId,
    ticket.event_id,
    ticket.eventID,
    ticket.eventid
  );
  if (ticketEventId) return eventKey === ticketEventId || event.id === ticketEventId;

  const ticketTitle = normalize(firstValue(ticket.eventTitle, ticket.event_title));
  if (!ticketTitle || normalize(event.title) !== ticketTitle) return false;

  const ticketHostEmail = normalize(firstValue(ticket.hostEmail, ticket.host_email));
  const eventHostEmail = normalize(firstValue(event.hostEmail, event.createdBy));
  if (ticketHostEmail && eventHostEmail && ticketHostEmail !== eventHostEmail) return false;

  const ticketHostUid = normalize(firstValue(ticket.hostUid, ticket.host_uid));
  const eventHostUid = normalize(firstValue(event.hostUid, event.ownerUid));
  if (ticketHostUid && eventHostUid && ticketHostUid !== eventHostUid) return false;

  return true;
}

function buildUpdate(ticket, eventKey, event) {
  const eventId = firstValue(ticket.eventId, ticket.event_id, eventKey);
  const eventTitle = firstValue(ticket.eventTitle, ticket.event_title, event.title);
  const hostEmail = firstValue(
    ticket.hostEmail,
    ticket.host_email,
    event.hostEmail,
    event.createdBy
  );
  const hostUid = firstValue(
    ticket.hostUid,
    ticket.host_uid,
    event.hostUid,
    event.ownerUid
  );
  const update = {};

  if (!ticket.eventId && eventId) update.eventId = eventId;
  if (!ticket.event_id && eventId) update.event_id = eventId;
  if (!ticket.eventTitle && eventTitle) update.eventTitle = eventTitle;
  if (!ticket.event_title && eventTitle) update.event_title = eventTitle;
  if (!ticket.hostEmail && hostEmail) update.hostEmail = hostEmail;
  if (!ticket.host_email && hostEmail) update.host_email = hostEmail;
  if (!ticket.hostUid && hostUid) update.hostUid = hostUid;
  if (!ticket.host_uid && hostUid) update.host_uid = hostUid;

  return update;
}

async function main() {
  if (!databaseUrl) throw new Error("Set FIREBASE_DATABASE_URL.");

  admin.initializeApp({
    credential: buildCredential(),
    databaseURL: databaseUrl,
  });

  const db = admin.database();
  const [ticketsSnapshot, eventsSnapshot] = await Promise.all([
    db.ref("tickets").once("value"),
    db.ref("events").once("value"),
  ]);
  const tickets = ticketsSnapshot.val() || {};
  const events = eventsSnapshot.val() || {};
  const updates = [];
  let repaired = 0;
  let complete = 0;
  let skipped = 0;

  for (const [ticketKey, ticket] of Object.entries(tickets)) {
    const matches = Object.entries(events).filter(([eventKey, event]) =>
      eventMatchesTicket(eventKey, event || {}, ticket || {})
    );

    if (matches.length !== 1) {
      if (matches.length === 0) skipped += 1;
      else console.warn(`Skipped ambiguous ticket ${ticketKey}: matched ${matches.length} events.`);
      continue;
    }

    const [eventKey, event] = matches[0];
    const update = buildUpdate(ticket, eventKey, event || {});
    if (Object.keys(update).length === 0) {
      complete += 1;
      continue;
    }

    repaired += 1;
    updates.push({ ticketKey, update });
    console.log(`${APPLY ? "Repairing" : "Would repair"} ${ticketKey}:`, update);
  }

  console.log(`\nComplete: ${complete}`);
  console.log(`Repairable: ${repaired}`);
  console.log(`Skipped without one exact event match: ${skipped}`);

  if (!APPLY) {
    console.log("\nDry run only. Re-run with --apply to write these changes.");
    return;
  }

  if (repaired > 0) {
    await Promise.all(
      updates.map(({ ticketKey, update }) => db.ref(`tickets/${ticketKey}`).update(update))
    );
  }
  console.log("\nTicket metadata backfill complete.");
}

main()
  .catch((error) => {
    console.error("Ticket metadata backfill failed:", error.message);
    process.exitCode = 1;
  })
  .finally(() => {
    if (admin.apps.length) return admin.app().delete();
  });

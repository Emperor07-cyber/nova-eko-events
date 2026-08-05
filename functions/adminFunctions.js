const functions = require('firebase-functions');
const admin = require('firebase-admin');

// helper to validate Authorization: Bearer <idToken> and ensure user role=admin
async function verifyAdminRequest(req) {
  const authHeader = req.get('Authorization') || req.get('authorization') || '';
  const match = authHeader.match(/Bearer\s+(.*)/i);
  if (!match) throw new Error('Missing token');
  const idToken = match[1];
  const decoded = await admin.auth().verifyIdToken(idToken);
  // Accept if custom claim 'admin' is present
  if (decoded.admin === true) return decoded;
  const snapshot = await admin.database().ref(`users/${decoded.uid}`).once('value');
  const data = snapshot.val();
  if (!data || data.role !== 'admin') throw new Error('Forbidden');
  return decoded;
}

// admin endpoints for cloud functions
exports.adminSummary = functions.https.onRequest(async (req, res) => {
  try {
    await verifyAdminRequest(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  try {
    const db = admin.database();
    // Prefer cached aggregates when available
    const aggregatesSnap = await db.ref('aggregates/summary').once('value');
    const aggregates = aggregatesSnap.val();
    if (aggregates) return res.json(aggregates);

    const [eventsSnap, ticketsSnap, withdrawalsSnap] = await Promise.all([
      db.ref('events').once('value'),
      db.ref('tickets').once('value'),
      db.ref('withdrawalRequests').once('value'),
    ]);

    const events = eventsSnap.val() || {};
    const tickets = ticketsSnap.val() || {};
    const withdrawals = withdrawalsSnap.val() || {};

    const totalEvents = Object.keys(events).length;
    const ticketEntries = Object.values(tickets);
    const totalTicketsSold = ticketEntries.reduce((s, t) => s + (t.quantity || 1), 0);
    const totalRevenue = ticketEntries.reduce((s, t) => s + (t.totalPaid || t.totalCharged || 0), 0);
    const uniqueAttendees = new Set(ticketEntries.map(t => t.email)).size;
    const platformRevenue = ticketEntries.reduce((s, t) => s + ((t.hostFee || 0) + (t.serviceFee || 0)), 0);
    const totalPaidOut = Object.values(withdrawals).filter(w => w.status === 'completed').reduce((s, w) => s + (w.amount || 0), 0);
    const pendingWithdrawals = Object.values(withdrawals).filter(w => w.status === 'pending').length;

    res.json({ totalEvents, totalTicketsSold, totalRevenue, uniqueAttendees, platformRevenue, totalPaidOut, pendingWithdrawals });
  } catch (error) {
    console.error('functions.adminSummary error', error);
    res.status(500).json({ error: 'Failed to compute summary' });
  }
});

exports.salesTrend = functions.https.onRequest(async (req, res) => {
  try {
    await verifyAdminRequest(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  const days = Number(req.query.days) || 30;
  try {
    const db = admin.database();
    const dailySnap = await db.ref('aggregates/daily').once('value');
    const daily = dailySnap.val() || {};
    const entries = [];
    for (let i = days - 1; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      d.setHours(0,0,0,0);
      const iso = d.toISOString().slice(0,10);
      entries.push({ date: iso, total: daily[iso]?.total || 0 });
    }

    res.json(entries);
  } catch (error) {
    console.error('functions.salesTrend error', error);
    res.status(500).json({ error: 'Failed to compute sales trend' });
  }
});

exports.hostsTop = functions.https.onRequest(async (req, res) => {
  try {
    await verifyAdminRequest(req);
  } catch (err) {
    return res.status(401).json({ error: err.message });
  }

  const n = Number(req.query.n) || 10;
  try {
    const db = admin.database();
    const [ticketsSnap, withdrawalsSnap] = await Promise.all([
      db.ref('tickets').once('value'),
      db.ref('withdrawalRequests').once('value'),
    ]);
    const tickets = ticketsSnap.val() || {};
    const withdrawals = withdrawalsSnap.val() || {};

    const byHost = {};
    Object.values(tickets).forEach(t => {
      const host = t.hostEmail || 'Unknown';
      if (!byHost[host]) byHost[host] = { hostEmail: host, totalEarned: 0, tickets: 0, withdrawn: 0 };
      byHost[host].totalEarned += (t.totalPaid || 0);
      byHost[host].tickets += (t.quantity || 1);
    });

    Object.values(withdrawals).filter(w => w.status === 'completed').forEach(w => {
      const host = w.hostEmail || 'Unknown';
      if (byHost[host]) byHost[host].withdrawn += (w.amount || 0);
    });

    const arr = Object.values(byHost).map(h => ({ ...h, stillOwed: Math.max(0, h.totalEarned - h.withdrawn) }))
      .sort((a,b) => b.totalEarned - a.totalEarned)
      .slice(0, n);

    res.json(arr);
  } catch (error) {
    console.error('functions.hostsTop error', error);
    res.status(500).json({ error: 'Failed to compute hosts breakdown' });
  }
});

// Database trigger: on ticket create, update aggregates.summary and aggregates/daily/{YYYY-MM-DD}
exports.onTicketCreate = functions.database.ref('/tickets/{ticketId}').onCreate(async (snapshot, context) => {
  try {
    const ticket = snapshot.val();
    const db = admin.database();
    const totalPaid = Number(ticket.totalPaid || ticket.totalCharged || 0);
    const quantity = Number(ticket.quantity || 1);

    // Update summary totals using transactions
    await db.ref('aggregates/summary/totalTicketsSold').transaction(current => (current || 0) + quantity);
    await db.ref('aggregates/summary/totalRevenue').transaction(current => (current || 0) + totalPaid);

    // Update daily aggregate
    const d = new Date(Number(ticket.timestamp) || Date.now());
    d.setHours(0,0,0,0);
    const iso = d.toISOString().slice(0,10);
    const dailyRef = db.ref(`aggregates/daily/${iso}`);

    await dailyRef.transaction(current => {
      current = current || { total: 0, tickets: 0 };
      current.total = (current.total || 0) + totalPaid;
      current.tickets = (current.tickets || 0) + quantity;
      return current;
    });

    // Unique attendee aggregation (privacy-aware): store hashed email keys globally
    try {
      const email = (ticket.email || '').trim().toLowerCase();
      if (email) {
        const crypto = require('crypto');
        const hash = crypto.createHash('sha256').update(email).digest('hex');
        const uniqueRef = db.ref(`aggregates/uniqueHashes/${hash}`);
        const snap = await uniqueRef.once('value');
        if (!snap.exists()) {
          // mark as seen and increment global uniqueAttendees counter
          await uniqueRef.set({ firstSeen: Date.now() });
          await db.ref('aggregates/summary/uniqueAttendees').transaction(current => (current || 0) + 1);
        }
      }
    } catch (e) {
      console.error('unique attendee aggregation failed', e);
    }

    return null;
  } catch (err) {
    console.error('onTicketCreate error', err);
    return null;
  }
});
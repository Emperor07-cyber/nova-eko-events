const admin = require('firebase-admin');

// initialize firebase-admin here if not already initialized by server.js
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
} catch (err) {
  console.warn('firebase-admin init warning (admin-routes):', err.message);
}

// helper middleware to verify Firebase ID token and admin role
async function verifyAdminMiddleware(req, res, next) {
  try {
    const authHeader = req.get('Authorization') || req.get('authorization') || '';
    const match = authHeader.match(/Bearer\s+(.*)/i);
    if (!match) return res.status(401).json({ error: 'Missing Authorization token' });
    const idToken = match[1];
    const decoded = await admin.auth().verifyIdToken(idToken);

    // If token has custom claim admin:true accept it
    if (decoded.admin === true) {
      req.user = decoded;
      return next();
    }

    // Otherwise check user's role in realtime database
    const userRef = admin.database().ref(`users/${decoded.uid}`);
    const snapshot = await userRef.once('value');
    const data = snapshot.val();
    if (!data || data.role !== 'admin') return res.status(403).json({ error: 'Forbidden' });
    req.user = decoded;
    next();
  } catch (err) {
    console.error('verifyAdminMiddleware error', err);
    res.status(401).json({ error: 'Invalid token' });
  }
}

module.exports = (app) => {
  app.get('/admin/summary', verifyAdminMiddleware, async (req, res) => {
    try {
      const db = admin.database();
      // Prefer pre-aggregated values if present
      const aggregatesSnap = await db.ref('aggregates/summary').once('value');
      const aggregates = aggregatesSnap.val();
      if (aggregates) {
        return res.json(aggregates);
      }

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
    } catch (err) {
      console.error('admin/summary error', err);
      res.status(500).json({ error: 'Failed to compute summary' });
    }
  });

  app.get('/admin/sales-trend', verifyAdminMiddleware, async (req, res) => {
    const days = Number(req.query.days) || 30;
    try {
      const db = admin.database();
      // Prefer pre-aggregated daily values if present
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
      return res.json(entries);
    } catch (err) {
      console.error('admin/sales-trend error', err);
      res.status(500).json({ error: 'Failed to compute sales trend' });
    }
  });

  app.get('/admin/hosts/top', verifyAdminMiddleware, async (req, res) => {
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
    } catch (err) {
      console.error('admin/hosts/top error', err);
      res.status(500).json({ error: 'Failed to compute hosts breakdown' });
    }
  });

  // Admin action audit endpoint
  app.post('/admin/audit', verifyAdminMiddleware, async (req, res) => {
    try {
      const { action, details } = req.body || {};
      if (!action) return res.status(400).json({ error: 'Missing action' });
      const db = admin.database();
      const entry = {
        uid: req.user.uid,
        action,
        details: details || {},
        timestamp: Date.now(),
      };
      await db.ref('adminAudit').push(entry);
      res.json({ success: true });
    } catch (err) {
      console.error('admin/audit error', err);
      res.status(500).json({ error: 'Failed to write audit entry' });
    }
  });

  // Transactions/withdrawals endpoint
  app.get('/admin/transactions', verifyAdminMiddleware, async (req, res) => {
    try {
      const db = admin.database();
      const [withdrawalsSnap, ticketsSnap] = await Promise.all([
        db.ref('withdrawalRequests').once('value'),
        db.ref('tickets').once('value'),
      ]);

      const withdrawals = withdrawalsSnap.val() || {};
      const tickets = ticketsSnap.val() || {};

      const withdrawalArr = Object.entries(withdrawals).map(([id, w]) => ({ id, ...w }));

      // Convert tickets into simple transaction records
      const ticketTx = Object.entries(tickets).map(([id, t]) => ({
        id,
        reference: t.transactionId || id,
        type: 'Ticket Sale',
        description: t.eventTitle || t.ticketType || 'Ticket',
        amount: t.totalPaid || t.totalCharged || 0,
        date: t.timestamp || 0,
        status: 'Success',
      }));

      // Latest transactions first
      ticketTx.sort((a,b) => (b.date || 0) - (a.date || 0));

      res.json({ withdrawals: withdrawalArr, transactions: ticketTx.slice(0, 200) });
    } catch (err) {
      console.error('admin/transactions error', err);
      res.status(500).json({ error: 'Failed to fetch transactions' });
    }
  });
};

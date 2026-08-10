const axios = require("axios");
const admin = require("firebase-admin");
const { loadEventById, sendTicketReceiptEmail } = require("./emailService");

try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
} catch (err) {
  console.warn("firebase-admin init warning (admin-routes):", err.message);
}

const db = () => admin.database();

const normalizeText = (value) => String(value || "").trim().toLowerCase();
const sanitizeNumber = (value) => {
  const cleaned = String(value ?? "").replace(/,/g, "");
  const parsed = Number(cleaned);
  return Number.isFinite(parsed) ? parsed : 0;
};

const getBearerToken = (req) => {
  const authHeader = req.get("Authorization") || req.get("authorization") || "";
  const match = authHeader.match(/Bearer\s+(.*)/i);
  return match ? match[1] : "";
};

const hasAdminAccess = async (decoded) => {
  if (decoded?.admin === true) {
    return true;
  }

  const snapshot = await db().ref(`users/${decoded.uid}`).once("value");
  const data = snapshot.val();
  return data?.role === "admin";
};

async function verifyAdminMiddleware(req, res, next) {
  try {
    const idToken = getBearerToken(req);
    if (!idToken) {
      return res.status(401).json({ error: "Missing Authorization token" });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    if (!(await hasAdminAccess(decoded))) {
      return res.status(403).json({ error: "Forbidden" });
    }

    req.user = decoded;
    next();
  } catch (err) {
    console.error("verifyAdminMiddleware error", err);
    res.status(401).json({ error: "Invalid token" });
  }
}

async function verifyAuthenticatedMiddleware(req, res, next) {
  try {
    const idToken = getBearerToken(req);
    if (!idToken) {
      return res.status(401).json({ error: "Missing Authorization token" });
    }

    const decoded = await admin.auth().verifyIdToken(idToken);
    const userSnap = await db().ref(`users/${decoded.uid}`).once("value");

    req.user = decoded;
    req.userRecord = userSnap.val() || {};
    next();
  } catch (err) {
    console.error("verifyAuthenticatedMiddleware error", err);
    res.status(401).json({ error: "Invalid token" });
  }
}

const readRecordByTransactionId = async (collection, reference) => {
  const snapshot = await db().ref(collection).once("value");
  const data = snapshot.val() || {};
  const entry = Object.entries(data).find(([, record]) => {
    const possibleRefs = [
      record.transactionId,
      record.reference,
      record.paystackReference,
      record.paystackRef,
    ].map(normalizeText);
    return possibleRefs.includes(normalizeText(reference));
  });

  if (!entry) {
    return null;
  }

  const [id, record] = entry;
  return { id, ...record, collection };
};

const matchHostRecord = (record, hostEmail, hostUid) => {
  const recordHostEmail = normalizeText(
    record.hostEmail || record.requestedByEmail || record.createdBy || record.email
  );
  const recordHostUid = normalizeText(
    record.hostUid || record.requestedByUid || record.ownerUid || record.uid
  );

  return (
    (hostEmail && recordHostEmail === hostEmail) ||
    (hostUid && recordHostUid === hostUid)
  );
};

const calculateHostBalance = async (hostEmail, hostUid) => {
  const [ticketsSnap, merchSnap, withdrawalsSnap] = await Promise.all([
    db().ref("tickets").once("value"),
    db().ref("merchOrders").once("value"),
    db().ref("withdrawalRequests").once("value"),
  ]);

  const tickets = ticketsSnap.val() || {};
  const merchOrders = merchSnap.val() || {};
  const withdrawals = withdrawalsSnap.val() || {};

  const ticketTotal = Object.values(tickets)
    .filter((ticket) => matchHostRecord(ticket, hostEmail, hostUid))
    .reduce((sum, ticket) => sum + sanitizeNumber(ticket.totalPaid || ticket.hostFee || 0), 0);

  const merchTotal = Object.values(merchOrders)
    .filter((order) => matchHostRecord(order, hostEmail, hostUid))
    .reduce((sum, order) => sum + sanitizeNumber(order.hostFee || order.totalPaid || 0), 0);

  const withdrawnTotal = Object.values(withdrawals)
    .filter((request) =>
      matchHostRecord(request, hostEmail, hostUid) &&
      (request.status === "completed" || request.status === "approved")
    )
    .reduce((sum, request) => sum + sanitizeNumber(request.amount), 0);

  const gross = ticketTotal + merchTotal;
  return {
    gross,
    withdrawn: withdrawnTotal,
    balance: Math.max(0, gross - withdrawnTotal),
  };
};

module.exports = (app) => {
  app.post("/checkin/ticket", async (req, res) => {
    try {
      const { ticketId, eventId, accessCode } = req.body || {};
      if (!ticketId || !eventId || !accessCode) {
        return res.status(400).json({ error: "Missing check-in data" });
      }

      const [eventSnap, ticketSnap] = await Promise.all([
        db().ref(`events/${eventId}`).once("value"),
        db().ref(`tickets/${ticketId}`).once("value"),
      ]);

      if (!eventSnap.exists()) {
        return res.status(404).json({ error: "Event not found" });
      }

      const event = eventSnap.val() || {};
      if (String(event.scannerCode || "").toUpperCase() !== String(accessCode).trim().toUpperCase()) {
        return res.status(403).json({ error: "Invalid access code" });
      }

      if (!ticketSnap.exists()) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      const ticket = ticketSnap.val() || {};
      if (String(ticket.eventId || "") !== String(eventId)) {
        return res.status(400).json({ error: "Ticket is for a different event" });
      }

      if (ticket.checkedIn) {
        return res.status(409).json({
          error: "Ticket already checked in",
          alreadyCheckedIn: true,
          checkedInAt: ticket.checkedInAt || null,
        });
      }

      await db().ref(`tickets/${ticketId}`).update({
        checkedIn: true,
        checkedInAt: Date.now(),
        checkedInBy: "scanner",
      });

      res.json({
        success: true,
        ticket: {
          id: ticketId,
          ...ticket,
          checkedIn: true,
          checkedInAt: Date.now(),
        },
      });
    } catch (err) {
      console.error("checkin/ticket error", err);
      res.status(500).json({ error: "Failed to check in ticket" });
    }
  });

  app.post("/payments/verify", async (req, res) => {
    try {
      const { reference, kind } = req.body || {};
      if (!reference) {
        return res.status(400).json({ error: "Missing payment reference" });
      }

      const secret = process.env.PAYSTACK_SECRET_KEY;
      if (!secret) {
        return res.status(500).json({ error: "Paystack secret key is not configured" });
      }

      const verifyResponse = await axios.get(
        `https://api.paystack.co/transaction/verify/${encodeURIComponent(reference)}`,
        {
          headers: {
            Authorization: `Bearer ${secret}`,
          },
        }
      );

      const payload = verifyResponse.data || {};
      const paystackData = payload.data || {};

      if (!payload.status || paystackData.status !== "success") {
        return res.status(400).json({
          verified: false,
          error: payload.message || "Transaction is not successful",
        });
      }

      const [ticketRecord, merchRecord] = await Promise.all([
        readRecordByTransactionId("tickets", reference),
        readRecordByTransactionId("merchOrders", reference),
      ]);

      const matchedRecord =
        kind === "merch"
          ? merchRecord || ticketRecord
          : kind === "ticket"
            ? ticketRecord || merchRecord
            : ticketRecord || merchRecord;

      return res.json({
        verified: true,
        found: Boolean(matchedRecord),
        kind: matchedRecord?.collection === "merchOrders" ? "merch" : matchedRecord?.collection === "tickets" ? "ticket" : kind || null,
        record: matchedRecord,
        paystack: paystackData,
      });
    } catch (err) {
      console.error("payments/verify error", err.response?.data || err.message);
      res.status(500).json({ error: "Failed to verify payment" });
    }
  });

  app.post("/withdrawals/request", verifyAuthenticatedMiddleware, async (req, res) => {
    try {
      const amount = sanitizeNumber(req.body?.amount);
      const note = String(req.body?.note || "").trim();
      if (!amount || amount <= 0) {
        return res.status(400).json({ error: "Invalid withdrawal amount" });
      }

      const userEmail = req.user.email || "";
      const userUid = req.user.uid || "";
      const userRecord = req.userRecord || {};
      const accountName = String(userRecord.accountName || "").trim();
      const accountNumber = String(userRecord.accountNumber || "").trim();
      const bank = String(userRecord.bank || "").trim();
      const bankCode = String(userRecord.bankCode || "").trim();

      if (!accountName || !accountNumber || !bank || !bankCode) {
        return res.status(400).json({ error: "Payout account details are incomplete" });
      }

      const balanceInfo = await calculateHostBalance(normalizeText(userEmail), normalizeText(userUid));
      if (amount > balanceInfo.balance) {
        return res.status(400).json({
          error: `Requested amount exceeds available balance of ₦${balanceInfo.balance.toLocaleString()}`,
        });
      }

      const requestData = {
        hostEmail: userEmail,
        hostUid: userUid,
        hostName: userRecord.name || userRecord.displayName || userEmail,
        accountName,
        accountNumber,
        bank,
        bankCode,
        amount,
        note,
        balance: balanceInfo.balance,
        status: "pending",
        timestamp: Date.now(),
        source: "server",
      };

      const requestRef = db().ref("withdrawalRequests").push();
      await requestRef.set(requestData);

      res.json({
        success: true,
        id: requestRef.key,
        request: requestData,
      });
    } catch (err) {
      console.error("withdrawals/request error", err);
      res.status(500).json({ error: "Failed to submit withdrawal request" });
    }
  });

  app.patch("/admin/withdrawals/:withdrawalId/status", verifyAdminMiddleware, async (req, res) => {
    try {
      const { withdrawalId } = req.params;
      const nextStatus = String(req.body?.status || "").trim().toLowerCase();
      if (!["completed", "rejected", "approved"].includes(nextStatus)) {
        return res.status(400).json({ error: "Invalid withdrawal status" });
      }

      const status = nextStatus === "approved" ? "completed" : nextStatus;
      const withdrawalRef = db().ref(`withdrawalRequests/${withdrawalId}`);
      const snapshot = await withdrawalRef.once("value");

      if (!snapshot.exists()) {
        return res.status(404).json({ error: "Withdrawal request not found" });
      }

      await withdrawalRef.update({
        status,
        updatedAt: Date.now(),
        updatedBy: req.user.uid,
        updatedByEmail: req.user.email || "",
      });

      res.json({ success: true, id: withdrawalId, status });
    } catch (err) {
      console.error("admin/withdrawals status error", err);
      res.status(500).json({ error: "Failed to update withdrawal status" });
    }
  });

  app.get("/admin/summary", verifyAdminMiddleware, async (req, res) => {
    try {
      const databaseRef = db();
      const aggregatesSnap = await databaseRef.ref("aggregates/summary").once("value");
      const aggregates = aggregatesSnap.val();
      if (aggregates) {
        return res.json(aggregates);
      }

      const [eventsSnap, ticketsSnap, withdrawalsSnap] = await Promise.all([
        databaseRef.ref("events").once("value"),
        databaseRef.ref("tickets").once("value"),
        databaseRef.ref("withdrawalRequests").once("value"),
      ]);

      const events = eventsSnap.val() || {};
      const tickets = ticketsSnap.val() || {};
      const withdrawals = withdrawalsSnap.val() || {};

      const totalEvents = Object.keys(events).length;
      const ticketEntries = Object.values(tickets);
      const totalTicketsSold = ticketEntries.reduce((sum, ticket) => sum + (ticket.quantity || 1), 0);
      const totalRevenue = ticketEntries.reduce((sum, ticket) => sum + (ticket.totalPaid || ticket.totalCharged || 0), 0);
      const uniqueAttendees = new Set(ticketEntries.map((ticket) => ticket.email)).size;
      const platformRevenue = ticketEntries.reduce((sum, ticket) => sum + ((ticket.hostFee || 0) + (ticket.serviceFee || 0)), 0);
      const totalPaidOut = Object.values(withdrawals)
        .filter((withdrawal) => withdrawal.status === "completed" || withdrawal.status === "approved")
        .reduce((sum, withdrawal) => sum + (withdrawal.amount || 0), 0);
      const pendingWithdrawals = Object.values(withdrawals).filter((withdrawal) => withdrawal.status === "pending").length;

      res.json({
        totalEvents,
        totalTicketsSold,
        totalRevenue,
        uniqueAttendees,
        platformRevenue,
        totalPaidOut,
        pendingWithdrawals,
      });
    } catch (err) {
      console.error("admin/summary error", err);
      res.status(500).json({ error: "Failed to compute summary" });
    }
  });

  app.get("/admin/sales-trend", verifyAdminMiddleware, async (req, res) => {
    const days = Number(req.query.days) || 30;
    try {
      const databaseRef = db();
      const dailySnap = await databaseRef.ref("aggregates/daily").once("value");
      const daily = dailySnap.val() || {};
      const entries = [];
      for (let i = days - 1; i >= 0; i -= 1) {
        const d = new Date();
        d.setDate(d.getDate() - i);
        d.setHours(0, 0, 0, 0);
        const iso = d.toISOString().slice(0, 10);
        entries.push({ date: iso, total: daily[iso]?.total || 0 });
      }
      return res.json(entries);
    } catch (err) {
      console.error("admin/sales-trend error", err);
      res.status(500).json({ error: "Failed to compute sales trend" });
    }
  });

  app.get("/admin/hosts/top", verifyAdminMiddleware, async (req, res) => {
    const n = Number(req.query.n) || 10;

    try {
      const databaseRef = db();
      const [ticketsSnap, withdrawalsSnap] = await Promise.all([
        databaseRef.ref("tickets").once("value"),
        databaseRef.ref("withdrawalRequests").once("value"),
      ]);

      const tickets = ticketsSnap.val() || {};
      const withdrawals = withdrawalsSnap.val() || {};

      const byHost = {};
      Object.values(tickets).forEach((ticket) => {
        const host = ticket.hostEmail || "Unknown";
        if (!byHost[host]) {
          byHost[host] = { hostEmail: host, totalEarned: 0, tickets: 0, withdrawn: 0 };
        }
        byHost[host].totalEarned += ticket.totalPaid || 0;
        byHost[host].tickets += ticket.quantity || 1;
      });

      Object.values(withdrawals)
        .filter((withdrawal) => withdrawal.status === "completed")
        .forEach((withdrawal) => {
          const host = withdrawal.hostEmail || "Unknown";
          if (byHost[host]) {
            byHost[host].withdrawn += withdrawal.amount || 0;
          }
        });

      const arr = Object.values(byHost)
        .map((host) => ({ ...host, stillOwed: Math.max(0, host.totalEarned - host.withdrawn) }))
        .sort((a, b) => b.totalEarned - a.totalEarned)
        .slice(0, n);

      res.json(arr);
    } catch (err) {
      console.error("admin/hosts/top error", err);
      res.status(500).json({ error: "Failed to compute hosts breakdown" });
    }
  });

  app.post("/admin/audit", verifyAdminMiddleware, async (req, res) => {
    try {
      const { action, details } = req.body || {};
      if (!action) {
        return res.status(400).json({ error: "Missing action" });
      }

      const entry = {
        uid: req.user.uid,
        email: req.user.email || "",
        name: req.user.name || req.user.email || "",
        action,
        details: details || {},
        timestamp: Date.now(),
      };

      await db().ref("adminAudit").push(entry);
      res.json({ success: true });
    } catch (err) {
      console.error("admin/audit error", err);
      res.status(500).json({ error: "Failed to write audit entry" });
    }
  });

  app.post("/admin/tickets/:ticketId/resend-email", verifyAdminMiddleware, async (req, res) => {
    try {
      const { ticketId } = req.params;
      const databaseRef = db();
      const ticketSnap = await databaseRef.ref(`tickets/${ticketId}`).once("value");
      if (!ticketSnap.exists()) {
        return res.status(404).json({ error: "Ticket not found" });
      }

      const ticket = ticketSnap.val() || {};
      const event = await loadEventById(ticket.eventId);
      const emailResult = await sendTicketReceiptEmail({
        ticket: { id: ticketId, ...ticket },
        event,
        resend: true,
      });

      await databaseRef.ref(`tickets/${ticketId}`).update({
        emailStatus: emailResult.sent ? "resent" : "skipped",
        emailSentAt: emailResult.sent ? Date.now() : ticket.emailSentAt || null,
        emailBrandName:
          emailResult.brandName || ticket.emailBrandName || event?.emailBranding?.brandName || event?.title || "Ekotix",
      });

      await databaseRef.ref("adminAudit").push({
        uid: req.user.uid,
        email: req.user.email || "",
        name: req.user.name || req.user.email || "",
        action: "resend_ticket_email",
        details: {
          ticketId,
          to: ticket.email || "",
          eventId: ticket.eventId || "",
          brandName: emailResult.brandName || event?.emailBranding?.brandName || event?.title || "Ekotix",
        },
        timestamp: Date.now(),
      });

      res.json({ success: true, sent: Boolean(emailResult.sent), brandName: emailResult.brandName || "" });
    } catch (err) {
      console.error("admin/tickets resend-email error", err);
      res.status(500).json({ error: err.message || "Failed to resend ticket email" });
    }
  });

  app.get("/admin/transactions", verifyAdminMiddleware, async (req, res) => {
    try {
      const databaseRef = db();
      const [withdrawalsSnap, ticketsSnap] = await Promise.all([
        databaseRef.ref("withdrawalRequests").once("value"),
        databaseRef.ref("tickets").once("value"),
      ]);

      const withdrawals = withdrawalsSnap.val() || {};
      const tickets = ticketsSnap.val() || {};

      const withdrawalArr = Object.entries(withdrawals).map(([id, withdrawal]) => ({ id, ...withdrawal }));

      const ticketTx = Object.entries(tickets).map(([id, ticket]) => ({
        id,
        reference: ticket.transactionId || id,
        type: "Ticket Sale",
        description: ticket.eventTitle || ticket.ticketType || "Ticket",
        amount: ticket.totalPaid || ticket.totalCharged || 0,
        date: ticket.timestamp || 0,
        status: "Success",
      }));

      ticketTx.sort((a, b) => (b.date || 0) - (a.date || 0));

      res.json({ withdrawals: withdrawalArr, transactions: ticketTx.slice(0, 200) });
    } catch (err) {
      console.error("admin/transactions error", err);
      res.status(500).json({ error: "Failed to fetch transactions" });
    }
  });
};

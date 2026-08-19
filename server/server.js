const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();
const cors = require("cors");
const admin = require('firebase-admin');

// Render (and most non-GCP hosts) cannot reach metadata.google.internal, so
// admin.credential.applicationDefault() fails there with
// "Failed to determine project ID" / app/invalid-credential. Use an explicit
// service account instead when the env vars for one are present, and only
// fall back to applicationDefault() for environments (like actual GCP) where
// it works automatically.
const buildFirebaseCredential = () => {
  const { FIREBASE_PROJECT_ID, FIREBASE_CLIENT_EMAIL, FIREBASE_PRIVATE_KEY } = process.env;
  if (FIREBASE_PROJECT_ID && FIREBASE_CLIENT_EMAIL && FIREBASE_PRIVATE_KEY) {
    return admin.credential.cert({
      projectId: FIREBASE_PROJECT_ID,
      clientEmail: FIREBASE_CLIENT_EMAIL,
      // Render (and most dashboards) can't store literal newlines in an env
      // var, so the key is stored with escaped \n and unescaped here.
      privateKey: FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    });
  }
  return admin.credential.applicationDefault();
};
const { loadEventById, sendTicketReceiptEmail } = require('./emailService');
const { getExistingTicketQuantity, getMaxPerUser } = require('./admin-routes');

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "https://ekotixx.com",
    "https://www.ekotixx.com",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));

// initialize firebase-admin (will use application default credentials if available)
try {app.use(cors({
  origin: [
    "http://localhost:5173",
    "http://localhost:5176",
    "http://127.0.0.1:5176",
    "https://ekotixx.com",
    "https://www.ekotixx.com",
  ],
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: buildFirebaseCredential(),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
} catch (err) {
  console.warn('firebase-admin init warning:', err.message);
}
app.get("/webhook/paystack", (req, res) => {
  res.status(200).json({
    ok: true,
    secretConfigured: Boolean(process.env.PAYSTACK_SECRET_KEY),
  });
});
// ✅ Webhook must use raw body — add BEFORE express.json()
app.post("/webhook/paystack", express.raw({ type: "application/json" }), async (req, res) => {
  const secret = process.env.PAYSTACK_SECRET_KEY;
  const hash = crypto
    .createHmac("sha512", secret)
    .update(req.body)
    .digest("hex");

  if (hash !== req.headers["x-paystack-signature"]) {
    console.log("❌ Invalid webhook signature");
    return res.status(401).send("Unauthorized");
  }

  const payload = Buffer.isBuffer(req.body) ? req.body.toString("utf8") : req.body;
  const event = JSON.parse(payload);
  console.log("📦 Webhook received:", event.event);

  if (event.event === "charge.success") {
    console.log("Firebase URL:", process.env.FIREBASE_DATABASE_URL);
    const data = event.data;
    const email = data.customer.email;
    const reference = data.reference;
    const amount = data.amount / 100;
    const metadata = data.metadata || {};

    const customFields = Array.isArray(metadata.custom_fields) ? metadata.custom_fields : [];
    const readField = (variableName) => customFields.find(f => f.variable_name === variableName)?.value || "";
    const name = metadata.name || email;
    const ticketType = readField("ticket_type");
    const quantity = Number(readField("quantity")) || 1;
    const eventId = readField("event_id");
    const eventTitle = readField("event_title") || metadata.event_title || "";
    const hostEmail = readField("host_email") || metadata.host_email || "";
    const hostUid = readField("host_uid") || metadata.host_uid || "";
    const merchName = readField("merch_name") || metadata.merch_name || "";
    const deliveryType = readField("delivery_type") || metadata.delivery_type || "";
    const phone = readField("phone") || metadata.phone || "";
    const baseAmount = Number(readField("base_amount") || metadata.base_amount || 0) || Math.max(0, amount);
    const platformFee = Number(readField("platform_fee") || metadata.platform_fee || 0) || Math.max(0, amount - baseAmount);
    const deliveryFee = Number(readField("delivery_fee") || metadata.delivery_fee || 0) || 0;
    const totalAmount = Number(readField("total_amount") || metadata.total_amount || amount) || amount;

    try {
      if (merchName) {
        const merchData = {
          name,
          email,
          phone,
          eventId,
          eventTitle,
          hostEmail,
          hostUid,
          merchId: readField("merch_id") || metadata.merch_id || "",
          merchName,
          quantity,
          price: baseAmount,
          deliveryType,
          deliveryFee,
          platformFee,
          hostFee: baseAmount,
          totalCharged: totalAmount,
          transactionId: reference,
          timestamp: Date.now(),
          status: "pending",
          savedBy: "webhook",
        };

        const orderRef = admin.database().ref("merchOrders").push();
        await orderRef.set(merchData);
        console.log("✅ Merch order saved to Firebase via webhook:", reference);
        return;
      }

      const eventRecord = await loadEventById(eventId);

      // Defense-in-depth: the checkout UI already calls /tickets/check-limit
      // before showing the Pay button, but that's client-triggered and can
      // be bypassed by hitting Paystack directly. Re-check here, where the
      // ticket record actually gets created, since payment has already
      // settled at this point and can't simply be "declined" anymore.
      let overLimit = false;
      const maxPerUser = getMaxPerUser(eventRecord);
      if (maxPerUser) {
        const alreadyBought = await getExistingTicketQuantity(eventId, email);
        overLimit = alreadyBought + quantity > maxPerUser;
      }

      const ticketData = {
        name,
        email,
        eventId,
        eventTitle,
        hostEmail,
        hostUid,
        ticketType,
        quantity,
        totalPaid: baseAmount,
        hostFee: baseAmount,
        serviceFee: platformFee,
        platformFee,
        deliveryFee,
        totalCharged: totalAmount,
        transactionId: reference,
        timestamp: Date.now(),
        savedBy: "webhook",
        ...(overLimit
          ? { status: "flagged_over_limit", flaggedReason: `Exceeds max ${maxPerUser} tickets per person` }
          : {}),
      };

      const ticketRef = admin.database().ref('tickets').push();
      await ticketRef.set(ticketData);

      if (overLimit) {
        // Payment was already captured by Paystack. Don't silently deliver
        // the ticket — leave it flagged for the host/admin to refund or
        // manually approve, and log it so it isn't missed.
        await admin.database().ref('adminAudit').push({
          action: 'ticket_over_limit',
          details: { ticketId: ticketRef.key, eventId, email, quantity, maxPerUser, reference },
          timestamp: Date.now(),
        });
        console.warn(`⚠️ Ticket ${ticketRef.key} exceeds per-user limit for event ${eventId} (${email}). Flagged, not auto-emailed.`);
        res.sendStatus(200);
        return;
      }

      try {
        const emailResult = await sendTicketReceiptEmail({
          ticket: { id: ticketRef.key, ...ticketData },
          event: eventRecord,
          resend: false,
        });
        await ticketRef.update({
          emailStatus: emailResult.sent ? 'sent' : 'skipped',
          emailSentAt: emailResult.sent ? Date.now() : null,
          emailBrandName: emailResult.brandName || (eventRecord?.emailBranding?.brandName || eventRecord?.title || 'Ekotix'),
        });
      } catch (mailErr) {
        await ticketRef.update({
          emailStatus: 'failed',
          emailError: mailErr?.message || 'Failed to send receipt',
        });
        console.error('❌ Failed to send ticket receipt:', mailErr.message);
      }

      console.log("✅ Ticket saved to Firebase via webhook:", reference);
    } catch (err) {
      console.error("❌ Failed to save ticket to Firebase:", err.message);
    }
  }

  res.sendStatus(200);
});

// ✅ Regular JSON middleware for other routes
app.use(express.json());

// Mount admin routes (summary, sales-trend, hosts/top)
require('./admin-routes')(app);

app.get("/get-banks", async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.paystack.co/bank?country=nigeria",
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    console.log(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

app.get("/verifyAccount", async (req, res) => {
  const { accountNumber, bankCode } = req.query;

  try {
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.PAYSTACK_SECRET_KEY}`,
        },
      }
    );
    res.set("Cache-Control", "no-store");
    res.status(200).json(response.data);
  } catch (error) {
    console.error("Paystack error:", error.response?.data || error.message);
    res.status(400).json({ status: false, message: "Verification failed" });
  }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});

// ✅ Keep Render from sleeping — pings itself every 14 minutes
const RENDER_URL = "https://nova-eko-events.onrender.com";
setInterval(async () => {
  try {
    await axios.get(`${RENDER_URL}/get-banks`);
    console.log("✅ Keep-alive ping sent");
  } catch (err) {
    console.log("⚠️ Keep-alive ping failed:", err.message);
  }
}, 14 * 60 * 1000);
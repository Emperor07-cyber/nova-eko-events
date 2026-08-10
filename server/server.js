const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();
const cors = require("cors");
const admin = require('firebase-admin');
const { loadEventById, sendTicketReceiptEmail } = require('./emailService');

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ekotixx.com",
    "https://www.ekotixx.com",
  ],
  methods: ["GET", "POST"],
  credentials: true,
}));

// initialize firebase-admin (will use application default credentials if available)
try {
  if (!admin.apps.length) {
    admin.initializeApp({
      credential: admin.credential.applicationDefault(),
      databaseURL: process.env.FIREBASE_DATABASE_URL,
    });
  }
} catch (err) {
  console.warn('firebase-admin init warning:', err.message);
}

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
      };

      const ticketRef = admin.database().ref('tickets').push();
      await ticketRef.set(ticketData);

      const eventRecord = await loadEventById(eventId);
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

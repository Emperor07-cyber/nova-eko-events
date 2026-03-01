const express = require("express");
const axios = require("axios");
const crypto = require("crypto");
require("dotenv").config();
const cors = require("cors");

const app = express();

app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ekotixx.com",
  ],
  methods: ["GET", "POST"],
  credentials: true,
}));

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

  const event = JSON.parse(req.body);
  console.log("📦 Webhook received:", event.event);

  if (event.event === "charge.success") {
    const data = event.data;
    const email = data.customer.email;
    const reference = data.reference;
    const amount = data.amount / 100;
    const metadata = data.metadata || {};

    const name = metadata.name || email;
    const ticketType = metadata.custom_fields?.find(f => f.variable_name === "ticket_type")?.value || "";
    const quantity = Number(metadata.custom_fields?.find(f => f.variable_name === "quantity")?.value) || 1;
    const eventId = metadata.custom_fields?.find(f => f.variable_name === "event_id")?.value || "";
    const eventTitle = metadata.custom_fields?.find(f => f.variable_name === "event_title")?.value || "";
    const hostEmail = metadata.custom_fields?.find(f => f.variable_name === "host_email")?.value || "";

    try {
      const firebaseUrl = `${process.env.FIREBASE_DATABASE_URL}/tickets.json`;
      const ticketData = {
        name,
        email,
        eventId,
        eventTitle,
        hostEmail,
        ticketType,
        quantity,
        totalPaid: amount,
        transactionId: reference,
        timestamp: Date.now(),
        savedBy: "webhook",
      };

      await axios.post(firebaseUrl, ticketData);
      console.log("✅ Ticket saved to Firebase via webhook:", reference);
    } catch (err) {
      console.error("❌ Failed to save ticket to Firebase:", err.message);
    }
  }

  res.sendStatus(200);
});

// ✅ Regular JSON middleware for other routes
app.use(express.json());

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
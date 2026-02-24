const express = require("express");
const axios = require("axios");
require("dotenv").config();
const cors = require("cors");

const app = express();
app.use(cors());

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

    res.set("Cache-Control", "no-store"); // 🔥 VERY IMPORTANT
    res.status(200).json(response.data);

  } catch (error) {
    console.error("Paystack error:", error.response?.data || error.message);
    res.status(400).json({ status: false, message: "Verification failed" });
  }
});

app.listen(5000, () => {
  console.log("Server running on port 5000");
});
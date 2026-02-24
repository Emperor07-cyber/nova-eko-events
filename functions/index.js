const functions = require("firebase-functions");
const axios = require("axios");

exports.getBanks = functions.https.onRequest(async (req, res) => {
  try {
    const response = await axios.get(
      "https://api.paystack.co/bank?country=nigeria",
      {
        headers: {
          Authorization: `Bearer ${functions.config().paystack.secret}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "Failed to fetch banks" });
  }
});

exports.verifyAccount = functions.https.onRequest(async (req, res) => {
  const { accountNumber, bankCode } = req.query;

  try {
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${functions.config().paystack.secret}`,
        },
      }
    );

    res.json(response.data);
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(400).json({ error: "Account verification failed" });
  }
});
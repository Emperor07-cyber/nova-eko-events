// functions/index.js
const functions = require("firebase-functions");
const axios = require("axios");

exports.getBanks = functions.https.onRequest(async (req, res) => {
  try {
    const response = await axios.get("https://api.paystack.co/bank=nigeria", {
      headers: {
        Authorization: `Bearer ${process.env.sk_live_23d9a3fb9f7b6d863a7cdf6aaf9d2abdabcde34a}`,
      },
    });
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

exports.verifyAccount = functions.https.onRequest(async (req, res) => {
  const { accountNumber, bankCode } = req.query;
  try {
    const response = await axios.get(
      `https://api.paystack.co/bank/resolve?account_number=${accountNumber}&bank_code=${bankCode}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.sk_live_23d9a3fb9f7b6d863a7cdf6aaf9d2abdabcde34a}`,
        },
      }
    );
    res.json(response.data);
  } catch (error) {
    res.status(500).send(error.message);
  }
});

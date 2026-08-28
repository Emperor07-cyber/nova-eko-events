const crypto = require("crypto");

// Excludes 0/O, 1/I/L — characters that are easy to mistype or misread when
// a staffer is typing a code off a phone screen at check-in.
const CODE_CHARSET = "ABCDEFGHJKMNPQRSTUVWXYZ23456789";
const CODE_LENGTH = 7;

function generateTicketCode() {
  let code = "";
  for (let i = 0; i < CODE_LENGTH; i += 1) {
    code += CODE_CHARSET[crypto.randomInt(CODE_CHARSET.length)];
  }
  return code;
}

// Generates a code and confirms it isn't already in use by another ticket.
// Collisions are astronomically unlikely at this charset/length (31^7 ≈ 27
// billion combinations) but the check is cheap, so do it anyway.
async function generateUniqueTicketCode(db) {
  for (let attempt = 0; attempt < 5; attempt += 1) {
    const code = generateTicketCode();
    const snap = await db
      .ref("tickets")
      .orderByChild("token")
      .equalTo(code)
      .once("value");
    if (!snap.exists()) return code;
  }
  throw new Error("Failed to generate a unique ticket code after 5 attempts");
}

module.exports = { generateTicketCode, generateUniqueTicketCode, CODE_LENGTH };
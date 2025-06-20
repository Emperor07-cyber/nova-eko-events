import React, { useState } from "react";
import { auth, database } from "../../firebase/firebaseConfig";
import storeTicket from "./storeTicket";
import QRCode from "react-qr-code";
import "../styles/main.css";

function BuyTicket({ event }) {
  const currentUser = auth.currentUser;
  const [name, setName] = useState(currentUser?.displayName || "");
  const [email, setEmail] = useState(currentUser?.email || "");
  const [ticketType, setTicketType] = useState("");
  const [qrCodeData, setQrCodeData] = useState(null);

  const handlePay = () => {
    if (!name || !email || !ticketType) {
      alert("Please fill all fields and select a ticket type.");
      return;
    }

    const amount = event.prices[ticketType];

    const handler = window.PaystackPop.setup({
      key: import.meta.env.VITE_PAYSTACK_PUBLIC_KEY,
      email,
      amount: amount * 100,
      currency: "NGN",
      ref: `${Date.now()}`,
      metadata: {
        name,
        ticketType,
        eventTitle: event.title,
        userId: currentUser?.uid,
      },
      callback: async (response) => {
        const ticketData = {
          userId: currentUser?.uid,
          eventId: event.id,
          eventTitle: event.title,
          ticketType,
          name,
          email,
          ticketId: response.reference,
        };

        await storeTicket(ticketData);

        setQrCodeData(JSON.stringify(ticketData)); // Show QR code
        alert("Payment successful! Ticket stored.");
      },
      onClose: () => {
        console.log("Payment modal closed");
      },
    });

    handler.openIframe();
  };

  return (
    <div className="buy-ticket-container">
      <h2>Buy Ticket for: {event.title}</h2>
      <p>Date: {event.date}</p>
      <p>Venue: {event.venue}</p>

      <div className="ticket-inputs">
        <input
          type="text"
          placeholder="Your Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />

        <input
          type="email"
          placeholder="Your Email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />

        <select
          value={ticketType}
          onChange={(e) => setTicketType(e.target.value)}
        >
          <option value="">-- Select Ticket Type --</option>
          {Object.keys(event.prices).map((type) => (
            <option key={type} value={type}>
              {type} - ₦{event.prices[type]}
            </option>
          ))}
        </select>
      </div>

      <button className="pay-btn" onClick={handlePay}>
        Pay with Paystack
      </button>

      {qrCodeData && (
        <div className="qr-section">
          <h3>Your Ticket QR Code</h3>
          <QRCode value={qrCodeData} size={180} />
        </div>
      )}
    </div>
  );
}

export default BuyTicket;

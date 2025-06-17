// src/pages/EventDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ref, get, push, set } from "firebase/database";
import { database } from "../firebase/firebaseConfig";
import { FlutterWaveButton, closePaymentModal } from "flutterwave-react-v3";
import QRCode from "react-qr-code";
import "./main.css";

const EventDetails = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState("");
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [qrCodeData, setQrCodeData] = useState(null);

  useEffect(() => {
    const fetchEvent = async () => {
      const eventRef = ref(database, `events/${eventId}`);
      const snapshot = await get(eventRef);
      if (snapshot.exists()) {
        setEvent(snapshot.val());
      } else {
        console.warn("Event not found");
      }
    };
    fetchEvent();
  }, [eventId]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const handlePaymentSuccess = (response) => {
    const ticketRef = push(ref(database, "tickets"));
    const ticketData = {
      ...userData,
      eventId,
      ticketType: selectedTicket,
      transactionId: response.transaction_id,
      purchasedAt: new Date().toISOString(),
    };

    set(ticketRef, ticketData)
      .then(() => {
        setQrCodeData(JSON.stringify(ticketData));
        closePaymentModal();
      })
      .catch((err) => {
        console.error("Error saving ticket:", err);
      });
  };

  const config = {
    public_key: "FLWPUBK_TEST-xxxxxxxxxxxxxxxxxxxxx-X", // Replace with your actual public key
    tx_ref: Date.now().toString(),
    amount: selectedTicket ? event.prices[selectedTicket] : 0,
    currency: "NGN",
    payment_options: "card,ussd",
    customer: {
      email: userData.email,
      name: userData.name,
    },
    customizations: {
      title: event?.title || "Event Ticket",
      description: `Ticket for ${selectedTicket}`,
      logo: "https://yourlogo.com/logo.png",
    },
    callback: handlePaymentSuccess,
    onClose: () => console.log("Payment closed"),
  };

  if (!event) return <div>Loading event details...</div>;

  return (
    <div className="event-details">
      <h1>{event.title}</h1>
      <p>{event.date} | {event.venue}</p>
      <img src={event.image} alt={event.title} width="300" />

      <h3>Select Ticket Type:</h3>
      <select value={selectedTicket} onChange={(e) => setSelectedTicket(e.target.value)}>
        <option value="">-- Select --</option>
        {event.prices &&
          Object.keys(event.prices).map((type) => (
            <option key={type} value={type}>
              {type} - ₦{event.prices[type]}
            </option>
          ))}
      </select>

      <div className="input-group">
        <input
          name="name"
          placeholder="Your name"
          value={userData.name}
          onChange={handleChange}
        />
        <input
          name="email"
          placeholder="Your email"
          value={userData.email}
          onChange={handleChange}
        />
      </div>

      {selectedTicket && userData.name && userData.email && (
        <FlutterWaveButton {...config} text="Buy Ticket Now" />
      )}

      {qrCodeData && (
        <div style={{ marginTop: "20px" }}>
          <h3>Your Ticket QR Code:</h3>
          <QRCode value={qrCodeData} />
        </div>
      )}
    </div>
  );
};

export default EventDetails;

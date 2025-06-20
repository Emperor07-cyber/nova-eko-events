// src/components/Events/EventDetails.jsx
import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ref, get, push, set } from "firebase/database";
import { database } from "../../firebase/firebaseConfig";
import { PaystackButton } from "react-paystack";
import QRCode from "react-qr-code";
import "../../main.css";

const EventDetails = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState("");
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [qrCodeData, setQrCodeData] = useState(null);

  useEffect(() => {
    const eventRef = ref(database, `events/${eventId}`);
    get(eventRef).then((snapshot) => {
      if (snapshot.exists()) {
        setEvent(snapshot.val());
      }
    });
  }, [eventId]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const ticketPrice = selectedTicket ? event?.prices[selectedTicket] || 0 : 0;

  const handlePaymentSuccess = (response) => {
    const ticketRef = push(ref(database, "tickets"));
    const ticketData = {
      ...userData,
      eventId,
      ticketType: selectedTicket,
      transactionId: response.reference,
    };
    set(ticketRef, ticketData).then(() => {
      setQrCodeData(JSON.stringify(ticketData));
    });
  };

  const paystackConfig = {
    email: userData.email,
    amount: ticketPrice * 100,
    publicKey: "pk_test_xxxxxxxxxxxxxxxxxxxxxxxx", // Replace with real key
    metadata: {
      name: userData.name,
      custom_fields: [
        {
          display_name: "Ticket Type",
          variable_name: "ticket_type",
          value: selectedTicket,
        },
      ],
    },
    text: "Buy Ticket Now",
    onSuccess: handlePaymentSuccess,
    onClose: () => alert("Payment closed"),
  };

  if (!event) return <div>Loading...</div>;

  return (
    <div className="event-details">
      <h1>{event.title}</h1>
      <p>{event.date} | {event.venue}</p>
      <img src={event.image} alt={event.title} width="300" />

      <h3>Select Ticket Type:</h3>
      <select onChange={(e) => setSelectedTicket(e.target.value)}>
        <option value="">-- Select --</option>
        {Object.keys(event.prices).map((type) => (
          <option key={type} value={type}>
            {type} - ₦{event.prices[type]}
          </option>
        ))}
      </select>

      <div>
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
        <PaystackButton {...paystackConfig} className="paystack-button" />
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

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ref, get, push, set } from "firebase/database";
import { database } from "../../firebase/firebaseConfig";
import { PaystackButton } from "react-paystack";
import QRCode from "react-qr-code";
import Modal from "react-modal";
import "../../main.css";

const EventDetails = () => {
  const { eventId } = useParams();
const [event, setEvent] = useState(null);
const [selectedTicket, setSelectedTicket] = useState("");
const [userData, setUserData] = useState({ name: "", email: "" });
const [ticketQuantity, setTicketQuantity] = useState(1);
const [qrCodeData, setQrCodeData] = useState(null);
const [modalOpen, setModalOpen] = useState(false); // ✅ ADD THIS


  useEffect(() => {
    const eventRef = ref(database, `events/${eventId}`);
    get(eventRef).then((snapshot) => {
      if (snapshot.exists()) {
        setEvent(snapshot.val());
      }
    });
  }, [eventId]);
  Modal.setAppElement("#root"); // To prevent screen readers from reading the background content



  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const selectedTicketDetails = event?.tickets?.find(t => t.type === selectedTicket);
  const ticketPrice = selectedTicketDetails?.price || 0;
  const ticketLimit = selectedTicketDetails?.limit || 0;

  const totalAmount = ticketPrice * ticketQuantity;

  const handlePaymentSuccess = (response) => {
    const ticketRef = push(ref(database, "tickets"));
    const ticketData = {
      ...userData,
      eventId,
      ticketType: selectedTicket,
      quantity: ticketQuantity,
      totalPaid: totalAmount,
      transactionId: response.reference,
    };
    set(ticketRef, ticketData).then(() => {
      setQrCodeData(ticketData);
    setModalOpen(true);
    });
  };

  const handlePrint = () => {
  const printContent = document.getElementById("qr-code-print");
  const win = window.open();
  win.document.write(`
    <html>
      <head><title>Print QR Ticket</title></head>
      <body>${printContent.innerHTML}</body>
    </html>
  `);
  win.document.close();
  win.print();
};

  const paystackConfig = {
    email: userData.email,
    amount: totalAmount * 100,
    publicKey: "pk_live_92e934c9ee6f8cb2eed8f4a0c4d5be6ada8ff50a", // Replace with your key
    metadata: {
      name: userData.name,
      custom_fields: [
        {
          display_name: "Ticket Type",
          variable_name: "ticket_type",
          value: selectedTicket,
        },
        {
          display_name: "Quantity",
          variable_name: "quantity",
          value: ticketQuantity,
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
      <p><strong>Date:</strong> {event.date}</p>
      <p><strong>Time:</strong> {event.time || "To be announced"}</p>
      <p><strong>Location:</strong> {event.location}</p>
      <img src={event.image || "/default-event.jpg"} alt={event.title} width="100%" />

      <p className="description">{event.description}</p>

      <h3>Select Ticket Type:</h3>
      <select onChange={(e) => setSelectedTicket(e.target.value)} value={selectedTicket}>
        <option value="">-- Select --</option>
        {event.tickets?.map((ticket, idx) => (
          <option key={idx} value={ticket.type}>
            {ticket.type} - ₦{ticket.price} 
          </option>
        ))}
      </select>

      {selectedTicket && (
        <>
          <input
            type="number"
            min="1"
            max={ticketLimit}
            value={ticketQuantity}
            onChange={(e) => setTicketQuantity(Number(e.target.value))}
            placeholder="Quantity"
          />

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

          {/* Summary */}
          <div className="summary-box">
            <h4>Summary:</h4>
            <p><strong>Ticket:</strong> {selectedTicket}</p>
            <p><strong>Quantity:</strong> {ticketQuantity}</p>
            <p><strong>Total:</strong> ₦{totalAmount}</p>
          </div>
        </>
      )}

      {selectedTicket && userData.name && userData.email && ticketQuantity > 0 && (
        <PaystackButton {...paystackConfig} className="paystack-button" />
      )}

      {qrCodeData && (
        <div className="qr-code-container">
          <h3>Your Ticket QR Code:</h3>
          <QRCode value={qrCodeData} />
        </div>
      )}
      {qrCodeData && (
  <Modal isOpen={modalOpen} onRequestClose={() => setModalOpen(false)} className="qr-modal" overlayClassName="qr-overlay">
    <div id="qr-code-print" className="qr-content">
      <h2>🎫 Your Ticket</h2>
      <QRCode value={JSON.stringify(qrCodeData)} size={180} />
      <p><strong>Name:</strong> {qrCodeData.name}</p>
      <p><strong>Email:</strong> {qrCodeData.email}</p>
      <p><strong>Event:</strong> {event.title}</p>
      <p><strong>Ticket Type:</strong> {qrCodeData.ticketType}</p>
      <p><strong>Quantity:</strong> {qrCodeData.quantity}</p>
      <p><strong>Transaction ID:</strong> {qrCodeData.transactionId}</p>
    </div>
    <button onClick={handlePrint}>🖨️ Print Ticket</button>
    <button onClick={() => setModalOpen(false)}>Close</button>
  </Modal>
)}

    </div>
  );
};

export default EventDetails;

import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ref, get, push, set } from "firebase/database";
import { database } from "../../firebase/firebaseConfig";
import { PaystackButton } from "react-paystack";
import QRCode from "react-qr-code";
import Modal from "react-modal";
import html2canvas from "html2canvas";
import "../../main.css";

const EventDetails = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState("");
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [qrCodeData, setQrCodeData] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

  useEffect(() => {
    const eventRef = ref(database, `events/${eventId}`);
    get(eventRef).then((snapshot) => {
      if (snapshot.exists()) {
        setEvent(snapshot.val());
      }
    });
  }, [eventId]);

  Modal.setAppElement("#root");

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const selectedTicketDetails = event?.tickets?.find(
    (t) => t.type === selectedTicket
  );
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

    set(ticketRef, ticketData)
      .then(() => {
        console.log("✅ Ticket saved:", ticketData);
        setQrCodeData(ticketData);
        setModalOpen(true);
      })
      .catch((err) => {
        console.error("❌ Error saving ticket:", err);
        alert("Something went wrong saving your ticket. But you can still download it below.");
        // Still show the modal even if saving fails
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

  const handleDownloadImage = async () => {
    const qrElement = document.getElementById("qr-code-print");
    if (!qrElement) return;

    const canvas = await html2canvas(qrElement);
    const link = document.createElement("a");
    link.download = "ticket.png";
    link.href = canvas.toDataURL("image/png");
    link.click();
  };

  const paystackConfig = {
    email: userData.email,
    amount: totalAmount * 100,
    publicKey: "pk_test_c90717b9a2b1061c182bd039719f9e23b354060e", // replace
    metadata: {
      name: userData.name,
      custom_fields: [
        { display_name: "Ticket Type", variable_name: "ticket_type", value: selectedTicket },
        { display_name: "Quantity", variable_name: "quantity", value: ticketQuantity },
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
      <select
        onChange={(e) => setSelectedTicket(e.target.value)}
        value={selectedTicket}
      >
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
        <Modal
  isOpen={modalOpen}
  onRequestClose={() => setModalOpen(false)}
  className="qr-modal"
  overlayClassName="qr-overlay"
>
  <div id="qr-code-print" className="qr-ticket">

    {/* Header */}
    <h2 className="ticket-title">✅ Purchase Confirmed</h2>
    <p className="ticket-subtitle">Your adventure awaits!</p>

    {/* QR Code */}
    <div className="qr-code">
      <QRCode value={JSON.stringify(qrCodeData)} size={180} />
      <p className="scan-text">Scan at entry</p>
    </div>

    {/* Ticket Info */}
    <div className="ticket-details">
      <p><strong>👤 Name:</strong> {qrCodeData.name}</p>
      <p><strong>📧 Email:</strong> {qrCodeData.email}</p>
      <p><strong>🎫 Event:</strong> {event.title}</p>
      <p><strong>📌 Ticket Type:</strong> {qrCodeData.ticketType}</p>
      <p><strong>🔢 Quantity:</strong> {qrCodeData.quantity}</p>
      <p><strong>🆔 Transaction ID:</strong> {qrCodeData.transactionId}</p>

      {/* Optional seat/section if you store them */}
      {qrCodeData.seat && <p><strong>💺 Seat:</strong> {qrCodeData.seat}</p>}
      {qrCodeData.section && <p><strong>📍 Section:</strong> {qrCodeData.section}</p>}

      {/* Price Breakdown */}
      <div className="ticket-breakdown">
        <p>Price: ₦{qrCodeData.price}</p>
        <p>Fees: ₦{qrCodeData.fees || 0}</p>
        <p className="total">Total Paid: ₦{qrCodeData.total}</p>
      </div>
    </div>

    {/* Footer */}
    <p className="ticket-footer">
      Tickets are non-refundable. Please present ID upon entry.
    </p>

    {/* Actions */}
    <div className="modal-actions">
      <button onClick={handlePrint}>🖨️ Print Ticket</button>
      <button className="secondary" onClick={handleDownloadImage}>⬇️ Download Ticket</button>
      <button className="close" onClick={() => setModalOpen(false)}>✖ Close</button>
    </div>

    {/* Branding */}
    <div className="ticket-logo">
      <img src="/logo.png" alt="Website Logo" />
    </div>
  </div>
</Modal>

      )}
    </div>
  );
};

export default EventDetails;

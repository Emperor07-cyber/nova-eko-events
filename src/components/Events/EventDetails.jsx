import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ref, get, push, set } from "firebase/database";
import { database } from "../../firebase/firebaseConfig";
import { PaystackButton } from "react-paystack";
import emailjs from "@emailjs/browser";
import "../../main.css";

// ✅ Replace these with your actual EmailJS credentials
const EMAILJS_SERVICE_ID  = "service_vu5rgjd";
const EMAILJS_TEMPLATE_ID = "template_xdiunfr";
const EMAILJS_PUBLIC_KEY  = "H4Z5LHti97uiudwEY";

const EventDetails = () => {
  const { eventId } = useParams();
  const [event, setEvent] = useState(null);
  const [selectedTicket, setSelectedTicket] = useState("");
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [successMessage, setSuccessMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const eventRef = ref(database, `events/${eventId}`);
    get(eventRef).then((snapshot) => {
      if (snapshot.exists()) setEvent(snapshot.val());
    });
  }, [eventId]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const selectedTicketDetails = event?.tickets?.find(
    (t) => t.type === selectedTicket
  );
  const ticketPrice  = selectedTicketDetails?.price || 0;
  const ticketLimit  = selectedTicketDetails?.limit || 0;
  const totalAmount  = ticketPrice * ticketQuantity;

  const handlePaymentSuccess = async (response) => {
    setSending(true);

    const ticketData = {
      ...userData,
      eventId,
      eventTitle:    event.title,
      ticketType:    selectedTicket,
      quantity:      ticketQuantity,
      totalPaid:     totalAmount,
      transactionId: response.reference,
      timestamp:     Date.now(),
    };

    // Save to Firebase
    try {
      const ticketRef = push(ref(database, "tickets"));
      await set(ticketRef, ticketData);
    } catch (err) {
      console.error("Error saving ticket:", err);
    }

    // Send email via EmailJS
    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
  user_name: user.name,
  event_name: event.title,
  event_date: event.date,
  event_location: event.location,
  ticket_type: selectedTicket.name,
  order_id: paymentReference,
  qr_code_url: qrCodeImageUrl,
  support_email: "Ekotix234@gmail.com",
  company_name: "Ekotix Inc",
  current_year: new Date().getFullYear()
},
        EMAILJS_PUBLIC_KEY
      );

      setSuccessMessage(
        `🎉 Ticket confirmed! A confirmation email has been sent to ${ticketData.email}`
      );
    } catch (err) {
      console.error("Email send failed:", err);
      setSuccessMessage(
        `✅ Payment successful! Transaction ID: ${ticketData.transactionId}. 
         (Email delivery failed — please save your Transaction ID)`
      );
    }

    setSending(false);
  };

  const paystackConfig = {
    email:     userData.email,
    amount:    totalAmount * 100,
    publicKey: "pk_live_92e934c9ee6f8cb2eed8f4a0c4d5be6ada8ff50a",
    metadata: {
      name: userData.name,
      custom_fields: [
        { display_name: "Ticket Type",  variable_name: "ticket_type", value: selectedTicket },
        { display_name: "Quantity",     variable_name: "quantity",    value: ticketQuantity  },
      ],
    },
    text:      sending ? "Sending..." : "Buy Ticket Now",
    onSuccess: handlePaymentSuccess,
    onClose:   () => alert("Payment closed"),
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

      {/* ✅ Success message instead of modal */}
      {successMessage && (
        <div className="ticket-success-banner">
          <p>{successMessage}</p>
        </div>
      )}

      {!successMessage && (
        <>
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

              <div className="summary-box">
                <h4>Summary:</h4>
                <p><strong>Ticket:</strong> {selectedTicket}</p>
                <p><strong>Quantity:</strong> {ticketQuantity}</p>
                <p><strong>Total:</strong> ₦{totalAmount.toLocaleString()}</p>
              </div>
            </>
          )}

          {selectedTicket && userData.name && userData.email && ticketQuantity > 0 && (
            <PaystackButton {...paystackConfig} className="paystack-button" />
          )}
        </>
      )}
    </div>
  );
};

export default EventDetails;
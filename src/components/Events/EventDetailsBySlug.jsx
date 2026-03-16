import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ref, get, push, set } from "firebase/database";
import { database } from "../../firebase/firebaseConfig";
import { PaystackButton } from "react-paystack";
import emailjs from "@emailjs/browser";
import "../../main.css";

const EMAILJS_SERVICE_ID  = "service_vu5rgjd";
const EMAILJS_TEMPLATE_ID = "template_xdiunfr";
const EMAILJS_PUBLIC_KEY  = "H4Z5LHti97uiudwEY";

const EventDetailsBySlug = () => {
  const { slug } = useParams();
  const [event, setEvent] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState("");
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [successMessage, setSuccessMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const withWww = `https://www.ekotixx.com/${slug}`;
    const withoutWww = `https://ekotixx.com/${slug}`;

    const eventsRef = ref(database, "events");

    get(eventsRef).then((snapshot) => {
      if (snapshot.exists()) {
        const entries = Object.entries(snapshot.val());
        const match = entries.find(([id, data]) => {
          const stored = (data.eventUrl || "").trim();
          return (
            stored === withWww ||
            stored === withoutWww ||
            stored === slug
          );
        });

        if (match) {
          const [id, data] = match;
          setEventId(id);
          setEvent(data);
        } else {
          setNotFound(true);
        }
      } else {
        setNotFound(true);
      }
    });
  }, [slug]);

  if (notFound) return <div style={{ padding: "2rem", textAlign: "center" }}>Event not found.</div>;
  if (!event) return <div>Loading...</div>;

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const selectedTicketDetails = event.tickets?.find((t) => t.type === selectedTicket);
  const ticketPrice   = Number(selectedTicketDetails?.price) || 0;
  const ticketLimit   = selectedTicketDetails?.limit || 0;
  const baseAmount    = ticketPrice * ticketQuantity;
  const buyerFee      = baseAmount > 0 ? 100 : 0;
  const hostFee       = Math.round(baseAmount * 0.05);
  const totalAmount   = baseAmount + buyerFee;
  const hostEarnings  = baseAmount - hostFee;

  const handlePaymentSuccess = async (response) => {
    setSending(true);

    const ticketData = {
      ...userData,
      eventId,
      eventTitle:    event.title,
      hostEmail:     event.createdBy || "",
      ticketType:    selectedTicket,
      quantity:      ticketQuantity,
      totalPaid:     hostEarnings,
      serviceFee:    buyerFee,
      hostFee:       hostFee,
      totalCharged:  totalAmount,
      transactionId: response.reference,
      timestamp:     Date.now(),
    };

    try {
      const ticketRef = push(ref(database, "tickets"));
      await set(ticketRef, ticketData);
    } catch (err) {
      console.error("❌ Firebase save error:", err.code, err.message);
    }

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email:       userData.email,
          user_name:      userData.name,
          event_name:     event.title,
          event_date:     event.date,
          event_location: event.location,
          ticket_type:    selectedTicket,
          quantity:       String(ticketQuantity),
          unit_price:     ticketPrice.toLocaleString(),
          total_paid:     totalAmount.toLocaleString(),
          order_id:       response.reference,
          qr_code_url:    `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(response.reference)}`,
          support_email:  "Ekotix234@gmail.com",
          company_name:   "Ekotix Inc",
          current_year:   String(new Date().getFullYear()),
        },
        EMAILJS_PUBLIC_KEY
      );
      setSuccessMessage(`🎉 Ticket confirmed! A confirmation email has been sent to ${userData.email}`);
    } catch (err) {
      console.error("EmailJS error:", err);
      setSuccessMessage(`✅ Payment successful! Transaction ID: ${response.reference}. (Email delivery failed — please save your Transaction ID)`);
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
        { display_name: "Ticket Type",  variable_name: "ticket_type",  value: selectedTicket },
        { display_name: "Quantity",     variable_name: "quantity",     value: String(ticketQuantity) },
        { display_name: "Event ID",     variable_name: "event_id",     value: eventId },
        { display_name: "Event Title",  variable_name: "event_title",  value: event.title },
        { display_name: "Host Email",   variable_name: "host_email",   value: event.createdBy || "" },
      ],
    },
    text:      sending ? "Sending..." : "Buy Ticket Now",
    onSuccess: handlePaymentSuccess,
    onClose:   () => alert("Payment closed"),
  };

  return (
    <div className="event-details">
      <h1>{event.title}</h1>
      <p><strong>Date:</strong> {event.date}</p>
      <p><strong>Time:</strong> {event.startTime || "To be announced"}</p>
      <p><strong>Location:</strong> {event.location}</p>
      <img
        src={event.image || "/default-event.jpg"}
        alt={event.title}
        style={{ width: "100%", maxHeight: "500px", objectFit: "contain", borderRadius: "12px", background: "#f8fafc" }}
      />
      <p className="description">{event.description}</p>

      {successMessage && (
        <div className="ticket-success-banner"><p>{successMessage}</p></div>
      )}

      {!successMessage && (
        <>
          <h3>Select Ticket Type:</h3>
          <select onChange={(e) => setSelectedTicket(e.target.value)} value={selectedTicket}>
            <option value="">-- Select --</option>
            {event.tickets?.map((ticket, idx) => (
              <option key={idx} value={ticket.type}>
                {ticket.type} - ₦{Number(ticket.price).toLocaleString()}
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
                <input name="name" placeholder="Your name" value={userData.name} onChange={handleChange} />
                <input name="email" placeholder="Your email" value={userData.email} onChange={handleChange} />
              </div>
              <div className="summary-box">
                <h4>Summary:</h4>
                <p><strong>Ticket:</strong> {selectedTicket}</p>
                <p><strong>Quantity:</strong> {ticketQuantity}</p>
                <p><strong>Ticket Price:</strong> ₦{baseAmount.toLocaleString()}</p>
                <p><strong>Service Fee:</strong> ₦{buyerFee.toLocaleString()}</p>
                <hr style={{ margin: "0.5rem 0", border: "none", borderTop: "1px solid #eee" }} />
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

export default EventDetailsBySlug;

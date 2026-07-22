import React, { useEffect, useState } from "react";
import { useParams } from "react-router-dom";
import { ref, get, push, set } from "firebase/database";
import { database } from "../../firebase/firebaseConfig";
import { PaystackButton } from "react-paystack";
import emailjs from "@emailjs/browser";
import { generateTicketToken } from "./generateScannerCode";

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || "service_vu5rgjd";
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || "template_xdiunfr";
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || "H4Z5LHti97uiudwEY";
const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "pk_live_92e934c9ee6f8cb2eed8f4a0c4d5be6ada8ff50a";

const EventDetailsBySlug = () => {
  const { slug } = useParams();

  const [event, setEvent] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState("");
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [successMessage, setSuccessMessage] = useState("");
  const [sending, setSending] = useState(false);

  useEffect(() => {
    let mounted = true;

    const fetchEvent = async () => {
      try {
        const eventsSnapshot = await get(ref(database, "events"));
        if (!eventsSnapshot.exists()) {
          if (mounted) setNotFound(true);
          return;
        }

        const normalizedSlug = (slug || "").trim().toLowerCase();
        const entries = Object.entries(eventsSnapshot.val());

        const match = entries.find(([, data]) => {
          const storedRaw = (data.eventUrl || "").trim();
          if (!storedRaw) return false;

          const stored = storedRaw.toLowerCase();
          if (stored === normalizedSlug) return true;
          if (stored.endsWith(`/${normalizedSlug}`)) return true;

          try {
            const parsed = new URL(storedRaw);
            const path = parsed.pathname.replace(/^\/+/, "").toLowerCase();
            return path === normalizedSlug;
          } catch {
            return false;
          }
        });

        if (!mounted) return;

        if (!match) {
          setNotFound(true);
          return;
        }

        const [id, data] = match;
        setEventId(id);
        setEvent(data);
      } catch (error) {
        console.error("Error loading event:", error);
        if (mounted) setNotFound(true);
      } finally {
        if (mounted) setLoading(false);
      }
    };

    fetchEvent();
    return () => {
      mounted = false;
    };
  }, [slug]);

  const tickets = Array.isArray(event?.tickets) ? event.tickets : [];
  const merch = Array.isArray(event?.merch) ? event.merch : [];
  const selectedTicketDetails = tickets.find((ticket) => ticket.type === selectedTicket);

  const ticketPrice = Number(selectedTicketDetails?.price) || 0;
  const ticketLimit = Math.max(Number(selectedTicketDetails?.limit) || 1, 1);
  const baseAmount = ticketPrice * ticketQuantity;
  const platformFee = baseAmount > 0 ? Math.round(baseAmount * 0.05) + 100 : 0;
  const totalAmount = baseAmount + platformFee;

  const isValidEmail = /\S+@\S+\.\S+/.test(userData.email);
  const canPay =
    !!selectedTicket &&
    userData.name.trim().length >= 2 &&
    isValidEmail &&
    ticketQuantity >= 1 &&
    ticketQuantity <= ticketLimit &&
    totalAmount > 0 &&
    !sending;

  const handleChange = (e) => {
    setUserData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleQuantityChange = (e) => {
    const value = Number(e.target.value);
    if (Number.isNaN(value)) return;
    setTicketQuantity(Math.max(1, Math.min(ticketLimit, value)));
  };

  const handlePaymentSuccess = async (response) => {
    setSending(true);

    const token = generateTicketToken(response.reference);
    const ticketData = {
      name: userData.name.trim(),
      email: userData.email.trim(),
      eventId,
      eventTitle: event?.title || "",
      hostEmail: event?.createdBy || "",
      ticketType: selectedTicket,
      quantity: ticketQuantity,
      totalPaid: baseAmount,
      platformFee,
      totalCharged: totalAmount,
      transactionId: response.reference,
      token,
      checkedIn: false,
      checkedInAt: null,
      timestamp: Date.now(),
    };

    try {
      const ticketRef = push(ref(database, "tickets"));
      await set(ticketRef, ticketData);
    } catch (error) {
      console.error("Firebase save error:", error);
      setSending(false);
      return;
    }

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: userData.email.trim(),
          user_name: userData.name.trim(),
          event_name: event?.title || "",
          event_date: event?.date || "TBA",
          event_location: event?.location || "TBA",
          ticket_type: selectedTicket,
          quantity: String(ticketQuantity),
          unit_price: ticketPrice.toLocaleString(),
          total_paid: totalAmount.toLocaleString(),
          order_id: response.reference,
          qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(token)}`,
          support_email: "support@ekotixx.com",
          company_name: "Ekotix",
          current_year: String(new Date().getFullYear()),
        },
        EMAILJS_PUBLIC_KEY,
      );
      setSuccessMessage(`Ticket confirmed. A confirmation email was sent to ${userData.email.trim()}.`);
    } catch (error) {
      console.error("EmailJS error:", error);
      setSuccessMessage(`Payment successful. Transaction ID: ${response.reference}. Email delivery failed.`);
    } finally {
      setSending(false);
    }
  };

  if (notFound) {
    return <div className="event-wrap">Event not found.</div>;
  }

  if (loading) {
    return (
      <div className="event-wrap">
        <div className="skeleton skeleton-title" />
        <div className="skeleton skeleton-line" />
        <div className="skeleton skeleton-image" />
        <div className="skeleton skeleton-line" />
      </div>
    );
  }

  const paystackConfig = {
    email: userData.email,
    amount: totalAmount * 100,
    publicKey: PAYSTACK_PUBLIC_KEY,
    metadata: {
      name: userData.name,
      custom_fields: [
        { display_name: "Ticket Type", variable_name: "ticket_type", value: selectedTicket },
        { display_name: "Quantity", variable_name: "quantity", value: String(ticketQuantity) },
        { display_name: "Event ID", variable_name: "event_id", value: eventId || "" },
      ],
    },
    text: sending ? "Processing..." : "Buy Ticket",
    onSuccess: handlePaymentSuccess,
    onClose: () => {},
  };

  return (
    <div className="event-wrap">
      <h1 className="event-title">{event?.title}</h1>
      <p className="event-meta"><strong>Date:</strong> {event?.date === "TBA" ? "To be announced" : event?.date}</p>
      <p className="event-meta"><strong>Time:</strong> {event?.startTime || "To be announced"}</p>
      <p className="event-meta"><strong>Location:</strong> {event?.location || "TBA"}</p>

      <img className="event-image" src={event?.image || "/images/partypic.jpg"} alt={event?.title || "Event"} />
      <p className="event-description">{event?.description}</p>

      {merch.length > 0 ? (
        <div className="merch-section">
          <h3>Merchandise</h3>
          <div className="merch-grid">
            {merch.map((item, index) => (
              <div key={index} className="merch-card">
                <img src={item.image || "/images/partypic.jpg"} alt={item.name || "Merch item"} />
                <div>
                  <strong>{item.name}</strong>
                  <p>₦{Number(item.price || 0).toLocaleString()}</p>
                  <small>{Number(item.stock || 0)} in stock</small>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      {successMessage ? (
        <div className="ticket-success-banner">{successMessage}</div>
      ) : (
        <div className="checkout-card">
          <label>Ticket type</label>
          <select className="select" value={selectedTicket} onChange={(e) => setSelectedTicket(e.target.value)}>
            <option value="">Select ticket</option>
            {tickets.map((ticket, idx) => (
              <option key={idx} value={ticket.type}>
                {ticket.type} - ₦{Number(ticket.price || 0).toLocaleString()}
              </option>
            ))}
          </select>

          {selectedTicket ? (
            <>
              <label>Quantity</label>
              <input
                className="input"
                type="number"
                min="1"
                max={ticketLimit}
                value={ticketQuantity}
                onChange={handleQuantityChange}
              />

              <label>Name</label>
              <input className="input" name="name" placeholder="Your name" value={userData.name} onChange={handleChange} />

              <label>Email</label>
              <input
                className="input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={userData.email}
                onChange={handleChange}
              />

              <div className="summary-box">
                <p><strong>Ticket:</strong> {selectedTicket}</p>
                <p><strong>Quantity:</strong> {ticketQuantity}</p>
                <p><strong>Ticket Price:</strong> ₦{baseAmount.toLocaleString()}</p>
                <p><strong>Service Fee:</strong> ₦{platformFee.toLocaleString()}</p>
                <hr />
                <p><strong>Total:</strong> ₦{totalAmount.toLocaleString()}</p>
              </div>

              <PaystackButton {...paystackConfig} className="btn btn-primary" disabled={!canPay} />
            </>
          ) : null}
        </div>
      )}
    </div>
  );
};

export default EventDetailsBySlug;

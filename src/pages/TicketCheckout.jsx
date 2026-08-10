import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { FiArrowLeft, FiCreditCard, FiShield, FiUsers, FiPhone, FiCheckCircle } from "react-icons/fi";
import { useAuthState } from "react-firebase-hooks/auth";
import { ref, get, push, set } from "firebase/database";
import { PaystackButton } from "react-paystack";
import { database, auth } from "../firebase/firebaseConfig";
import { generateTicketToken } from "../components/Events/generateScannerCode";

const PAYSTACK_PUBLIC_KEY = import.meta.env.VITE_PAYSTACK_PUBLIC_KEY || "";

const TicketCheckout = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [event, setEvent] = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [selectedTicket, setSelectedTicket] = useState("");
  const [ticketQuantity, setTicketQuantity] = useState(1);
  const [userData, setUserData] = useState({ name: "", email: "" });
  const [sending, setSending] = useState(false);
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (!eventId) return;

    setLoading(true);
    get(ref(database, `events/${eventId}`))
      .then((snapshot) => {
        if (!snapshot.exists()) {
          setNotFound(true);
          return;
        }

        const eventData = snapshot.val();
        setEvent({ id: eventId, ...eventData });
        const firstTicket = Array.isArray(eventData.tickets) && eventData.tickets[0];
        if (firstTicket) {
          setSelectedTicket(firstTicket.type);
        }
      })
      .catch((error) => {
        console.error("Ticket checkout load error:", error);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [eventId]);

  useEffect(() => {
    if (!user) return;
    setUserData({
      name: user.displayName || "",
      email: user.email || "",
    });
  }, [user]);

  const handleChange = (e) => {
    setUserData({ ...userData, [e.target.name]: e.target.value });
  };

  const tickets = Array.isArray(event?.tickets) ? event.tickets : [];
  const selectedTicketDetails = tickets.find((ticket) => ticket.type === selectedTicket);
  const ticketPrice = Number(selectedTicketDetails?.price || 0);
  const ticketLimit = Math.max(Number(selectedTicketDetails?.limit || 1), 1);
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
    !!PAYSTACK_PUBLIC_KEY &&
    !sending;

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
      setSuccessMessage("Payment successful. Your ticket has been issued.");
    } catch (error) {
      console.error("Ticket save error:", error);
      setSuccessMessage("Payment succeeded, but saving the ticket failed. Please contact support.");
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return <div className="event-wrap"><div className="skeleton skeleton-title" /><div className="skeleton skeleton-line" /><div className="skeleton skeleton-image" /><div className="skeleton skeleton-line" /></div>;
  }

  if (notFound || !event) {
    return (
      <div className="event-wrap">
        <div className="empty-state-card">
          <h2>Event not found</h2>
          <p>This checkout page cannot load the event.</p>
          <button className="btn-primary" onClick={() => navigate(-1)}>Return</button>
        </div>
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
        { display_name: "Event ID", variable_name: "event_id", value: eventId },
      ],
    },
    text: sending ? "Processing..." : "Pay Now",
    onSuccess: handlePaymentSuccess,
    onClose: () => {
      /* no-op */
    },
  };

  return (
    <div className="checkout-page">
      <div className="checkout-content">
            <div className="checkout-panel">
            <div className="checkout-heading">
              <div className="checkout-heading-brand">
                <img src="/images/Logo1.jpg" alt="Ekotix logo" className="checkout-brand-logo" />
                <div>
                  <p className="kicker">Secure Checkout</p>
                  <h1>Purchase tickets</h1>
                </div>
              </div>
              <button className="btn-copy-link" onClick={() => navigate(`/event/${eventId}`)}>
                <FiArrowLeft style={{ marginRight: 6 }} /> Back to event
              </button>
            </div>

            <div className="checkout-event-card">
            <img src={event.image || "/images/partypic.jpg"} alt={event.title} />
            <div>
              <strong>{event.title}</strong>
              <p>{event.date === "TBA" ? "Date to be announced" : event.date}</p>
              <p>{event.location || "Location TBA"}</p>
            </div>
          </div>

          <div className="checkout-section">
            <h2>Ticket selection</h2>
            {tickets.length === 0 ? (
              <p className="host-muted-note">No ticket types are available for this event.</p>
            ) : (
              <>
                <label>Ticket type</label>
                <select className="select" value={selectedTicket} onChange={(e) => setSelectedTicket(e.target.value)}>
                  {tickets.map((ticket, index) => (
                    <option key={index} value={ticket.type}>
                      {ticket.type} - ₦{Number(ticket.price || 0).toLocaleString()}
                    </option>
                  ))}
                </select>

                <label>Quantity</label>
                <div className="quantity-row">
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => setTicketQuantity((qty) => Math.max(1, qty - 1))}
                  >-</button>
                  <input
                    className="input qty-input"
                    type="number"
                    min="1"
                    max={ticketLimit}
                    value={ticketQuantity}
                    onChange={(e) => setTicketQuantity(Math.max(1, Math.min(ticketLimit, Number(e.target.value))))}
                  />
                  <button
                    type="button"
                    className="quantity-btn"
                    onClick={() => setTicketQuantity((qty) => Math.min(ticketLimit, qty + 1))}
                  >+</button>
                </div>
                <p className="field-note">Max {ticketLimit} tickets per order.</p>
              </>
            )}
          </div>

          <div className="checkout-section">
            <h2>Buyer information</h2>
            <label>Name</label>
            <input className="input" name="name" value={userData.name} onChange={handleChange} placeholder="John Doe" />
            <label>Email</label>
            <input className="input" name="email" value={userData.email} onChange={handleChange} placeholder="you@example.com" />
          </div>
        </div>

        <aside className="order-summary-card">
          <div className="order-summary-header">
            <div className="summary-title">
              <span className="summary-icon"><FiCreditCard /></span>
              <div>
                <h3>Order summary</h3>
                <p>{event.title}</p>
              </div>
            </div>
          </div>

          <div className="order-item">
            <span>{selectedTicket || "Ticket"} × {ticketQuantity}</span>
            <strong>₦{baseAmount.toLocaleString()}</strong>
          </div>
          <div className="order-item">
            <span>Service fee</span>
            <strong>₦{platformFee.toLocaleString()}</strong>
          </div>
          <div className="order-total">
            <span>Total</span>
            <strong>₦{totalAmount.toLocaleString()}</strong>
          </div>

          <div className="payment-methods">
            <p className="payment-label">Payment methods</p>
            <ul>
              <li><span className="payment-icon"><FiCreditCard /></span> Card (Visa, MasterCard, Verve)</li>
              <li><span className="payment-icon"><FiShield /></span> PalmPay</li>
              <li><span className="payment-icon"><FiPhone /></span> Opay & USSD</li>
            </ul>
          </div>

          {successMessage ? (
            <div className="checkout-success-banner">{successMessage}</div>
          ) : PAYSTACK_PUBLIC_KEY ? (
            <PaystackButton {...paystackConfig} className="btn-primary checkout-pay-btn" disabled={!canPay} />
          ) : (
            <div className="notification warning">Paystack public key is not configured.</div>
          )}
        </aside>
      </div>
    </div>
  );
};

export default TicketCheckout;

import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/firebaseConfig";

const EventDetailsBySlug = () => {
  const navigate = useNavigate();
  const { slug } = useParams();

  const [event, setEvent] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [notFound, setNotFound] = useState(false);
  const [loading, setLoading] = useState(true);
  const [selectedTicket, setSelectedTicket] = useState("");

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

  const isPaystackLoaded = typeof window !== "undefined" && !!window.PaystackPop;

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
                  <button className="btn-copy-link" onClick={() => navigate(`/checkout/merch/${eventId}`)}>
                    Buy merch
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      ) : null}

      <div className="checkout-card">
        <h2>Secure ticket checkout</h2>
        <p>Proceed to the dedicated checkout pages for ticket and merch purchases.</p>
        <div className="checkout-links-row">
          <button className="btn-primary" onClick={() => navigate(`/checkout/tickets/${eventId}`)}>
            Checkout tickets
          </button>
          {merch.length > 0 && (
            <button className="btn-copy-link" onClick={() => navigate(`/checkout/merch/${eventId}`)}>
              Checkout merch
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventDetailsBySlug;

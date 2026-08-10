import React, { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/firebaseConfig";
import "../../main.css";

const EventDetails = () => {
  const navigate = useNavigate();
  const params = useParams();
  const routeEventId = params.eventId;
  const slug = params.slug;
  const [event, setEvent] = useState(null);
  const [eventId, setEventId] = useState(routeEventId || null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    setNotFound(false);

    const loadById = async (id) => {
      try {
        const snap = await get(ref(database, `events/${id}`));
        if (!mounted) return;
        if (snap.exists()) {
          setEvent({ id, ...snap.val() });
          setEventId(id);
        } else {
          setNotFound(true);
        }
      } catch (e) {
        console.error("Event load error:", e);
        setNotFound(true);
      }
    };

    const loadBySlug = async (s) => {
      try {
        const eventsSnap = await get(ref(database, "events"));
        if (!mounted) return;
        if (!eventsSnap.exists()) {
          setNotFound(true);
          return;
        }

        const normalizedSlug = (s || "").trim().toLowerCase();
        const entries = Object.entries(eventsSnap.val());

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

        if (!match) {
          setNotFound(true);
          return;
        }

        const [id, data] = match;
        if (!mounted) return;
        setEvent({ id, ...data });
        setEventId(id);
      } catch (e) {
        console.error("Error loading event by slug:", e);
        setNotFound(true);
      }
    };

    if (routeEventId) {
      loadById(routeEventId).finally(() => mounted && setLoading(false));
    } else if (slug) {
      loadBySlug(slug).finally(() => mounted && setLoading(false));
    } else {
      setLoading(false);
      setNotFound(true);
    }

    return () => {
      mounted = false;
    };
  }, [routeEventId, slug]);

  const tickets = Array.isArray(event?.tickets) ? event.tickets : [];
  const merch = Array.isArray(event?.merch) ? event.merch : [];

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

  if (notFound || !event) {
    return (
      <div className="event-wrap">
        <div className="empty-state-card">
          <h2>Event not found</h2>
          <p>This event could not be located.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="event-wrap event-details-page">
      <div className="detail-header">
        <div className="stack">
          <p className="kicker">Event details</p>
          <h1 className="event-title">{event.title}</h1>
          <div className="detail-meta-grid">
            <span className="detail-pill">📅 {event.date === "TBA" ? "To be announced" : event.date}</span>
            <span className="detail-pill">🕐 {event.startTime || "To be announced"}</span>
            <span className="detail-pill">📍 {event.location || "TBA"}</span>
          </div>
        </div>
        <div className="detail-stats">
          <strong>Ready to purchase</strong>
          <span>{tickets.length} ticket type{tickets.length === 1 ? "" : "s"} available</span>
          <div className="checkout-links-row">
            <button className="btn-primary" onClick={() => navigate(`/checkout/tickets/${event.id}`)}>
              Checkout tickets
            </button>
            {merch.length > 0 && (
              <button className="btn-copy-link" onClick={() => navigate(`/checkout/merch/${event.id}`)}>
                Checkout merch
              </button>
            )}
          </div>
        </div>
      </div>

      <img
        className="detail-hero-image"
        src={event.image || "/images/partypic.jpg"}
        alt={event.title}
      />

      <p className="event-description">{event.description}</p>

      {merch.length > 0 && (
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
      )}

      <div className="checkout-card">
        <h2>Buy tickets or merch</h2>
        <p>Use the dedicated checkout pages for faster, secure payment processing.</p>
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

export default EventDetails;

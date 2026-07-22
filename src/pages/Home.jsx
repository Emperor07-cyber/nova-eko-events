import React, { useEffect, useMemo, useState } from "react";
import { database } from "../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import "./home-troop.css";

const FAQ_ITEMS = [
  {
    q: "How do I create an event?",
    a: "Register as host, complete setup, create your event, then publish ticket types.",
  },
  {
    q: "How do I buy tickets?",
    a: "Open an event, choose ticket type, enter your details, and pay securely via Paystack.",
  },
  {
    q: "Can I get a refund?",
    a: "Refund policy is managed by each event organizer.",
  },
  {
    q: "How do I contact support?",
    a: "Reach support at support@ekotix.com.",
  },
];

const CATEGORIES = ["All", "Nightlife", "Concert", "Festival", "Business", "Workshop", "Sports"];
const HERO_IMAGES = ["/images/nova-1.jpg", "/images/nova-2.jpg", "/images/nova-3.jpg"];
const HERO_STATS = [
  { value: "2K+", label: "Events hosted" },
  { value: "90K+", label: "Tickets issued" },
  { value: "24/7", label: "Buyer support" },
];
const OFFER_ITEMS = [
  {
    icon: "🎟️",
    title: "Host events effortlessly",
    description:
      "Create and launch events quickly while Ekotix handles ticket delivery, checkout, and attendee flow.",
  },
  {
    icon: "🔗",
    title: "Smart ticketing",
    description:
      "Share event links instantly and let guests buy tickets or RSVP with a simple, low-friction flow.",
  },
  {
    icon: "⚡",
    title: "Quick pay at the gate",
    description:
      "Accept fast in-person payments and keep door entry moving with better speed and accuracy.",
  },
  {
    icon: "📊",
    title: "Event dashboard",
    description:
      "Track sales, monitor engagement, manage ticket tiers, and stay on top of every event detail.",
  },
  {
    icon: "🛍️",
    title: "Merch integration",
    description:
      "Attach merch to event pages so attendees can browse and purchase products during checkout.",
  },
  {
    icon: "💳",
    title: "Payment manager",
    description:
      "Get a clear view of transactions, payouts, and payment activity across events and merch.",
  },
  {
    icon: "🛡️",
    title: "Check-in and security",
    description:
      "Scan tickets, verify guests instantly, and improve on-ground control with real-time attendee data.",
  },
  {
    icon: "👥",
    title: "Team access controls",
    description:
      "Add collaborators, assign roles, and manage permissions to run events smoothly with your team.",
  },
];

const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "TBA") return "To be announced";
  const d = new Date(dateStr);
  if (Number.isNaN(d.getTime())) return dateStr;
  return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
};

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState("All");
  const [openFaq, setOpenFaq] = useState(null);

  useEffect(() => {
    const eventsRef = ref(database, "events");
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (!data) {
        setEvents([]);
        setLoading(false);
        return;
      }

      const now = new Date();
      const rows = Object.keys(data)
        .map((id) => ({ id, ...data[id] }))
        .filter((event) => event.date === "TBA" || new Date(event.date) >= now)
        .sort((a, b) => {
          if (a.date === "TBA") return 1;
          if (b.date === "TBA") return -1;
          return new Date(a.date) - new Date(b.date);
        });

      setEvents(rows);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredEvents = useMemo(() => {
    if (activeCategory === "All") return events;
    return events.filter((event) => event.category === activeCategory);
  }, [events, activeCategory]);

  const displayEvents = filteredEvents.slice(0, 9);

  const getEventLink = (event) => {
    if (event.eventUrl) {
      try {
        return new URL(event.eventUrl).pathname;
      } catch (error) {
        console.warn("Invalid eventUrl, falling back to event id route", error);
      }
    }
    return `/event/${event.id}`;
  };

  const getMinPrice = (tickets) => {
    if (!Array.isArray(tickets) || tickets.length === 0) return "Free";
    const prices = tickets.map((t) => Number(t.price)).filter((p) => p > 0);
    return prices.length ? `₦${Math.min(...prices).toLocaleString()}` : "Free";
  };

  return (
    <section className="stack home-troop">
      <div className="card hero-panel">
        <div className="hero-content">
          <p className="kicker">Nigeria&apos;s event platform</p>
          <h1>Find events worth your time</h1>
          <p className="event-meta">
            Discover nightlife, concerts, workshops and festivals. Get tickets in seconds.
          </p>
          <div className="hero-proof">
            <span>Secure checkout</span>
            <span>Instant QR ticket</span>
            <span>Trusted hosts</span>
          </div>
          <div className="row hero-actions">
            <Link to="/eventlist" className="btn btn-primary">Browse events</Link>
            <Link to="/register" className="btn btn-ghost">Host an event</Link>
          </div>
          <div className="hero-stats">
            {HERO_STATS.map((item) => (
              <div key={item.label} className="hero-stat-card">
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>
        <div className="hero-media">
          {HERO_IMAGES.map((src, index) => (
            <img
              key={src}
              src={src}
              alt={`Ekotix spotlight ${index + 1}`}
              className={index === 0 ? "hero-media-main" : ""}
            />
          ))}
          <div className="hero-media-badge">
            <p>Featured this weekend</p>
            <strong>Lagos • Abuja • Port Harcourt</strong>
          </div>
        </div>
      </div>

      <div className="chips-row">
        {CATEGORIES.map((category) => (
          <button
            key={category}
            type="button"
            className={`chip ${activeCategory === category ? "chip-active" : ""}`}
            onClick={() => setActiveCategory(category)}
          >
            {category}
          </button>
        ))}
      </div>

      <div className="row">
        <div>
          <h2 className="section-title">
            {activeCategory === "All" ? "Upcoming events" : activeCategory}
          </h2>
          <p className="section-subtle">Curated picks from top hosts on Ekotix</p>
        </div>
        {events.length > 9 ? <Link to="/eventlist" className="event-meta">View all →</Link> : null}
      </div>

      {loading ? (
        <div className="grid grid-3">
          {Array.from({ length: 6 }).map((_, idx) => (
            <div key={idx} className="card skeleton-card" />
          ))}
        </div>
      ) : displayEvents.length === 0 ? (
        <div className="card card-body stack empty-events">
          <p className="empty-events-title">No events in this category yet</p>
          <p className="event-meta">Try another category or check back soon for new drops.</p>
          <button className="btn btn-ghost" type="button" onClick={() => setActiveCategory("All")}>
            Show all events
          </button>
        </div>
      ) : (
        <div className="grid grid-3">
          {displayEvents.map((event) => (
            <Link key={event.id} to={getEventLink(event)} className="card event-link-card">
              <img
                src={event.image || "/images/nova-5.jpg"}
                alt={event.title}
                className="event-image"
                loading="lazy"
              />
              <div className="card-body stack">
                <strong>{event.title}</strong>
                <span className="event-meta">
                  {formatDate(event.date)} {event.startTime ? `• ${event.startTime}` : ""} • {event.location || "TBA"}
                </span>
                <div className="row">
                  <span>{getMinPrice(event.tickets)}</span>
                  <span className="event-meta">Get tickets →</span>
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}

      <div className="grid grid-3 feature-grid">
        <div className="card card-body feature-card">
          <span className="feature-icon">🔎</span>
          <strong>Discover events</strong>
          <span className="event-meta">Filter by category and location.</span>
        </div>
        <div className="card card-body feature-card">
          <span className="feature-icon">⚡</span>
          <strong>Buy in seconds</strong>
          <span className="event-meta">Fast checkout with secure payment.</span>
        </div>
        <div className="card card-body feature-card">
          <span className="feature-icon">✅</span>
          <strong>QR ticket access</strong>
          <span className="event-meta">Door-ready digital tickets and check-in.</span>
        </div>
      </div>

      <div className="card card-body why-wrap">
        <p className="kicker">Why Ekotix?</p>
        <p className="why-copy">
          Ekotix is an all-in-one event platform designed to help organizers host, manage, and monetize
          events with ease. From intimate gatherings to large-scale experiences, you get practical tools
          to run every phase with confidence.
        </p>
      </div>

      <div className="card card-body stack offer-wrap">
        <h3 className="section-title offer-title">What does Ekotix offer?</h3>
        <div className="offer-grid">
          {OFFER_ITEMS.map((item) => (
            <article key={item.title} className="offer-card">
              <span className="offer-icon" aria-hidden="true">{item.icon}</span>
              <strong>{item.title}</strong>
              <p className="event-meta">{item.description}</p>
            </article>
          ))}
        </div>
        <p className="offer-more">And more.</p>
      </div>

      <div className="card card-body pricing-wrap">
        <div>
          <strong className="pricing-title">Simple pricing</strong>
          <p className="event-meta">Free events are free. Paid events apply 5% + ₦100 to buyer total.</p>
        </div>
        <Link to="/register" className="btn btn-primary">Start hosting</Link>
      </div>

      {/* <div className="card app-download-wrap">
        <div className="app-download-media">
          <img src="/images/regispic.png" alt="Ekotix mobile app preview" />
        </div>
        <div className="app-download-content">
          <p className="kicker">Download Ekotix</p>
          <h3>Host, manage, and monetize your events on any device.</h3>
          <p className="event-meta">Use the mobile experience to stay on top of events from anywhere.</p>
          <div className="app-download-actions">
            <a
              href="https://apps.apple.com/us/app/troop-the-party-app/id6476594192"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-primary"
            >
              App Store
            </a>
            <a
              href="https://play.google.com/store/apps/details?id=com.samabdul.troopapp"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-ghost"
            >
              Google Play
            </a>
          </div>
        </div>
      </div> */}

      <div className="card card-body stack faq-wrap">
        <h3 className="section-title faq-title">Frequently asked questions</h3>
        <p className="faq-subtitle">Everything you need to know before you book or host.</p>
        {FAQ_ITEMS.map((item, index) => (
          <button
            key={item.q}
            type="button"
            className="faq-item"
            onClick={() => setOpenFaq(openFaq === index ? null : index)}
          >
            <div className="row">
              <span>{item.q}</span>
              <span>{openFaq === index ? "−" : "+"}</span>
            </div>
            {openFaq === index ? <p className="event-meta faq-answer">{item.a}</p> : null}
          </button>
        ))}
      </div>

    </section>
  );
};

export default Home;
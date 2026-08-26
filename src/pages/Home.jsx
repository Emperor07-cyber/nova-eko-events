import React, { useEffect, useMemo, useState } from "react";
import { database } from "../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import {
  FiArrowRight,
  FiCheck,
  FiChevronDown,
  FiCreditCard,
  FiSearch,
  FiShield,
} from "react-icons/fi";
import "./home-troop.css";

const FAQ_ITEMS = [
  {
    q: "How do I create an event?",
    a: "Register as a host, complete your setup, create your event, add ticket types, and publish it when you're ready.",
  },
  {
    q: "How do I buy tickets?",
    a: "Open an event, choose your preferred ticket type, enter your details, and complete your payment securely.",
  },
  {
    q: "Can I get a refund?",
    a: "Refund policies are managed by individual event organizers. Please check the event details or contact the organizer.",
  },
  {
    q: "How do I contact support?",
    a: "You can reach the Ekotix support team at support@ekotix.com.",
  },
];

const CATEGORIES = [
  "All",
  "Nightlife",
  "Concert",
  "Festival",
  "Business",
  "Workshop",
  "Sports",
];

const HERO_STATS = [
  { value: "2K+", label: "Events hosted" },
  { value: "90K+", label: "Tickets issued" },
  { value: "24/7", label: "Buyer support" },
];

const OFFER_ITEMS = [
  {
    image: "/images/whyekotixx.jpeg",
    title: "Host events effortlessly",
    description:
      "Set up your event page in minutes and start selling tickets right away.",
  },
  {
    image: "/images/Smartticket.jpeg",
    title: "Smart ticketing",
    description:
      "Share event links instantly and let guests buy tickets or RSVP with a simple and seamless flow.",
  },
  {
    image: "/images/quickpay.jpeg",
    title: "Quick pay at the gate",
    description:
      "Let attendees pay and check in on the spot with fast, secure payments.",
  },
  {
    image: "/images/eventdashboard.jpeg",
    title: "Event dashboard",
    description:
      "Track sales, manage ticket tiers, monitor engagement, and stay in control of your events.",
  },
  {
    image: "/images/merch.jpeg",
    title: "Merch integration",
    description:
      "Attach merchandise to your event pages so attendees can browse and purchase with ease.",
  },
  {
    image: "/images/checkin.jpeg",
    title: "Check-in and security",
    description:
      "Scan tickets, verify guests instantly, and manage attendance with real-time data.",
  },
];


const formatDate = (dateStr) => {
  if (!dateStr || dateStr === "TBA") {
    return "To be announced";
  }

  // Handle YYYY-MM-DD safely
  if (typeof dateStr === "string" && /^\d{4}-\d{2}-\d{2}$/.test(dateStr)) {
    const [year, month, day] = dateStr.split("-");

    const date = new Date(year, month - 1, day);

    return date.toLocaleDateString("en-GB", {
      weekday: "short",
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const date = new Date(dateStr);

  if (Number.isNaN(date.getTime())) {
    console.log("Invalid event date:", dateStr);
    return "To be announced";
  }

  return date.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
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
        .filter((event) => (event.visibility || "public") !== "private")
        .filter((event) => {
          // Events without a date should still appear
          if (!event.date || event.date === "TBA") {
            return true;
          }

          // Hide events whose date has already passed
          return new Date(event.date) >= now;
        })
        .sort((a, b) => {
          // Events without dates go after dated events
          const aHasNoDate = !a.date || a.date === "TBA";
          const bHasNoDate = !b.date || b.date === "TBA";

          if (aHasNoDate && bHasNoDate) return 0;
          if (aHasNoDate) return 1;
          if (bHasNoDate) return -1;

          return new Date(a.date) - new Date(b.date);
        });

      setEvents(rows);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const filteredEvents = useMemo(() => {
    if (activeCategory === "All") return events;

    return events.filter(
      (event) => event.category === activeCategory
    );
  }, [events, activeCategory]);

  const displayEvents = filteredEvents.slice(0, 9);

  const getEventLink = (event) => {
    if (event.eventUrl) {
      try {
        return new URL(event.eventUrl).pathname;
      } catch (error) {
        console.warn(
          "Invalid eventUrl, falling back to event id route",
          error
        );
      }
    }

    return `/event/${event.id}`;
  };

  const getMinPrice = (tickets) => {
    if (!Array.isArray(tickets) || tickets.length === 0) {
      return "Free";
    }

    const prices = tickets
      .map((ticket) => Number(ticket.price))
      .filter((price) => price > 0);

    return prices.length
      ? `₦${Math.min(...prices).toLocaleString()}`
      : "Free";
  };

  return (
    <main className="home-troop">
      {/* HERO */}
      <section className="home-hero">
        <div className="home-hero-content">
          <p className="home-kicker">
            Nigeria&apos;s event platform
          </p>

          <h1>
            Find events
            <span> worth your time.</span>
          </h1>

          <p className="home-hero-description">
            Discover nightlife, concerts, workshops, festivals,
            and unforgettable experiences. Find your next event
            and get your tickets in seconds.
          </p>

          <div className="home-proof">
            <span>
              <FiCheck />
              Secure checkout
            </span>

            <span>
              <FiCheck />
              Instant QR ticket
            </span>

            <span>
              <FiCheck />
              Trusted hosts
            </span>
          </div>

          <div className="home-hero-actions">
            <Link
              to="/eventlist"
              className="home-btn home-btn-primary"
            >
              Browse events
              <FiArrowRight />
            </Link>

            <Link
              to="/register"
              className="home-btn home-btn-secondary"
            >
              Host an event
            </Link>
          </div>

          <div className="home-stats">
            {HERO_STATS.map((item) => (
              <div
                key={item.label}
                className="home-stat"
              >
                <strong>{item.value}</strong>
                <span>{item.label}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="home-hero-image">
          <img
            src="/images/nova-1.jpg"
            alt="Ekotix events"
          />

          <div className="home-hero-image-overlay" />

          <div className="home-hero-image-badge">
            <span>Discover</span>
            <strong>Events happening near you</strong>
          </div>
        </div>
      </section>

      {/* CATEGORIES */}
      <section className="home-categories">
        <div className="category-scroll">
          {CATEGORIES.map((category) => (
            <button
              key={category}
              type="button"
              className={`category-chip ${
                activeCategory === category
                  ? "category-chip-active"
                  : ""
              }`}
              onClick={() =>
                setActiveCategory(category)
              }
            >
              {category}
            </button>
          ))}
        </div>
      </section>

      {/* EVENTS */}
      <section className="home-section">
        <div className="section-heading">
          <div>
            <p className="home-kicker">
              Explore Ekotix
            </p>

            <h2>
              {activeCategory === "All"
                ? "Upcoming events"
                : activeCategory}
            </h2>

            <p>
              Discover experiences created by amazing hosts.
            </p>
          </div>

          {events.length > 9 && (
            <Link
              to="/eventlist"
              className="section-link"
            >
              View all
              <FiArrowRight />
            </Link>
          )}
        </div>

        {loading ? (
          <div className="events-grid">
            {Array.from({ length: 6 }).map(
              (_, index) => (
                <div
                  key={index}
                  className="event-skeleton"
                />
              )
            )}
          </div>
        ) : displayEvents.length === 0 ? (
          <div className="empty-events">
            <div className="empty-events-icon">
              <FiSearch />
            </div>

            <h3>No events found</h3>

            <p>
              There are no upcoming events in this category yet.
              Try another category or check back soon.
            </p>

            <button
              type="button"
              className="home-btn home-btn-secondary"
              onClick={() =>
                setActiveCategory("All")
              }
            >
              Show all events
            </button>
          </div>
        ) : (
          <div className="events-grid">
            {displayEvents.map((event) => (
              <Link
                key={event.id}
                to={getEventLink(event)}
                className="event-card"
              >
                <div className="event-card-image">
                  <img
                    src={
                      event.image ||
                      "/images/nova-5.jpg"
                    }
                    alt={event.title}
                    loading="lazy"
                  />

                  <span className="event-price">
                    {getMinPrice(event.tickets)}
                  </span>
                </div>

                <div className="event-card-content">
                  <h3>{event.title}</h3>

                  <p className="event-details">
  {formatDate(event.date)}
  {event.date && event.date !== "TBA" && event.startTime
    ? ` · ${event.startTime}`
    : ""}
</p>

                  <p className="event-location">
                    {event.location || "Location TBA"}
                  </p>

                  <div className="event-card-footer">
                    <span>Get tickets</span>
                    <FiArrowRight />
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </section>

      {/* FEATURES */}
      <section className="quick-features">
        <div className="quick-feature">
          <div className="quick-feature-icon">
            <FiSearch />
          </div>

          <div>
            <strong>Discover events</strong>
            <p>
              Explore events by category and experience.
            </p>
          </div>
        </div>

        <div className="quick-feature">
          <div className="quick-feature-icon">
            <FiCreditCard />
          </div>

          <div>
            <strong>Buy in seconds</strong>
            <p>
              Enjoy a simple and secure checkout experience.
            </p>
          </div>
        </div>

        <div className="quick-feature">
          <div className="quick-feature-icon">
            <FiShield />
          </div>

          <div>
            <strong>QR ticket access</strong>
            <p>
              Get instant digital tickets ready for entry.
            </p>
          </div>
        </div>
      </section>

      {/* WHY EKOTIX */}
      <section className="why-ekotix">
        <div className="why-ekotix-image">
          <img
            src="/images/ekotixx.jpeg"
            alt="Why Ekotix"
          />
        </div>

        <div className="why-ekotix-content">
          <p className="home-kicker">
            Why Ekotix?
          </p>

          <h2>
            Everything you need to run
            <span> better events.</span>
          </h2>

          <p>
            Ekotix is an all-in-one event platform designed to
            help organizers host, manage, and monetize events
            with ease.
          </p>

          <p>
            From intimate gatherings to large-scale experiences,
            you get practical tools to manage ticket sales,
            attendees, check-ins, and more.
          </p>

          <Link
            to="/register"
            className="home-btn home-btn-primary"
          >
            Start hosting
            <FiArrowRight />
          </Link>
        </div>
      </section>

      {/* OFFER */}
      <section className="home-section">
        <div className="section-heading section-heading-center">
          <div>
            <p className="home-kicker">
              Built for organizers
            </p>

            <h2>What does Ekotix offer?</h2>

            <p>
              Powerful tools to help you create better event
              experiences.
            </p>
          </div>
        </div>

        <div className="offer-grid">
          {OFFER_ITEMS.map((item) => (
            <article
              key={item.title}
              className="offer-card"
            >
              <div className="offer-card-image">
                <img
                  src={item.image}
                  alt={item.title}
                  loading="lazy"
                />
              </div>

              <div className="offer-card-content">
                <h3>{item.title}</h3>

                <p>{item.description}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      {/* PRICING */}
      <section className="pricing-banner">
        <div>
          <p className="home-kicker">
            Transparent pricing
          </p>

          <h2>Simple pricing. No surprises.</h2>

          <p>
            Free events are free. Paid events apply a 5% + ₦100
            service charge to the buyer total.
          </p>
        </div>

        <Link
          to="/register"
          className="home-btn home-btn-primary"
        >
          Start hosting
          <FiArrowRight />
        </Link>
      </section>

      {/* FAQ */}
      <section className="faq-section">
        <div className="section-heading section-heading-center">
          <div>
            <p className="home-kicker">
              Need help?
            </p>

            <h2>Frequently asked questions</h2>

            <p>
              Everything you need to know before you book or host.
            </p>
          </div>
        </div>

        <div className="faq-list">
          {FAQ_ITEMS.map((item, index) => {
            const isOpen = openFaq === index;

            return (
              <div
                key={item.q}
                className={`faq-item ${
                  isOpen ? "faq-item-open" : ""
                }`}
              >
                <button
                  type="button"
                  className="faq-question"
                  onClick={() =>
                    setOpenFaq(
                      isOpen ? null : index
                    )
                  }
                >
                  <span>{item.q}</span>

                  <FiChevronDown />
                </button>

                {isOpen && (
                  <div className="faq-answer">
                    <p>{item.a}</p>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </section>
    </main>
  );
};

export default Home;
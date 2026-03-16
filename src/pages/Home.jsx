import React, { useEffect, useState } from "react";
import { database } from "../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import { FaPercentage } from "react-icons/fa";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/autoplay";

const PARTY_IMAGES = [
  "/images/nova1.jpg",
  "/images/nova2.jpg",
  "/images/nova3.jpg",
  "/images/nova4.jpg",
];

const FAQ_ITEMS = [
  { q: "How do I create an event?", a: 'Click "Create Event" in the navigation bar, fill in your details, and publish.' },
  { q: "How do I buy tickets?", a: 'Browse events, select an event, and click "Get Ticket". Payments are handled via Paystack.' },
  { q: "Can I get a refund?", a: "Refunds depend on the event organizer's policy. Contact them directly for support." },
  { q: "How do I contact support?", a: "You can reach out via our contact page or email support@ekotixx.com." },
  { q: "What is your refund policy?", a: "Refunds depend on the event organizer's policy. Contact them directly for support." },
];

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [openFaq, setOpenFaq] = useState(null); // ← track which FAQ is open

  useEffect(() => {
    const eventsRef = ref(database, "events");
    const unsubscribe = onValue(
      eventsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const now = new Date();
          const eventList = Object.keys(data)
            .map((key) => ({ id: key, ...data[key] }))
            .filter((event) => new Date(event.date) >= now);
          setEvents(eventList);
        } else {
          setEvents([]);
        }
        setLoading(false);
      },
      (err) => {
        console.error("Error fetching events:", err);
        setError("Failed to load events");
        setLoading(false);
      }
    );
    return () => unsubscribe();
  }, []);

  const trendingEvents = [...events].sort(() => 0.5 - Math.random()).slice(0, 4);

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  return (
    <>
      <Header />
      <div className="home">

        {/* ── Hero ── */}
        <section className="hero-split">
          <div className="hero-text">
            <h1>Unlock unforgettable experiences with EKOTIX</h1>
            <p>
              We offer a seamless, user-friendly platform to discover and book tickets to the events you love.
              Enjoy swift payment processing and secure gateway access, ensuring a hassle-free journey from
              event selection to attendance. Your next adventure is just a click away!
            </p>
            <div className="hero-buttons">
              <Link to="/eventlist"><button className="btn purple">Find Events</button></Link>
              <Link to="/event/new"><button className="btn outline">Create Events</button></Link>
            </div>
          </div>
          <div className="hero-image">
            <img src="/images/nova-2.jpg" alt="Hero" />
          </div>
        </section>

        <section className="party-carousel-section">
          <div className="marquee-track">
            <div className="marquee-inner">
              {[...PARTY_IMAGES, ...PARTY_IMAGES, ...PARTY_IMAGES].map((src, idx) => (
                <div className="marquee-item" key={idx}>
                  <img src={src} alt={`party ${idx}`} />
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Trending Events ── */}
        <section className="trending-section">
          <div className="trending-header">
            <h2>🔥 Trending Events</h2>
            {events.length > 4 && (
              <Link to="/eventlist" className="view-more-link">View More »</Link>
            )}
          </div>

          {loading && <div className="loading">Loading events...</div>}
          {error && <div className="error">{error}</div>}

          <div className="event-grid">
            {trendingEvents.map((event) => (
              
              <Link 
  to={event.eventUrl ? new URL(event.eventUrl).pathname : `/event/${event.id}`} 
  className="el-card" 
  key={event.id}
>
                <div className="event-card-image-wrapper">
                  <img
                    src={event.image || "/default-event.jpg"}
                    alt={event.title}
                    className="event-image"
                  />
                </div>
                <div className="event-info">
                  <h3 className="event-title">{event.title}</h3>
                  <p className="event-description">{event.description}</p>
                  <div className="event-meta">
                    <span>📅 {event.date}</span>
                    <span>🕐 {event.startTime || "TBA"}</span>
                    <span>📍 {event.location}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>

        {/* ── Pricing ── */}
        <section className="pricing-section">
          <h2>Pricing</h2>
          <p>Only pay when you sell tickets. Free events are completely free.</p>
          <div className="pricing-cards">
            <div className="pricing-card">
              <FaPercentage size={24} />
              <h3>5% + ₦100</h3>
              <p>Per paid ticket sold</p>
            </div>
          </div>
          <p style={{ textAlign: "center" }}>
            By hosting with us, you agree to our <Link to="/terms">Terms &amp; Conditions</Link>.
          </p>
        </section>

        {/* ── FAQ (Accordion) ── */}
        <section className="faq-page">
          <h1>Frequently Asked Questions</h1>
          {FAQ_ITEMS.map((item, i) => (
            <div
              className={`faq-item${openFaq === i ? " faq-item--open" : ""}`}
              key={i}
              onClick={() => toggleFaq(i)}
              style={{ cursor: "pointer" }}
            >
              <h3 style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                {item.q}
                <span style={{ fontSize: "1.2rem", transition: "transform 0.3s", transform: openFaq === i ? "rotate(45deg)" : "rotate(0deg)" }}>
                  +
                </span>
              </h3>
              {openFaq === i && (
                <p style={{ marginTop: "0.5rem", animation: "fadeIn 0.2s ease" }}>
                  {item.a}
                </p>
              )}
            </div>
          ))}
        </section>

      </div>

      {/* ── Bottom Swiper ── */}
      <div className="details-image" style={{ height: "500px" }}>
        <Swiper
          spaceBetween={30}
          centeredSlides={true}
          autoplay={{ delay: 2500, disableOnInteraction: false }}
          pagination={{ clickable: true }}
          modules={[Autoplay, Pagination]}
          className="mySwiper"
        >
          {["/images/nova-1.jpg", "/images/nova-3.jpg", "/images/nova-4.jpg", "/images/nova-5.jpg", "/images/nova-6.jpg"].map((src, i) => (
            <SwiperSlide key={i}>
              <img src={`${src}?1642213146`} alt="Details" style={{ width: "100%", height: "400px", objectFit: "contain" }} />
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <Footer />
    </>
  );
};

export default Home;

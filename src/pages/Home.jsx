import React, { useEffect, useState } from "react";
import { database } from "../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import Countdown from "../components/Layout/countdown";
import { FaCog, FaPercentage, FaLock } from "react-icons/fa";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, Pagination } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/autoplay";

const Home = () => {
  const [events, setEvents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const eventsRef = ref(database, "events");

    const unsubscribe = onValue(
      eventsRef,
      (snapshot) => {
        const data = snapshot.val();
        if (data) {
          const now = new Date();
          const eventList = Object.keys(data)
            .map((key) => ({
              id: key,
              ...data[key],
            }))
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

  const trendingEvents = [...events]
    .sort(() => 0.5 - Math.random())
    .slice(0, 3);

  return (
    <>
      <Header />

      <div className="home">
        <section className="hero-split">
  <div className="hero-text">
    <h1>Unlock unforgettable experiences with EKOTIX</h1>
    <p>
      We offer a seamless, user-friendly platform to discover 
              and book tickets to the events you love. <br /> Enjoy swift payment
               processing and secure gateway access, ensuring a hassle-free 
               journey from event selection to attendance. Your next adventure is just a click away!
    </p>
    <div className="hero-buttons">
      <Link to="/eventlist">
        <button className="btn purple">Find Events</button>
      </Link>
      <Link to="/event/new">
        <button className="btn outline">Create Events</button>
      </Link>
    </div>
  </div>

  <div className="hero-image">
    <img src="/images/nova-2.jpg" alt="Hero" />
  </div>
</section>


        <section className="party-carousel-section">
  {/* <h2 className="carousel-title">🎉 Party Moments</h2> */}
  <div className="carousel-wrapper">
    <Swiper
  modules={[Autoplay]}
  spaceBetween={8}
  slidesPerView={1}
  loop={true}
  autoplay={{
    delay: 1000,
    disableOnInteraction: false,
  }}
  breakpoints={{
    0: { slidesPerView: 1 }, // ✅ added for extra safety
    460: { slidesPerView: 1 },
    640: { slidesPerView: 2 },
    1024: { slidesPerView: 3 },
  }}
>

      {[
        "/images/nova1.jpg",
        "/images/nova2.jpg",
        "/images/nova3.jpg",
        "/images/nova4.jpg",

      ].map((src, idx) => (
        <SwiperSlide key={idx}>
          <img src={src} alt={`party ${idx}`} className="carousel-image" />
        </SwiperSlide>
      ))}
    </Swiper>
  </div>
</section>
<section className="featured-party-section">
  <h2>🎤 Featured Party of the Week</h2>
  {events.length > 0 && (
    <div className="featured-card">
      <img src={events[1]?.image || "/default-event.jpg"} alt="Featured" />
      <div className="featured-details">
        <h3>{events[1]?.title}</h3>
        <p>{events[1]?.date} @ {events[1]?.location}</p>
        <Link to={`/event/${events[1]?.id}`}>
          <button className="btn">Check it out</button>
        </Link>
      </div>
    </div>
  )}
</section>

{/* {events.length > 0 && (
  <section className="countdown-section">
    <h2>⏳ Next Party Countdown</h2>
    <div className="countdown-timer">
      <Countdown targetDate={new Date(events[0].date)} />
    </div>
  </section>
)} */}
        <section className="trending-section">
  <h2>🔥 Trending Events</h2>

  {loading && <div className="loading">Loading events...</div>}
  {error && <div className="error">{error}</div>}

  <div className="event-grid">
    {trendingEvents.map((event) => (
      <div className="event-card" key={event.id}>
        <img
          src={event.image || "/default-event.jpg"}
          alt={event.title}
          className="event-image"
        />
        <div className="event-info">
          <h3>{event.title}</h3>
          <p>
            {event.date} @ {event.location}
          </p>

          {event.tickets?.length > 0 && (
            <p className="ticket-price">
              From ₦{Math.min(...event.tickets.map((t) => t.price))}
            </p>
          )}

          <Link to={`/event/${event.id}`}>
            <button className="btn primary">Get Tickets</button>
          </Link>
        </div>
      </div>
    ))}
  </div>

  {events.length > 3 && (
    <div className="see-more-container">
      <Link to="/eventlist">
        <button className="btn outline">See More Events</button>
      </Link>
    </div>
  )}
</section>


        <section className="pricing-section">
        <h2>Pricing</h2>
        <p>Only pay when you sell tickets. Free events are completely free.</p>
        <div className="pricing-cards">
          <div className="pricing-card">
            <FaPercentage size={24} />
            <h3>5% + ₦100</h3>
            <p>Per paid ticket sold</p>
          </div>
            {/* <FaLock size={24} /><h3>₦0</h3><p>For free tickets</p>            */}
          
        </div>
        <p style={{ textAlign: "center" }}>
          By hosting with us, you agree to our <Link to="/terms">Terms & Conditions</Link>.
        </p>
      </section>

        <section className="faq-page">
        <h1>Frequently Asked Questions</h1>

        <div className="faq-item">
          <h3>How do I create an event?</h3>
          <p>Click “Create Event” in the navigation bar, fill in your details, and publish.</p>
        </div>

        <div className="faq-item">
          <h3>How do I buy tickets?</h3>
          <p>Browse events, select an event, and click “Get Ticket”. Payments are handled via Paystack.</p>
        </div>

        <div className="faq-item">
          <h3>Can I get a refund?</h3>
          <p>Refunds depend on the event organizer’s policy. Contact them directly for support.</p>
        </div>

        <div className="faq-item">
          <h3>How do I contact support?</h3>
          <p>You can reach out via our contact page or email support@yourapp.com.</p>
        </div>
        <div className="faq-item">
          <h3>What is your refund policy?</h3>
          <p>Refunds depend on the event organizer's policy. Contact them directly for support.</p>
        </div>        
      </section>
      </div>

      <div className="details-image" style={{ height: "500px" }}>



        <Swiper
          spaceBetween={30}
          centeredSlides={true}
          autoplay={{
            delay: 2500,
            disableOnInteraction: false,
          }}
          pagination={{
            clickable: true,
          }}
          modules={[Autoplay, Pagination]}
          className="mySwiper"
        >
          <SwiperSlide>
            <img src="/images/nova-1.jpg?1642213146" alt="Details" style={{ width: "100%", height: "400px", objectFit: "contain"  }} />
          </SwiperSlide>
          <SwiperSlide>
            <img src="/images/nova-3.jpg?1642213146" alt="Details" style={{ width: "100%", height: "400px", objectFit: "contain"  }} />
          </SwiperSlide>
          <SwiperSlide>
            <img src="/images/nova-4.jpg?1642213146" alt="Details" style={{ width: "100%", height: "400px", objectFit: "contain"  }} />
          </SwiperSlide>
          <SwiperSlide>
            <img src="/images/nova-5.jpg?1642213146" alt="Details" style={{ width: "100%", height: "400px", objectFit: "contain"  }} />
          </SwiperSlide>
          <SwiperSlide>
            <img src="/images/nova-6.jpg?1642213146" alt="Details" style={{ width: "100%", height: "400px", objectFit: "contain"  }} />
          </SwiperSlide>
         
        </Swiper>


      </div>

      <Footer />
    </>
  );
};

export default Home;

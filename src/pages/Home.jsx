import React, { useEffect, useState } from "react";
import { database } from "../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import { FaCog, FaPercentage, FaLock } from 'react-icons/fa';

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
  .filter((event) => {
    const eventDate = new Date(event.date);
    return eventDate >= now;
  });
  console.log("Fetched events:", data);

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

    return () => unsubscribe(); // Clean up listener
  }, []);

  return (
    <>
      <Header />

      <div className="home">
        <section className="hero-section">
  <div className="hero-content">
    <h1>Your Front Row Seat<br />to Life's Best Moments</h1>
    <p>
      Effortlessly book your next unforgettable live experience with Nova Eko Events.
      Explore concerts, thrilling meetups, and captivating performances—all at your fingertips.
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
</section>
      

        <h1>Upcoming Events</h1>

{loading && <div className="loading">Loading events...</div>}
{error && <div className="error">{error}</div>}

<div className="event-list">
  {events.length === 0 ? (
    <p>No upcoming events.</p>
  ) : (
    [...events]
      .sort(() => 0.5 - Math.random())
      .slice(0, 3)
      .map((event) => (
        <div className="event-card" key={event.id}>
          <img
            src={event.image || "/default-event.jpg"}
            alt={event.title}
            className="event-image"
          />
          <h2>{event.title}</h2>
          <p>{event.date} @ {event.location}</p>

          {event.tickets && Array.isArray(event.tickets) && (
            <ul className="ticket-types">
              {event.tickets.map((ticket, idx) => (
                <li key={idx}>
                  {ticket.type} - ₦{ticket.price}
                </li>
              ))}
            </ul>
          )}

          <Link to={`/event/${event.id}`}>
            <button className="view-button">View & Buy Ticket</button>
          </Link>
        </div>
      ))
  )}
</div>

{events.length > 3 && (
  <div className="see-more-container">
    <Link to="/eventlist">
      <button className="btn outline">See More Events</button>
    </Link>
  </div>
)}
      </div>
   

<section className="pricing-section">
  <h2> Pricing</h2>
  <p>Hosting an event on Nova Eko Events is easy and affordable. Here’s how our pricing works:</p>
  <div className="pricing-details">

    <div className="pricing-cards">
  <div className="pricing-card">
    <FaCog />
    <h3>Initial Setup Fee</h3>
    <p>A one-time fee to cover initial setup and promotion.</p>
  </div>
  <div className="pricing-card">
    <FaPercentage />
    <h3>Commission</h3>
    <p>A small percentage of 5% for each ticket sold is retained as commission.</p>
  </div>
  <div className="pricing-card">
    <FaLock />
    <h3>Payment Processing</h3>
    <p>Secure handling of all transactions with minimal processing methods.</p>
  </div>
</div>
    <p>By hosting with us, you agree to our <Link to="/terms">Terms and Conditions</Link>, ensuring a seamless experience for you and your attendees.</p>
  </div>
</section>

<section className="faq-section">
  <h2>Frequently Asked Questions</h2>
  <div className="faq-item">
    <h3>What is Nova Eko Events?</h3>
    <p>Nova Eko Events is your go-to platform for booking unforgettable live experiences. From concerts to meetups, we have it all!</p>
  </div>
  <div className="faq-item">
    <h3>How do I book a ticket?</h3>
    <p>Simply browse our events, select the one you like, and click on "View & Buy Ticket" to get started.</p>
  </div>
  <div className="faq-item">
    <h3>Can I create my own event?</h3>
    <p>Yes, you can! Click on "Create Events" to add your event to our platform.</p>
  </div>
</section>


      <Footer />
    </>
  );
};

export default Home;


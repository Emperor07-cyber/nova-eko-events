import React, { useEffect, useState } from "react";
import { database } from "../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";

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
          const eventList = Object.keys(data).map((key) => ({
            id: key,
            ...data[key],
          }));
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
        <h1>Upcoming Events</h1>

        {loading && <div className="loading">Loading events...</div>}
        {error && <div className="error">{error}</div>}

        <div className="event-list">
          {events.length === 0 ? (
            <p>No upcoming events.</p>
          ) : (
            events.map((event) => (
              <div className="event-card" key={event.id}>
                <img
                  src={event.image || "/default-event.jpg"}
                  alt={event.title}
                  className="event-image"
                />
                <h2>{event.title}</h2>
                <p>
                  {event.date} @ {event.venue}
                </p>
                <Link to={`/event/${event.id}`}>
                  <button className="view-button">View & Buy Ticket</button>
                </Link>
              </div>
            ))
          )}
        </div>
      </div>

      <Footer />
    </>
  );
};

export default Home;

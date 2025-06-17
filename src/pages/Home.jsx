import React, { useEffect, useState } from "react";
import { database } from "../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import "./main.css"; // Optional: create for styling

const Home = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const eventsRef = ref(database, "events");
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const eventList = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setEvents(eventList);
      }
    });
  }, []);

  return (
    <div className="home">
      <h1>Upcoming Events</h1>
      <div className="event-list">
        {events.map((event) => (
          <div className="event-card" key={event.id}>
            <img src={event.image || "/default-event.jpg"} alt={event.title} />
            <h2>{event.title}</h2>
            <p>{event.date} @ {event.venue}</p>
            <Link to={`/event/${event.id}`}>
              <button>View & Buy Ticket</button>
            </Link>
          </div>
        ))}
      </div>
    </div>
  );
};

export default Home;

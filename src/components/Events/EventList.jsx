import React, { useEffect, useState } from "react";
import { database } from "../../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";

const EventList = () => {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const eventsRef = ref(database, "events");
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const loadedEvents = Object.keys(data).map((key) => ({
          id: key,
          ...data[key],
        }));
        setEvents(loadedEvents);
      }
    });
  }, []);

  return (
    <div className="event-list">
      {events.length === 0 ? (
        <p>No events available.</p>
      ) : (
        events.map((event) => (
          <div className="event-card" key={event.id}>
            <img src={event.image || "/default.jpg"} alt={event.title} />
            <h3>{event.title}</h3>
            <p>{event.date} | {event.venue}</p>
            <Link to={`/event/${event.id}`}>
              <button>View Details</button>
            </Link>
          </div>
        ))
      )}
    </div>
  );
};

export default EventList;
// Note: Ensure you have a default image at /default.jpg or adjust the path accordingly.
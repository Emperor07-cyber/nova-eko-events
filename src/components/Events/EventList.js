import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../../firebase/firebaseConfig";
import { Link } from "react-router-dom";

function EventList() {
  const [events, setEvents] = useState([]);

  useEffect(() => {
    const eventRef = ref(database, "events");
    onValue(eventRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const eventArray = Object.entries(data).map(([id, details]) => ({
          id,
          ...details,
        }));
        setEvents(eventArray.reverse()); // Most recent first
      } else {
        setEvents([]);
      }
    });
  }, []);

  return (
    <div className="container">
      <Link to="/create-event" className="link-button">
        + Create New Event
      </Link>

      <h2>Upcoming Events</h2>
      {events.length === 0 ? (
        <p>No events yet.</p>
      ) : (
        events.map((event) => (
          <div key={event.id} className="event-card">
            <h3>{event.title}</h3>
            <p>{event.description}</p>
            <p>₦{event.price}</p>
            <Link to={`/event/${event.id}`}>View Event</Link>
          </div>
        ))
      )}
    </div>
  );
}

export default EventList;

import React, { useEffect, useState } from "react";
import { database } from "../../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { Link } from "react-router-dom";
import Header1 from "../Layout/Header1";
import Footer from "../Layout/Footer";
import "../Events/eventlist.css"; // adjust path as needed

const EventList = () => {
  const [events, setEvents] = useState([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    const eventsRef = ref(database, "events");
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const now = new Date();
        const loadedEvents = Object.keys(data)
          .map((key) => ({ id: key, ...data[key] }))
          .filter((e) => new Date(e.date) >= now)
          .sort((a, b) => new Date(a.date) - new Date(b.date));
        setEvents(loadedEvents);
      }
    });
  }, []);

  const filtered = events.filter((e) =>
    e.title?.toLowerCase().includes(search.toLowerCase()) ||
    e.location?.toLowerCase().includes(search.toLowerCase())
  );

  const formatDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    return d.toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short", year: "numeric" });
  };

  return (
    <>
      <Header1 />
      <div className="eventlist-page">
        <div className="eventlist-header">
          <h2>Upcoming Events</h2>
          <input
            className="eventlist-search"
            type="text"
            placeholder="🔍 Search events..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>

        {filtered.length === 0 ? (
          <p className="eventlist-empty">No events found.</p>
        ) : (
          <div className="eventlist-grid">
            {filtered.map((event) => (
              <Link to={`/event/${event.id}`} className="el-card" key={event.id}>
                <div className="el-card-image">
                  <img src={event.image || "/default-event.jpg"} alt={event.title} />
                  {/* {event.tickets?.length > 0 && (
                    <span className="el-price-badge">
                      From ₦{Math.min(...event.tickets.map((t) => Number(t.price))).toLocaleString()}
                    </span>
                  )} */}
                </div>
                <div className="el-card-info">
                  <h3 className="el-title">{event.title}</h3>
                  <p className="el-desc">{event.description}</p>
                  <div className="el-meta">
                    <span>📅 {formatDate(event.date)}</span>
                    {event.startTime && <span>🕐 {event.startTime}</span>}
                    <span>📍 {event.location}</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </div>
      <Footer />
    </>
  );
};

export default EventList;
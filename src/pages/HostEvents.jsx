import React, { useEffect, useState } from "react";
import HostLayout from "../components/Layout/HostLayout";
import { database, auth } from "../firebase/firebaseConfig";
import { ref, onValue, remove } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";

const HostEvents = () => {
  const [user] = useAuthState(auth);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const eventsRef = ref(database, "events");
    const ticketsRef = ref(database, "tickets");

    const unsubscribeEvents = onValue(eventsRef, (eventsSnapshot) => {
      const eventsData = eventsSnapshot.val() || {};
      const userEvents = Object.entries(eventsData)
        .map(([id, val]) => ({ id, ...val }))
        .filter((event) => event.createdBy?.toLowerCase() === user.email?.toLowerCase());

      setEvents(userEvents);

      const unsubscribeTickets = onValue(ticketsRef, (ticketsSnapshot) => {
        const ticketsData = ticketsSnapshot.val() || {};
        const hostTickets = Object.entries(ticketsData)
          .map(([id, val]) => ({ id, ...val }))
          .filter((ticket) => userEvents.some((e) => e.id === ticket.eventId));
        setTickets(hostTickets);
      });

      return () => unsubscribeTickets();
    });

    return () => unsubscribeEvents();
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this event?")) {
      await remove(ref(database, `events/${id}`));
      alert("Event deleted.");
    }
  };

  const handleCopyLink = (event) => {
  const link = event.eventUrl
    ? event.eventUrl
    : `https://ekotixx.com/event/${event.id}`;
  navigator.clipboard.writeText(link);
  setCopiedId(event.id);
  setTimeout(() => setCopiedId(null), 2000);
};

  const getTicketCount = (eventId) =>
    tickets.filter((t) => t.eventId === eventId).length;

  const getRevenue = (eventId) =>
    tickets
      .filter((t) => t.eventId === eventId)
      .reduce((sum, t) => sum + (t.totalPaid || 0), 0);

  return (
    <HostLayout>
      <div className="section-header">
        <h2 className="section-title">🎫 My Events</h2>
        <button className="btn-primary" onClick={() => navigate("/event/new")}>
          + Create Event
        </button>
      </div>

      <div className="table-wrapper">
        <table className="host-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Location</th>
              <th>Tickets Sold</th>
              <th>Revenue</th>
              <th>Event Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={7} className="table-empty">No events found. Create your first event!</td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{event.date}</td>
                  <td>{event.location}</td>
                  <td>
                    <span style={{
                      fontWeight: 700,
                      color: getTicketCount(event.id) > 0 ? "#009f15" : "#94a3b8"
                    }}>
                      {getTicketCount(event.id)}
                    </span>
                  </td>
                  <td style={{ fontWeight: 600 }}>
                    ₦{getRevenue(event.id).toLocaleString()}
                  </td>
                  <td>
                    <button className="btn-copy-link" onClick={() => handleCopyLink(event)}>
                      {copiedId === event.id ? "✅ Copied!" : "🔗 Copy Link"}
                    </button>
                  </td>
                  <td className="action-btns">
                    <button className="btn-edit" onClick={() => navigate(`/event/edit/${event.id}`)}>Edit</button>
                    <button className="btn-delete" onClick={() => handleDelete(event.id)}>Delete</button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </HostLayout>
  );
};

export default HostEvents;

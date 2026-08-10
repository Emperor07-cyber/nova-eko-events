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
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const eventsRef = ref(database, "events");
    const ticketsRef = ref(database, "tickets");

    const unsubscribeEvents = onValue(eventsRef, (eventsSnapshot) => {
      const eventsData = eventsSnapshot.val() || {};
      const userEvents = Object.entries(eventsData)
        .map(([id, val]) => ({ id, ...val }))
        .filter((event) =>
          [event.createdBy, event.hostEmail].some(
            (ownerEmail) => ownerEmail?.toLowerCase() === user.email?.toLowerCase()
          ) || (event.hostUid && event.hostUid === user.uid)
        );

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
      ? event.eventUrl.replace("https://www.ekotixx.com/", "https://ekotixx.com/")
      : `https://ekotixx.com/event/${event.id}`;
    try {
      navigator.clipboard.writeText(link);
    } catch {
      const el = document.createElement("textarea");
      el.value = link;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedId(event.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleCopyScannerCode = (eventId, code) => {
    try {
      navigator.clipboard.writeText(code);
    } catch {
      const el = document.createElement("textarea");
      el.value = code;
      document.body.appendChild(el);
      el.select();
      document.execCommand("copy");
      document.body.removeChild(el);
    }
    setCopiedCode(eventId);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const getTicketCount = (eventId) =>
    tickets
      .filter((t) => t.eventId === eventId)
      .reduce((sum, t) => sum + (t.quantity || 1), 0);

  const getRevenue = (eventId) =>
    tickets
      .filter((t) => t.eventId === eventId)
      .reduce((sum, t) => sum + (t.totalPaid || 0), 0);

  return (
    <HostLayout>
      <div className="section-header">
        <h2 className="section-title">My Events</h2>
        <button className="btn-primary" onClick={() => navigate("/event/new")}>
          + Create Event
        </button>
      </div>

      <div className="table-wrapper">
        <table className="host-table host-table-stacked">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Location</th>
              <th>Tickets Sold</th>
              <th>Revenue</th>
              <th>Event Link</th>
              <th>Scanner Code</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={8} className="table-empty">No events found. Create your first event!</td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id}>
                  <td data-label="Title">{event.title}</td>
                  <td data-label="Date">{event.date === "TBA" ? "To be announced" : event.date}</td>
                  <td data-label="Location">{event.location}</td>
                  <td data-label="Tickets Sold">
                    <span className={`host-events-count ${getTicketCount(event.id) > 0 ? "is-active" : "is-empty"}`}>
                      {getTicketCount(event.id)}
                    </span>
                  </td>
                  <td className="host-events-revenue" data-label="Revenue">
                    ₦{getRevenue(event.id).toLocaleString()}
                  </td>
                  <td data-label="Event Link">
                    <button className="btn-copy-link" onClick={() => handleCopyLink(event)}>
                      {copiedId === event.id ? "Copied" : "Copy Link"}
                    </button>
                  </td>
                  <td data-label="Scanner Code">
                    {event.scannerCode ? (
                      <div className="host-scanner-wrap">
                        <span className="host-scanner-code">
                          {event.scannerCode}
                        </span>
                        <button
                          className="btn-copy-link host-scanner-copy-btn"
                          onClick={() => handleCopyScannerCode(event.id, event.scannerCode)}
                        >
                          {copiedCode === event.id ? "Copied" : "Copy"}
                        </button>
                      </div>
                    ) : (
                      <span className="host-muted-note">None</span>
                    )}
                  </td>
                  <td className="action-btns" data-label="Actions">
                    <button className="btn-copy-link" onClick={() => navigate(`/host/events/${event.id}`)}>View</button>
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

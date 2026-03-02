import React, { useEffect, useState } from "react";
import { ref, onValue, remove } from "firebase/database";
import { database, auth } from "../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { CSVLink } from "react-csv";
import { Link, useNavigate } from "react-router-dom";
import HostLayout from "../components/Layout/HostLayout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const HostDashboard = () => {
  const [user] = useAuthState(auth);
  console.log("🔁 HostDashboard rendered, user:", user?.email);

  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [balance, setBalance] = useState(0);
  const [copiedId, setCopiedId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    console.log("⚡ useEffect fired, user:", user?.email);
    if (!user) {
      console.log("❌ No user, returning early");
      return;
    }

    const eventsRef = ref(database, "events");
    const ticketsRef = ref(database, "tickets");

    console.log("📡 Setting up Firebase listeners...");

    const unsubscribeEvents = onValue(eventsRef, (eventsSnapshot) => {
      console.log("✅ Events snapshot received");
      const eventsData = eventsSnapshot.val() || {};

      const userEvents = Object.entries(eventsData)
        .map(([id, val]) => ({ id, ...val }))
        .filter((event) => event.createdBy?.toLowerCase() === user.email?.toLowerCase());

      console.log("🎯 userEvents found:", userEvents.length);
      setEvents(userEvents);

      const unsubscribeTickets = onValue(ticketsRef, (ticketsSnapshot) => {
        console.log("✅ Tickets snapshot received");
        const ticketsData = ticketsSnapshot.val() || {};
        const allTickets = Object.entries(ticketsData).map(([id, val]) => ({ id, ...val }));

        console.log("=== TICKET DEBUG ===");
        console.log("Total tickets in DB:", allTickets.length);
        console.log("UserEvents IDs:", userEvents.map(e => e.id));
        console.log("All ticket eventIds:", allTickets.map(t => t.eventId));
        console.log("====================");

        const hostTickets = allTickets.filter((ticket) =>
          userEvents.some((e) => e.id === ticket.eventId)
        );

        console.log("Matched hostTickets:", hostTickets.length);

        setTickets(hostTickets);

        let total = 0;
        hostTickets.forEach((ticket) => {
          const gross = ticket.totalPaid || 0;
          const fee = gross * 0.05 + 100;
          total += gross - fee;
        });
        setBalance(total);
      });

      return () => unsubscribeTickets();
    });

    return () => unsubscribeEvents();
  }, [user]);

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      await remove(ref(database, `events/${eventId}`));
      alert("Event deleted successfully.");
    }
  };

  const handleCopyLink = (eventId) => {
    const link = `${window.location.origin}/event/${eventId}`;
    navigator.clipboard.writeText(link);
    setCopiedId(eventId);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const totalRevenue = tickets.reduce((sum, t) => sum + (t.totalPaid || 0), 0);
  const totalAttendees = new Set(tickets.map((t) => t.email)).size;

  const salesData = Object.values(
    tickets.reduce((acc, ticket) => {
      const date = new Date(ticket.timestamp || Date.now()).toLocaleDateString();
      acc[date] = acc[date] || { date, total: 0 };
      acc[date].total += ticket.totalPaid || 0;
      return acc;
    }, {})
  );

  return (
    <HostLayout>
      <div className="wallet-card">
        <div className="wallet-card-inner">
          <span className="wallet-label">💳 Available Balance</span>
          <span className="wallet-amount">₦{balance.toLocaleString()}</span>
        </div>
      </div>

      <div className="summary-cards">
        <div className="summary-card">
          <span className="summary-icon">🎫</span>
          <div>
            <p className="summary-value">{tickets.length}</p>
            <p className="summary-label">Tickets Sold</p>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-icon">💰</span>
          <div>
            <p className="summary-value">₦{totalRevenue.toLocaleString()}</p>
            <p className="summary-label">Total Revenue</p>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-icon">📅</span>
          <div>
            <p className="summary-value">{events.length}</p>
            <p className="summary-label">Events</p>
          </div>
        </div>
        <div className="summary-card">
          <span className="summary-icon">👥</span>
          <div>
            <p className="summary-value">{totalAttendees}</p>
            <p className="summary-label">Attendees</p>
          </div>
        </div>
      </div>

      <div className="section-header">
        <h2 className="section-title">📋 My Events</h2>
        <Link to="/event/new">
          <button className="btn-primary">+ Create New Event</button>
        </Link>
      </div>

      <div className="table-wrapper">
        <table className="host-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Location</th>
              <th>Tickets Sold</th>
              <th>Event Link</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">No events yet. Create your first one!</td>
              </tr>
            ) : (
              events.map((event) => {
                const eventTickets = tickets.filter((t) => t.eventId === event.id);
                return (
                  <tr key={event.id}>
                    <td>{event.title}</td>
                    <td>{event.date}</td>
                    <td>{event.location}</td>
                    <td>
                      <span style={{
                        fontWeight: 700,
                        color: eventTickets.length > 0 ? "#009f15" : "#94a3b8"
                      }}>
                        {eventTickets.length}
                      </span>
                    </td>
                    <td>
                      <button className="btn-copy-link" onClick={() => handleCopyLink(event.id)}>
                        {copiedId === event.id ? "✅ Copied!" : "🔗 Copy Link"}
                      </button>
                    </td>
                    <td className="action-btns">
                      <button className="btn-edit" onClick={() => navigate(`/event/edit/${event.id}`)}>Edit</button>
                      <button className="btn-delete" onClick={() => handleDelete(event.id)}>Delete</button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      <h2 className="section-title" style={{ marginTop: "2rem" }}>📈 Sales Chart</h2>
      <div className="chart-wrapper">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={salesData}>
            <XAxis dataKey="date" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Bar dataKey="total" fill="#14c02b" radius={[4, 4, 0, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <CSVLink data={tickets} filename="host-tickets.csv" className="btn-csv">
        ⬇ Download CSV
      </CSVLink>
    </HostLayout>
  );
};

export default HostDashboard;

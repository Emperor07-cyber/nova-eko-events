import React, { useEffect, useState } from "react";
import { ref, onValue, remove } from "firebase/database";
import { database, auth } from "../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { CSVLink } from "react-csv";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const HostDashboard = () => {
  const [user] = useAuthState(auth);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const eventsRef = ref(database, "events");
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const userEvents = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .filter((event) => event.createdBy === user.email);
      setEvents(userEvents);
    });

    const ticketsRef = ref(database, "tickets");
    onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const hostTickets = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .filter((ticket) => events.some(e => e.id === ticket.eventId));
      setTickets(hostTickets);
    });
  }, [user]);

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event?")) {
      await remove(ref(database, `events/${eventId}`));
      alert("Event deleted successfully.");
    }
  };

  const totalRevenue = tickets.reduce((sum, t) => sum + (t.totalPaid || 0), 0);
  const totalAttendees = new Set(tickets.map(t => t.email)).size;

  const salesData = Object.values(
    tickets.reduce((acc, ticket) => {
      const date = new Date(ticket.timestamp || Date.now()).toLocaleDateString();
      acc[date] = acc[date] || { date, total: 0 };
      acc[date].total += ticket.totalPaid || 0;
      return acc;
    }, {})
  );

  return (
    <>
    <Header />
    <div className="host-dashboard">
      <h1>🎤 Host Dashboard</h1>

      {/* 1. Summary */}
      <div className="summary-cards">
        <div className="card">🎫 Total Tickets Sold: {tickets.length}</div>
        <div className="card">💰 Total Revenue: ₦{totalRevenue.toLocaleString()}</div>
        <div className="card">📅 Events Hosted: {events.length}</div>
        <div className="card">👥 Attendees: {totalAttendees}</div>
      </div>

      {/* 2. My Events */}
      <h2>📋 My Events</h2>
      <table className="events-table">
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Location</th>
            <th>Tickets Sold</th>
            <th>Actions</th>
          </tr>
        </thead>
        <tbody>
          {events.map(event => (
            <tr key={event.id}>
              <td>{event.title}</td>
              <td>{event.date}</td>
              <td>{event.location}</td>
              <td>{tickets.filter(t => t.eventId === event.id).length}</td>
              <td>
                <button onClick={() => navigate(`/event/edit/${event.id}`)}>Edit</button>
                <button onClick={() => handleDelete(event.id)} style={{ marginLeft: '0.5rem' }}>Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* 3. Sales Chart */}
      <h2>📈 Sales Chart</h2>
      <div style={{ width: "100%", height: 250 }}>
        <ResponsiveContainer>
          <BarChart data={salesData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#00A3FF" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* 4. Export */}
      <div className="export-section">
        <h2>🧾 Export Tickets</h2>
        <CSVLink data={tickets} filename="host-tickets.csv" className="export-btn">
          Download CSV
        </CSVLink>
      </div>

      {/* 5. Attendees Table */}
      <h2>👥 Attendees</h2>
      <table className="attendees-table">
        <thead>
          <tr>
            <th>Name</th>
            <th>Email</th>
            <th>Ticket Type</th>
            <th>Quantity</th>
            <th>Event</th>
          </tr>
        </thead>
        <tbody>
          {tickets.map(ticket => (
            <tr key={ticket.id}>
              <td>{ticket.name}</td>
              <td>{ticket.email}</td>
              <td>{ticket.ticketType}</td>
              <td>{ticket.quantity}</td>
              <td>{events.find(e => e.id === ticket.eventId)?.title || "N/A"}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
    <Footer />
    </>
  );
};

export default HostDashboard;

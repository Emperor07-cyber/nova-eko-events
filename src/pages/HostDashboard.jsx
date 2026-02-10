import React, { useEffect, useState } from "react";
import { ref, onValue, remove } from "firebase/database";
import { database, auth } from "../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { CSVLink } from "react-csv";
import { Link, useNavigate } from "react-router-dom";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";
import HostSidebar from "../components/Layout/HostSidebar";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

const HostDashboard = () => {
  const [user] = useAuthState(auth);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [balance, setBalance] = useState(0);
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
  }, [user]);

  useEffect(() => {
    if (!user || events.length === 0) return;

    const ticketsRef = ref(database, "tickets");
    onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const hostTickets = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .filter((ticket) => events.some(e => e.id === ticket.eventId));

      setTickets(hostTickets);

      let total = 0;
      hostTickets.forEach(ticket => {
        const gross = ticket.totalPaid || 0;
        const fee = gross * 0.05 + 100;
        total += gross - fee;
      });

      setBalance(total);
    });
  }, [user, events]);

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

      {/* ✅ LAYOUT WRAPPER */}
      <div className="host-layout">
        <HostSidebar />

        {/* ✅ MAIN CONTENT */}
        <div className="host-dashboard">
          <div className="wallet-card">
            <h2>💳 Wallet Balance</h2>
            <p>₦{balance.toLocaleString()}</p>
          </div>

          <Link to="/event/new">
            <button className="create-event-btn">+ Create New Event</button>
          </Link>

          <div className="summary-cards">
            <div className="card">🎫 Tickets Sold: {tickets.length}</div>
            <div className="card">💰 Revenue: ₦{totalRevenue.toLocaleString()}</div>
            <div className="card">📅 Events: {events.length}</div>
            <div className="card">👥 Attendees: {totalAttendees}</div>
          </div>

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
                    <button onClick={() => handleDelete(event.id)}>Delete</button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>

          <h2>📈 Sales Chart</h2>
          <div style={{ height: 250 }}>
            <ResponsiveContainer>
              <BarChart data={salesData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="total" fill="#00A3FF" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          <CSVLink data={tickets} filename="host-tickets.csv">
            Download CSV
          </CSVLink>
        </div>
      </div>

      <Footer />
    </>
  );
};

export default HostDashboard;

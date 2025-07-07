import React, { useEffect, useState } from "react";
import { ref, onValue } from "firebase/database";
import { database } from "../firebase/firebaseConfig";
import { CSVLink } from "react-csv";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import { remove } from "firebase/database"; // Also add this to your imports
import Header1 from "../components/Layout/Header1";
import Footer from "../components/Layout/Footer";

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [showEventList, setShowEventList] = useState(false);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const eventsRef = ref(database, "events");
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const eventsArray = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      setEvents(eventsArray);
    });

    const ticketsRef = ref(database, "tickets");
    onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const ticketsArray = Object.entries(data).map(([id, val]) => ({
        id,
        ...val,
        date: val.timestamp ? new Date(val.timestamp).toLocaleDateString() : "N/A",
      }));
      setTickets(ticketsArray);
    });
  }, []);

  const totalRevenue = tickets.reduce((acc, t) => acc + (t.totalPaid || 0), 0);
  const totalAttendees = new Set(tickets.map((t) => t.email)).size;

  const salesData = Object.values(
    tickets.reduce((acc, ticket) => {
      const date = new Date(ticket.timestamp).toLocaleDateString();
      acc[date] = acc[date] || { date, total: 0 };
      acc[date].total += ticket.totalPaid || 0;
      return acc;
    }, {})
  );

  const filteredTickets = tickets.filter(
    (t) =>
      t.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (events.find((e) => e.id === t.eventId)?.title || "")
        .toLowerCase()
        .includes(searchTerm.toLowerCase())
  );

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);
  const handleDeleteEvent = async (eventId) => {
  if (window.confirm("Are you sure you want to delete this event?")) {
    try {
      await remove(ref(database, "events/" + eventId));
      alert("Event deleted successfully.");
    } catch (error) {
      alert("Error deleting event: " + error.message);
    }
  }
};

  return (
    <>
    <Header1 />
    <div className="admin-dashboard">
      <h1>Admin Dashboard</h1>

      <div className="dashboard-card">
  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
    <h2>👁️ Total Events</h2>
    <FaEye
      style={{ cursor: "pointer", fontSize: "1.2rem", color: "#333" }}
      onClick={() => setShowEventList(!showEventList)}
      title="View Events"
    />
  </div>
  <p>{events.length}</p>
</div>
{showEventList && (
  <div className="event-modal">
    <h3>📋 Current Events</h3>
    <ul className="event-list">
      {events.map((event) => (
        <li key={event.id} className="event-item">
          <strong>{event.title}</strong>
          <div className="event-actions">
            <button title="Edit" onClick={() => navigate(`/edit-event/${event.id}`)}>
  <FaEdit />
</button>
            <button title="Delete" onClick={() => handleDeleteEvent(event.id)}><FaTrash /></button>
          </div>
        </li>
      ))}
    </ul>
  </div>
)}
      <div className="dashboard-summary">
        <div className="dashboard-card">
          <h2>💳 Tickets Sold</h2>
          <p>{tickets.length}</p>
        </div>
        <div className="dashboard-card">
          <h2>💰 Total Revenue</h2>
          <p>₦{totalRevenue.toLocaleString()}</p>
        </div>
        <div className="dashboard-card">
          <h2>👥 Unique Attendees</h2>
          <p>{totalAttendees}</p>
        </div>
      </div>

      <h2>📈 Sales Trends</h2>
      <div className="sales-chart-container">
        <ResponsiveContainer width="100%" height={250}>
          <BarChart data={salesData}>
            <XAxis dataKey="date" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="total" fill="#8884d8" />
          </BarChart>
        </ResponsiveContainer>
      </div>

      <div className="dashboard-table-container">
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem" }}>
          <input
            type="text"
            placeholder="Search by event or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            style={{ padding: "6px", width: "250px" }}
          />
          <CSVLink data={filteredTickets} filename="tickets.csv" className="export-button">
            🧾 Export to CSV
          </CSVLink>
        </div>

        <table className="dashboard-table">
          <thead>
            <tr>
              <th>Date</th>
              <th>Name</th>
              <th>Email</th>
              <th>Event</th>
              <th>Ticket Type</th>
              <th>Quantity</th>
              <th>Amount</th>
              <th>Transaction ID</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.map((ticket) => (
              <tr key={ticket.id}>
                <td>{ticket.date}</td>
                <td>{ticket.name}</td>
                <td>{ticket.email}</td>
                <td>{events.find((e) => e.id === ticket.eventId)?.title || "N/A"}</td>
                <td>{ticket.ticketType}</td>
                <td>{ticket.quantity}</td>
                <td>₦{ticket.totalPaid?.toLocaleString()}</td>
                <td>{ticket.transactionId}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Pagination Controls */}
        <div style={{ marginTop: "1rem", textAlign: "center" }}>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
            <button
              key={num}
              onClick={() => setCurrentPage(num)}
              style={{
                margin: "0 5px",
                padding: "5px 10px",
                background: currentPage === num ? "#333" : "#ddd",
                color: currentPage === num ? "#fff" : "#000",
                border: "none",
                borderRadius: "4px",
              }}
            >
              {num}
            </button>
          ))}
        </div>
      </div>
    </div>

    <Footer />
    </>
  );
};

export default AdminDashboard;

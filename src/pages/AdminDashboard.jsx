import React, { useEffect, useState } from "react";
import { ref, onValue, remove, update } from "firebase/database";
import { database } from "../firebase/firebaseConfig";
import { CSVLink } from "react-csv";
import { Link, useNavigate } from "react-router-dom";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
} from "recharts";
import { FaEye, FaEdit, FaTrash } from "react-icons/fa";
import Header1 from "../components/Layout/Header1";
import Footer from "../components/Layout/Footer";

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showEventList, setShowEventList] = useState(false);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    const eventsRef = ref(database, "events");
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setEvents(Object.entries(data).map(([id, val]) => ({ id, ...val })));
    });

    const ticketsRef = ref(database, "tickets");
    onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTickets(
        Object.entries(data).map(([id, val]) => ({
          id,
          ...val,
          date: val.timestamp ? new Date(val.timestamp).toLocaleDateString() : "N/A",
        }))
      );
    });

    const withdrawalsRef = ref(database, "withdrawalRequests");
    onValue(withdrawalsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const requestsArray = Object.entries(data)
        .map(([id, val]) => ({ id, ...val }))
        .sort((a, b) => b.timestamp - a.timestamp);
      setWithdrawals(requestsArray);
    });
  }, []);

  // ── Revenue calculations ──
  const totalRevenue = tickets.reduce((acc, t) => acc + (t.totalCharged || t.totalPaid || 0), 0);
  const platformRevenue = tickets.reduce((acc, t) => acc + ((t.hostFee || 0) + (t.serviceFee || 0)), 0);
  const hostPayouts = tickets.reduce((acc, t) => acc + (t.totalPaid || 0), 0);
  const totalAttendees = new Set(tickets.map((t) => t.email)).size;

  // Per-host breakdown
  const hostBreakdown = tickets.reduce((acc, t) => {
    const host = t.hostEmail || "Unknown";
    if (!acc[host]) acc[host] = { hostEmail: host, totalPaid: 0, tickets: 0 };
    acc[host].totalPaid += t.totalPaid || 0;
    acc[host].tickets += t.quantity || 1;
    return acc;
  }, {});

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
      t.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
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

  const handleWithdrawalStatus = async (id, status) => {
    try {
      await update(ref(database, `withdrawalRequests/${id}`), { status });
      alert(`Request marked as ${status}.`);
    } catch (err) {
      alert("Failed to update status: " + err.message);
    }
  };

  const getStatusBadge = (status) => {
    const map = {
      pending:   { bg: "#fff8e1", color: "#f59e0b" },
      completed: { bg: "#f0fdf4", color: "#009f15" },
      rejected:  { bg: "#fef2f2", color: "#ef4444" },
      approved:  { bg: "#eff6ff", color: "#3b82f6" },
    };
    const s = map[status] || map.pending;
    return (
      <span style={{
        background: s.bg, color: s.color,
        padding: "3px 10px", borderRadius: "20px",
        fontSize: "0.75rem", fontWeight: 600, textTransform: "capitalize",
      }}>
        {status}
      </span>
    );
  };

  const pendingCount = withdrawals.filter((w) => w.status === "pending").length;

  return (
    <>
      <Header1 />
      <div className="admin-dashboard">
        <h1>Admin Dashboard</h1>

        {/* Events Card */}
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
                    <button title="Edit" onClick={() => navigate(`/event/edit/${event.id}`)}>
                      <FaEdit />
                    </button>
                    <button title="Delete" onClick={() => handleDeleteEvent(event.id)}>
                      <FaTrash />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}

        {/* Summary Cards */}
        <div className="dashboard-summary">
          <div className="dashboard-card">
            <h2>🎫 Tickets Sold</h2>
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
          <div className="dashboard-card">
            <h2>💸 Withdrawal Requests</h2>
            <p>
              {withdrawals.length}
              {pendingCount > 0 && (
                <span style={{
                  marginLeft: "8px", background: "#f59e0b", color: "#fff",
                  borderRadius: "12px", padding: "2px 8px", fontSize: "0.75rem", fontWeight: 600,
                }}>
                  {pendingCount} pending
                </span>
              )}
            </p>
          </div>
        </div>

        {/* ── Revenue Breakdown ── */}
        <h2 style={{ marginTop: "2rem" }}>💵 Revenue Breakdown</h2>
        <div className="dashboard-summary">
          <div className="dashboard-card" style={{ borderLeft: "4px solid #14c02b" }}>
            <h2>🏦 Platform Earnings</h2>
            <p style={{ color: "#14c02b" }}>₦{platformRevenue.toLocaleString()}</p>
            <small style={{ color: "#888", fontSize: "0.8rem" }}>5% host fee + ₦100 service fee per ticket</small>
          </div>
          <div className="dashboard-card" style={{ borderLeft: "4px solid #3b82f6" }}>
            <h2>📤 Total Host Payouts</h2>
            <p style={{ color: "#3b82f6" }}>₦{hostPayouts.toLocaleString()}</p>
            <small style={{ color: "#888", fontSize: "0.8rem" }}>Amount owed to all hosts combined</small>
          </div>
        </div>

        {/* ── Per Host Breakdown ── */}
        <h2 style={{ marginTop: "2rem" }}>👤 Per Host Breakdown</h2>
        <div className="dashboard-table-container">
          <table className="dashboard-table">
            <thead>
              <tr>
                <th>Host Email</th>
                <th>Tickets Sold</th>
                <th>Amount to Pay Out</th>
              </tr>
            </thead>
            <tbody>
              {Object.values(hostBreakdown).map((host, i) => (
                <tr key={i}>
                  <td>{host.hostEmail}</td>
                  <td>{host.tickets}</td>
                  <td style={{ fontWeight: 600, color: "#3b82f6" }}>
                    ₦{host.totalPaid.toLocaleString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Create Event Button */}
        <div className="create-event-btn-wrapper">
          <Link to="/event/new">
            <button className="create-event-btn">+ Create New Event</button>
          </Link>
        </div>

        {/* Sales Chart */}
        <h2>📈 Sales Trends</h2>
        <div className="sales-chart-container">
          <ResponsiveContainer width="100%" height={250}>
            <BarChart data={salesData}>
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="total" fill="#14c02b" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Tickets Table */}
        <div className="dashboard-table-container">
          <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "1rem", flexWrap: "wrap", gap: "0.75rem" }}>
            <input
              type="text"
              placeholder="Search by event or email..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              style={{ padding: "6px 12px", border: "1px solid #e5e7eb", borderRadius: "6px", width: "250px" }}
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
                <th>Qty</th>
                <th>Host Earns</th>
                <th>Platform Earns</th>
                <th>Buyer Paid</th>
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
                  <td style={{ color: "#3b82f6", fontWeight: 600 }}>₦{(ticket.totalPaid || 0).toLocaleString()}</td>
                  <td style={{ color: "#14c02b", fontWeight: 600 }}>₦{((ticket.hostFee || 0) + (ticket.serviceFee || 0)).toLocaleString()}</td>
                  <td style={{ fontWeight: 600 }}>₦{(ticket.totalCharged || ticket.totalPaid || 0).toLocaleString()}</td>
                  <td>{ticket.transactionId}</td>
                </tr>
              ))}
            </tbody>
          </table>

          {/* Pagination */}
          <div style={{ marginTop: "1rem", textAlign: "center" }}>
            {Array.from({ length: totalPages }, (_, i) => i + 1).map((num) => (
              <button
                key={num}
                onClick={() => setCurrentPage(num)}
                style={{
                  margin: "0 4px", padding: "5px 10px",
                  background: currentPage === num ? "#14c02b" : "#f1f5f9",
                  color: currentPage === num ? "#fff" : "#333",
                  border: "none", borderRadius: "4px", cursor: "pointer",
                }}
              >
                {num}
              </button>
            ))}
          </div>
        </div>

        {/* ── Withdrawal Requests ── */}
        <h2 style={{ marginTop: "2.5rem" }}>
          💸 Withdrawal Requests
          {pendingCount > 0 && (
            <span style={{
              marginLeft: "10px", background: "#f59e0b", color: "#fff",
              borderRadius: "12px", padding: "3px 10px", fontSize: "0.8rem", fontWeight: 600,
            }}>
              {pendingCount} pending
            </span>
          )}
        </h2>

        <div className="dashboard-table-container">
          {withdrawals.length === 0 ? (
            <p style={{ color: "#888", padding: "1rem" }}>No withdrawal requests yet.</p>
          ) : (
            <table className="dashboard-table">
              <thead>
                <tr>
                  <th>Date</th>
                  <th>Host</th>
                  <th>Account Name</th>
                  <th>Account No.</th>
                  <th>Bank</th>
                  <th>Amount</th>
                  <th>Note</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {withdrawals.map((w) => (
                  <tr key={w.id}>
                    <td>{new Date(w.timestamp).toLocaleDateString()}</td>
                    <td style={{ fontSize: "0.85rem" }}>{w.hostEmail}</td>
                    <td>{w.accountName}</td>
                    <td><strong>{w.accountNumber}</strong></td>
                    <td>{w.bank}</td>
                    <td style={{ fontWeight: 600, color: "#009f15" }}>
                      ₦{w.amount?.toLocaleString()}
                    </td>
                    <td style={{ fontSize: "0.82rem", color: "#666" }}>{w.note || "—"}</td>
                    <td>{getStatusBadge(w.status)}</td>
                    <td>
                      {w.status === "pending" ? (
                        <div style={{ display: "flex", gap: "6px" }}>
                          <button
                            onClick={() => handleWithdrawalStatus(w.id, "completed")}
                            style={{
                              padding: "4px 10px", background: "#14c02b", color: "#fff",
                              border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem",
                            }}
                          >
                            ✅ Approve
                          </button>
                          <button
                            onClick={() => handleWithdrawalStatus(w.id, "rejected")}
                            style={{
                              padding: "4px 10px", background: "#ef4444", color: "#fff",
                              border: "none", borderRadius: "4px", cursor: "pointer", fontSize: "0.8rem",
                            }}
                          >
                            ❌ Reject
                          </button>
                        </div>
                      ) : (
                        <span style={{ fontSize: "0.8rem", color: "#94a3b8" }}>Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default AdminDashboard;
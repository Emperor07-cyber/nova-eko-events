import React, { useEffect, useState } from "react";
import { ref, onValue, remove, get } from "firebase/database";
import { database, auth } from "../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { CSVLink } from "react-csv";
import { Link, useNavigate } from "react-router-dom";
import HostLayout from "../components/Layout/HostLayout";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { FiCreditCard, FiDollarSign, FiTag, FiUsers } from "react-icons/fi";

const HostDashboard = () => {
  const [user] = useAuthState(auth);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [copiedId, setCopiedId] = useState(null);
  const [copiedCode, setCopiedCode] = useState(null);
  const navigate = useNavigate();

  // ── Withdrawals listener ──
  useEffect(() => {
    if (!user) return;
    const withdrawalsRef = ref(database, "withdrawalRequests");
    const unsubscribe = onValue(withdrawalsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const all = Object.entries(data).map(([id, val]) => ({ id, ...val }));
      const hostWithdrawals = all.filter(
        (w) => w.hostEmail?.toLowerCase().trim() === user.email?.toLowerCase().trim() && w.status?.trim() === "completed"
      );
      setWithdrawals(hostWithdrawals);
    });
    return () => unsubscribe();
  }, [user]);

  // ── Events + Tickets listener ──
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
        const allTickets = Object.entries(ticketsData).map(([id, val]) => ({ id, ...val }));

        const hostTickets = allTickets.filter((ticket) =>
          userEvents.some((e) => e.id === ticket.eventId)
        );

        setTickets(hostTickets);
      });

      return () => unsubscribeTickets();
    });

    return () => unsubscribeEvents();
  }, [user]);

  // ── Computed values ──
  const totalRevenue = tickets.reduce((sum, t) => sum + (t.totalPaid || 0), 0);
  const totalWithdrawn = withdrawals.reduce((sum, w) => sum + (w.amount || 0), 0);
  const balance = Math.max(0, totalRevenue - totalWithdrawn);
  const totalAttendees = new Set(tickets.map((t) => t.email)).size;
  const totalTicketsSold = tickets.reduce((sum, t) => sum + (t.quantity || 1), 0);
  const formatNaira = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

  const salesData = Object.values(
    tickets.reduce((acc, ticket) => {
      const date = new Date(ticket.timestamp || Date.now()).toLocaleDateString();
      acc[date] = acc[date] || { date, total: 0 };
      acc[date].total += ticket.totalPaid || 0;
      return acc;
    }, {})
  );

  const handleDelete = async (eventId) => {
    if (window.confirm("Are you sure you want to delete this event and all its tickets?")) {
      try {
        const ticketsRef = ref(database, "tickets");
        const snapshot = await get(ticketsRef);
        if (snapshot.exists()) {
          const ticketsData = snapshot.val();
          const deletePromises = Object.entries(ticketsData)
            .filter(([, ticket]) => ticket.eventId === eventId)
            .map(([ticketId]) => remove(ref(database, `tickets/${ticketId}`)));
          await Promise.all(deletePromises);
        }
        await remove(ref(database, `events/${eventId}`));
        alert("Event and all its tickets deleted successfully.");
      } catch (error) {
        alert("Error deleting event: " + error.message);
      }
    }
  };

  const handleCopyLink = (event) => {
    let link = event.eventUrl
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

  const scannerEvents = [...events]
    .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0))
    .slice(0, 5);

  return (
    <HostLayout>
      <section className="host-dash-hero">
        <div className="host-dash-hero-copy">
          <p className="host-dash-kicker">Host control center</p>
          <h1>Run your events with clarity</h1>
          <p>
            Track sales, tickets, scanner access, and payouts from one sleek dashboard.
          </p>
          <div className="host-dash-hero-actions">
            <Link to="/event/new" className="btn-primary">+ Create New Event</Link>
            <Link to="/host/events" className="btn-copy-link">Manage Events</Link>
            <Link to="/host/wallet" className="btn-copy-link">Open Wallet</Link>
          </div>
        </div>
        <div className="host-dash-balance-card">
          <span className="wallet-label">Available Balance</span>
          <span className="wallet-amount">{formatNaira(balance)}</span>
          <p>{events.length} active event{events.length === 1 ? "" : "s"} • {totalAttendees} attendees</p>
        </div>
      </section>

      <div className="summary-cards host-kpis">
        <div className="summary-card">
          <span className="summary-icon summary-icon-tickets" aria-hidden="true">
              <FiTag />
            </span>
            <div>
              <p className="summary-value">{totalTicketsSold}</p>
              <p className="summary-label">Tickets Sold</p>
            </div>
          </div>
          <div className="summary-card">
          <span className="summary-icon summary-icon-revenue" aria-hidden="true">
              <FiDollarSign />
            </span>
            <div>
              <p className="summary-value">{formatNaira(totalRevenue)}</p>
              <p className="summary-label">Total Revenue</p>
            </div>
          </div>
          <div className="summary-card">
          <span className="summary-icon summary-icon-withdrawn" aria-hidden="true">
              <FiCreditCard />
            </span>
            <div>
              <p className="summary-value">{formatNaira(totalWithdrawn)}</p>
              <p className="summary-label">Total Withdrawn</p>
            </div>
          </div>
          <div className="summary-card">
          <span className="summary-icon summary-icon-attendees" aria-hidden="true">
              <FiUsers />
            </span>
            <div>
              <p className="summary-value">{totalAttendees}</p>
              <p className="summary-label">Attendees</p>
            </div>
        </div>
      </div>

      <div className="host-dash-panel host-dash-codes-panel">
        <div className="section-header">
          <div>
            <h2 className="section-title">Scanner access codes</h2>
            <p className="section-subtitle">
              Each event code is copyable and can be used directly on the check-in page.
            </p>
          </div>
        </div>

        <div className="scanner-code-grid">
          {events.length === 0 ? (
            <p className="host-muted-note">No events available yet. Create an event to see its access code.</p>
          ) : (
            scannerEvents.map((event) => (
              <div key={event.id} className="scanner-code-card">
                <div>
                  <p className="scanner-code-title">{event.title}</p>
                  <p className="scanner-code-text">{event.scannerCode || "Not generated yet"}</p>
                </div>
                <button
                  className="btn-copy-link"
                  onClick={() => handleCopyScannerCode(event.id, event.scannerCode || "")}
                  disabled={!event.scannerCode}
                >
                  {copiedCode === event.id ? "Copied" : "Copy code"}
                </button>
              </div>
            ))
          )}
        </div>
        {events.length > scannerEvents.length ? (
          <p className="host-muted-note" style={{ marginTop: 12 }}>
            Showing the 5 most recent scanner codes. Use My Events for the full list.
          </p>
        ) : null}
      </div>

      <div className="host-dash-main-grid">
        <section className="host-dash-panel host-dash-panel-table">
          <div className="section-header">
            <h2 className="section-title">My Events</h2>
            <Link to="/event/new" className="btn-primary">+ Create New Event</Link>
          </div>

          <div className="table-wrapper">
            <table className="host-table host-table-stacked">
              <thead>
                <tr>
                  <th>Title</th>
                  <th>Date</th>
                  <th>Location</th>
                  <th>Tickets Sold</th>
                  <th>Event Link</th>
                  <th>Scanner Code</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {events.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="table-empty">No events yet. Create your first one!</td>
                  </tr>
                ) : (
                  events.map((event) => {
                    const eventTickets = tickets.filter((t) => t.eventId === event.id);
                    return (
                      <tr key={event.id}>
                        <td data-label="Title">{event.title}</td>
                        <td data-label="Date">{event.date === "TBA" ? "To be announced" : event.date}</td>
                        <td data-label="Location">{event.location}</td>
                        <td data-label="Tickets Sold">
                          <span className={`host-events-count ${eventTickets.length > 0 ? "is-active" : "is-empty"}`}>
                            {eventTickets.reduce((sum, t) => sum + (t.quantity || 1), 0)}
                          </span>
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
          <CSVLink data={tickets} filename="host-tickets.csv" className="btn-csv">
            Download CSV
          </CSVLink>
        </section>

        <section className="host-dash-panel host-dash-panel-chart">
          <h2 className="section-title">Sales Chart</h2>
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

          <div className="host-dash-insights">
            <div className="host-dash-insight">
              <span>Events</span>
              <strong>{events.length}</strong>
            </div>
            <div className="host-dash-insight">
              <span>Tickets</span>
              <strong>{totalTicketsSold}</strong>
            </div>
            <div className="host-dash-insight">
              <span>Payouts</span>
              <strong>{formatNaira(totalWithdrawn)}</strong>
            </div>
          </div>
        </section>
      </div>
    </HostLayout>
  );
};

export default HostDashboard;

import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue, remove, get } from "firebase/database";
import { database, auth } from "../firebase/firebaseConfig";
import { adminApiUrl } from '../Utils/adminApi';
import { CSVLink } from "react-csv";
import { Link, useNavigate } from "react-router-dom";
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from "recharts";
import {
  FiActivity,
  FiCalendar,
  FiCheckCircle,
  FiClock,
  FiCreditCard,
  FiDollarSign,
  FiDownload,
  FiEdit3,
  FiEye,
  FiMail,
  FiSearch,
  FiShield,
  FiTrash2,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";
import RemoteAdminOverview from "../components/common/RemoteAdminOverview";
import TopPerformingEvents from '../components/common/TopPerformingEvents';
import "./admin-dashboard-troop.css";
import { useSalesTrend } from '../hooks/useSalesTrend';

const formatNaira = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

const AdminDashboard = () => {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [showEventList, setShowEventList] = useState(false);
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [resendingId, setResendingId] = useState(null);
  const itemsPerPage = 10;

  useEffect(() => {
    const eventsRef = ref(database, "events");
    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setEvents(Object.entries(data).map(([id, value]) => ({ id, ...value })));
    });

    const ticketsRef = ref(database, "tickets");
    onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val() || {};
      setTickets(
        Object.entries(data).map(([id, value]) => ({
          id,
          ...value,
          date: value.timestamp ? new Date(value.timestamp).toLocaleDateString() : "N/A",
        }))
      );
    });

    const withdrawalsRef = ref(database, "withdrawalRequests");
    onValue(withdrawalsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const requestsArray = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0));
      setWithdrawals(requestsArray);
    });
  }, []);

  const totalEvents = events.length;
  const totalTicketsSold = tickets.reduce((sum, ticket) => sum + (ticket.quantity || 1), 0);
  const totalRevenue = tickets.reduce((sum, ticket) => sum + (ticket.totalCharged || ticket.totalPaid || 0), 0);
  const platformRevenue = tickets.reduce(
    (sum, ticket) => sum + ((ticket.hostFee || 0) + (ticket.serviceFee || 0)),
    0
  );
  const totalAttendees = new Set(tickets.map((ticket) => ticket.email)).size;
  const totalPaidOut = withdrawals
    .filter((withdrawal) => withdrawal.status === "completed")
    .reduce((sum, withdrawal) => sum + (withdrawal.amount || 0), 0);
  const pendingCount = withdrawals.filter((withdrawal) => withdrawal.status === "pending").length;

  const hostBreakdown = useMemo(() => {
    const breakdown = tickets.reduce((accumulator, ticket) => {
      const hostEmail = ticket.hostEmail || "Unknown";

      if (!accumulator[hostEmail]) {
        accumulator[hostEmail] = {
          hostEmail,
          totalEarned: 0,
          tickets: 0,
          withdrawn: 0,
        };
      }

      accumulator[hostEmail].totalEarned += ticket.totalPaid || 0;
      accumulator[hostEmail].tickets += ticket.quantity || 1;
      return accumulator;
    }, {});

    withdrawals
      .filter((withdrawal) => withdrawal.status === "completed")
      .forEach((withdrawal) => {
        const hostEmail = withdrawal.hostEmail;
        if (breakdown[hostEmail]) {
          breakdown[hostEmail].withdrawn += withdrawal.amount || 0;
        }
      });

    return Object.values(breakdown)
      .map((host) => ({
        ...host,
        stillOwed: Math.max(0, host.totalEarned - host.withdrawn),
      }))
      .sort((left, right) => right.totalEarned - left.totalEarned);
  }, [tickets, withdrawals]);

  const totalOwedToHosts = hostBreakdown.reduce((sum, host) => sum + host.stillOwed, 0);

  const salesData = Object.values(
    tickets.reduce((accumulator, ticket) => {
      const date = new Date(ticket.timestamp || Date.now()).toLocaleDateString();
      accumulator[date] = accumulator[date] || { date, total: 0 };
      accumulator[date].total += ticket.totalPaid || ticket.totalCharged || 0;
      return accumulator;
    }, {})
  );

  const categoryData = Object.values(
    tickets.reduce((accumulator, ticket) => {
      const event = events.find((eventItem) => eventItem.id === ticket.eventId);
      const category = event?.category || "Others";
      accumulator[category] = accumulator[category] || { category, total: 0 };
      accumulator[category].total += ticket.totalPaid || ticket.totalCharged || 0;
      return accumulator;
    }, {})
  );

  const categoryTotal = categoryData.reduce((sum, category) => sum + category.total, 0);
  const categorySummary = categoryData
    .sort((left, right) => right.total - left.total)
    .slice(0, 4)
    .map((category) => ({
      ...category,
      percent: categoryTotal ? Math.round((category.total / categoryTotal) * 100) : 0,
    }));

  const donutGradient = categorySummary.length
    ? categorySummary
        .map((item, index) => {
          const colors = ["#16a34a", "#1d4ed8", "#f59e0b", "#7c3aed"];
          const start = categorySummary.slice(0, index).reduce((sum, prev) => sum + prev.percent, 0);
          const end = start + item.percent;
          return `${colors[index] || "#94a3b8"} ${start}% ${end}%`;
        })
        .join(", ")
    : "#dbeafe 0% 100%";

  const healthChecks = [
    { label: "Payment Gateway", status: "Operational" },
    { label: "Email Service", status: "Operational" },
    { label: "Server Status", status: "Operational" },
    { label: "Backup Service", status: "Operational" },
  ];

  // remote sales trend (from server aggregates)
  const { data: remoteSales, isLoading: remoteSalesLoading } = useSalesTrend(30);
  const recentWithdrawals = withdrawals.slice(0, 4);
  const periodLabel = "May 1 - May 31, 2025";
  const chartData = remoteSales && remoteSales.length ? remoteSales : salesData;

  const filteredTickets = tickets
    .sort((left, right) => (right.timestamp || 0) - (left.timestamp || 0))
    .filter((ticket) => {
      const eventExists = events.some((event) => event.id === ticket.eventId);
      const matchingEventTitle = events.find((event) => event.id === ticket.eventId)?.title || "";
      const normalizedSearch = searchTerm.toLowerCase();

      const matchesSearch =
        ticket.email?.toLowerCase().includes(normalizedSearch) ||
        matchingEventTitle.toLowerCase().includes(normalizedSearch);

      return eventExists && matchesSearch;
    });

  const paginatedTickets = filteredTickets.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );
  const totalPages = Math.ceil(filteredTickets.length / itemsPerPage);

  const sendAudit = async (action, details) => {
    try {
      if (!auth || !auth.currentUser) return;
      const token = await auth.currentUser.getIdToken(true);
      await fetch(adminApiUrl('/audit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, details }),
      });
    } catch (err) {
      console.warn('Failed to send audit log', err);
    }
  };

  const handleDeleteEvent = async (eventId) => {
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
        // audit
        sendAudit('delete_event', { eventId });
        alert("Event and all its tickets deleted successfully.");
      } catch (error) {
        alert(`Error deleting event: ${error.message}`);
      }
    }
  };

  const handleWithdrawalStatus = async (id, status) => {
    try {
      if (!auth?.currentUser) {
        throw new Error("You must be signed in to update withdrawals.");
      }

      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch(adminApiUrl(`/withdrawals/${id}/status`), {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ status }),
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || "Failed to update withdrawal status.");
      }

      // audit
      sendAudit('withdrawal_update', { id, status });
      alert(`Request marked as ${status}.`);
    } catch (error) {
      alert(`Failed to update status: ${error.message}`);
    }
  };

  const handleResendEmail = async (ticket) => {
    if (!ticket.email) {
      alert("No email address found for this ticket.");
      return;
    }

    setResendingId(ticket.id);
    try {
      if (!auth?.currentUser) {
        throw new Error("You must be signed in to resend emails.");
      }

      const token = await auth.currentUser.getIdToken(true);
      const response = await fetch(adminApiUrl(`/tickets/${ticket.id}/resend-email`), {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
      });

      const result = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(result?.error || "Failed to resend ticket email.");
      }

      alert(`Email resent successfully to ${ticket.email}`);
    } catch (error) {
      console.error("Ticket resend error:", error);
      alert(`Failed to resend email: ${error.message}`);
    } finally {
      setResendingId(null);
    }
  };

  const getStatusBadgeClass = (status) => `admin-status admin-status-${status || "pending"}`;

  return (
    <div className="admin-dashboard">
      <section className="admin-dashboard-header admin-card">
        <div>
          <p className="admin-dashboard-welcome">Overview</p>
          <h1>Welcome back, Super Admin 👋</h1>
          <p className="admin-dashboard-intro">
            Track revenue, withdrawals, events and ticket activity from one premium control room.
          </p>
        </div>
        <div className="admin-dashboard-header-actions">
          <div className="admin-dashboard-date-range">
            <span>{periodLabel}</span>
          </div>
          <button type="button" className="admin-primary-btn">
            <FiDownload aria-hidden="true" />
            Export Report
          </button>
        </div>
      </section>

      <section className="admin-kpi-grid admin-remote-overview">
        <RemoteAdminOverview />
      </section>

      <section className="admin-main-grid admin-dashboard-main">
        <article className="admin-panel admin-panel-graph">
          <div className="admin-panel-head admin-panel-head-wrap">
            <div>
              <span className="admin-panel-chip">
                <FiCreditCard aria-hidden="true" />
                Revenue Overview
              </span>
              <h2>Revenue overview</h2>
            </div>
            <div className="admin-dashboard-graph-meta">
              <span>Daily</span>
            </div>
          </div>
          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={chartData} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#e6f2ea" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value) => formatNaira(value)} />
                <Line type="monotone" dataKey="total" stroke="#16a34a" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-panel admin-panel-events">
          <TopPerformingEvents events={React.useMemo(() => {
            const byEvent = {};
            tickets.forEach((t) => {
              const id = t.eventId || 'unknown';
              if (!byEvent[id]) byEvent[id] = { id, title: t.eventTitle || 'Event', tickets: 0, revenue: 0 };
              byEvent[id].tickets += (t.quantity || 1);
              byEvent[id].revenue += (t.totalPaid || t.totalCharged || 0);
            });
            return Object.values(byEvent)
              .sort((a, b) => b.revenue - a.revenue)
              .map((e) => {
                const matchedEvent = events.find((ev) => {
                  if (ev.id === e.id) return true;
                  if (!ev.title || !e.title) return false;
                  return ev.title.trim().toLowerCase() === e.title.trim().toLowerCase();
                });

                const thumbnail =
                  matchedEvent?.image ||
                  matchedEvent?.poster ||
                  matchedEvent?.thumbnail ||
                  matchedEvent?.coverImage ||
                  matchedEvent?.banner ||
                  '/images/ekotixx.jpeg';

                return { ...e, thumbnail };
              });
          }, [tickets, events])} />
        </article>
      </section>

      <section className="admin-finance-grid admin-overview-grid">
        <article className="admin-panel admin-category-card">
          <div className="admin-panel-head admin-panel-head-wrap">
            <div>
              <span className="admin-panel-chip">
                <FiCalendar aria-hidden="true" />
                Sales by category
              </span>
              <h2>Sales by category</h2>
            </div>
            <span className="admin-panel-chip admin-panel-chip-small">{categorySummary.reduce((sum, item) => sum + item.percent, 0)}% tracked</span>
          </div>
          <div className="admin-category-chart-row">
            <div className="admin-donut-chart" style={{ background: `conic-gradient(${donutGradient})` }}>
              <div className="admin-donut-center">
                <strong>{formatNaira(categoryTotal)}</strong>
                <span>Total</span>
              </div>
            </div>
            <div className="admin-category-list">
              {categorySummary.map((category) => (
                <div key={category.category} className="admin-category-entry">
                  <span className="admin-category-label">{category.category}</span>
                  <strong>{category.percent}%</strong>
                </div>
              ))}
            </div>
          </div>
        </article>

        <article className="admin-panel admin-activity-card">
          <div className="admin-panel-head admin-panel-head-wrap">
            <div>
              <span className="admin-panel-chip">
                <FiClock aria-hidden="true" />
                Recent withdrawals
              </span>
              <h2>Recent withdrawals</h2>
            </div>
            <button type="button" className="admin-inline-btn admin-inline-btn-amber">View all</button>
          </div>
          <div className="admin-activity-list">
            {recentWithdrawals.length ? (
              recentWithdrawals.map((withdrawal) => (
                <div key={withdrawal.id} className="admin-activity-row">
                  <div>
                    <strong>{withdrawal.hostEmail}</strong>
                    <span>{withdrawal.accountName || 'Host payment'}</span>
                  </div>
                  <div>
                    <span className="admin-value admin-value-emerald">{formatNaira(withdrawal.amount)}</span>
                    <span className={getStatusBadgeClass(withdrawal.status)}>{withdrawal.status}</span>
                  </div>
                </div>
              ))
            ) : (
              <p className="admin-empty-state">No recent withdrawals to show.</p>
            )}
          </div>
        </article>

        <article className="admin-panel admin-health-card">
          <div className="admin-panel-head admin-panel-head-wrap">
            <div>
              <span className="admin-panel-chip">
                <FiShield aria-hidden="true" />
                System health
              </span>
              <h2>Platform services</h2>
            </div>
          </div>
          <div className="admin-health-list">
            {healthChecks.map((check) => (
              <div key={check.label} className="admin-health-item">
                <span className="admin-health-dot" />
                <div>
                  <strong>{check.label}</strong>
                  <p>{check.status}</p>
                </div>
              </div>
            ))}
          </div>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span className="admin-panel-chip">
              <FiUsers aria-hidden="true" />
              Host overview
            </span>
            <h2>Per host payout breakdown</h2>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table-stacked">
            <thead>
              <tr>
                <th>Host Email</th>
                <th>Tickets Sold</th>
                <th>Total Earned</th>
                <th>Total Withdrawn</th>
                <th>Still Owed</th>
              </tr>
            </thead>
            <tbody>
              {hostBreakdown.map((host) => (
                <tr key={host.hostEmail}>
                  <td data-label="Host Email">{host.hostEmail}</td>
                  <td data-label="Tickets Sold">{host.tickets}</td>
                  <td data-label="Total Earned" className="admin-value admin-value-emerald">
                    {formatNaira(host.totalEarned)}
                  </td>
                  <td data-label="Total Withdrawn" className="admin-value admin-value-amber">
                    {formatNaira(host.withdrawn)}
                  </td>
                  <td
                    data-label="Still Owed"
                    className={`admin-value ${host.stillOwed > 0 ? "admin-value-blue" : "admin-value-muted"}`}
                  >
                    {formatNaira(host.stillOwed)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head admin-panel-head-wrap">
          <div>
            <span className="admin-panel-chip">
              <FiSearch aria-hidden="true" />
              Ticket operations
            </span>
            <h2>Ticket ledger</h2>
          </div>

          <div className="admin-toolbar">
            <label className="admin-search">
              <FiSearch aria-hidden="true" />
              <input
                type="text"
                placeholder="Search by event or email..."
                value={searchTerm}
                onChange={(event) => {
                  setSearchTerm(event.target.value);
                  setCurrentPage(1);
                }}
              />
            </label>
            <CSVLink data={filteredTickets} filename="tickets.csv" className="admin-secondary-btn">
              <FiDownload aria-hidden="true" />
              Export CSV
            </CSVLink>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table-stacked">
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
                <th>Resend Email</th>
              </tr>
            </thead>
            <tbody>
              {paginatedTickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td data-label="Date">{ticket.date}</td>
                  <td data-label="Name">{ticket.name}</td>
                  <td data-label="Email">{ticket.email}</td>
                  <td data-label="Event">{events.find((event) => event.id === ticket.eventId)?.title || "N/A"}</td>
                  <td data-label="Ticket Type">{ticket.ticketType}</td>
                  <td data-label="Qty">{ticket.quantity}</td>
                  <td data-label="Host Earns" className="admin-value admin-value-blue">
                    {formatNaira(ticket.totalPaid || 0)}
                  </td>
                  <td data-label="Platform Earns" className="admin-value admin-value-emerald">
                    {formatNaira((ticket.hostFee || 0) + (ticket.serviceFee || 0))}
                  </td>
                  <td data-label="Buyer Paid" className="admin-value">
                    {formatNaira(ticket.totalCharged || ticket.totalPaid || 0)}
                  </td>
                  <td data-label="Transaction ID">{ticket.transactionId}</td>
                  <td data-label="Resend Email">
                    <button
                      type="button"
                      className="admin-inline-btn admin-inline-btn-approve"
                      onClick={() => handleResendEmail(ticket)}
                      disabled={resendingId === ticket.id}
                    >
                      <FiMail aria-hidden="true" />
                      {resendingId === ticket.id ? "Sending..." : "Resend"}
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {totalPages > 1 ? (
          <div className="admin-pagination">
            {Array.from({ length: totalPages }, (_, index) => index + 1).map((pageNumber) => (
              <button
                key={pageNumber}
                type="button"
                className={`admin-page-btn ${currentPage === pageNumber ? "is-active" : ""}`}
                onClick={() => setCurrentPage(pageNumber)}
              >
                {pageNumber}
              </button>
            ))}
          </div>
        ) : null}
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span className="admin-panel-chip">
              <FiClock aria-hidden="true" />
              Withdrawal review
            </span>
            <h2>Withdrawal requests</h2>
          </div>
          {pendingCount > 0 ? (
            <span className="admin-alert-pill">{pendingCount} pending</span>
          ) : null}
        </div>

        {withdrawals.length === 0 ? (
          <div className="admin-empty-state">
            <p>No withdrawal requests yet.</p>
          </div>
        ) : (
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-stacked">
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
                {withdrawals.map((withdrawal) => (
                  <tr key={withdrawal.id}>
                    <td data-label="Date">
                      {withdrawal.timestamp ? new Date(withdrawal.timestamp).toLocaleDateString() : "N/A"}
                    </td>
                    <td data-label="Host">{withdrawal.hostEmail}</td>
                    <td data-label="Account Name">{withdrawal.accountName}</td>
                    <td data-label="Account No.">{withdrawal.accountNumber}</td>
                    <td data-label="Bank">{withdrawal.bank}</td>
                    <td data-label="Amount" className="admin-value admin-value-emerald">
                      {formatNaira(withdrawal.amount)}
                    </td>
                    <td data-label="Note">{withdrawal.note || "—"}</td>
                    <td data-label="Status">
                      <span className={getStatusBadgeClass(withdrawal.status)}>{withdrawal.status}</span>
                    </td>
                    <td data-label="Actions">
                      {withdrawal.status === "pending" ? (
                        <div className="admin-action-row">
                          <button
                            type="button"
                            className="admin-inline-btn admin-inline-btn-approve"
                            onClick={() => handleWithdrawalStatus(withdrawal.id, "completed")}
                          >
                            Approve
                          </button>
                          <button
                            type="button"
                            className="admin-inline-btn admin-inline-btn-reject"
                            onClick={() => handleWithdrawalStatus(withdrawal.id, "rejected")}
                          >
                            Reject
                          </button>
                        </div>
                      ) : (
                        <span className="admin-processed-note">Processed</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {showEventList ? (
        <div className="admin-modal-backdrop" onClick={() => setShowEventList(false)}>
          <div className="admin-modal" onClick={(event) => event.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <span className="admin-panel-chip">
                  <FiEye aria-hidden="true" />
                  Event index
                </span>
                <h2>Current events</h2>
              </div>
              <button
                type="button"
                className="admin-icon-btn"
                onClick={() => setShowEventList(false)}
                aria-label="Close event list"
              >
                <FiX aria-hidden="true" />
              </button>
            </div>

            <div className="admin-event-list">
              {events.map((event) => (
                <article key={event.id} className="admin-event-item">
                  <div>
                    <strong>{event.title}</strong>
                    <span>{event.date === "TBA" ? "Date TBA" : event.date || "No date set"}</span>
                  </div>

                  <div className="admin-event-actions">
                    <button type="button" className="admin-icon-btn" onClick={() => navigate(`/event/edit/${event.id}`)}>
                      <FiEdit3 aria-hidden="true" />
                    </button>
                    <button type="button" className="admin-icon-btn admin-icon-btn-danger" onClick={() => handleDeleteEvent(event.id)}>
                      <FiTrash2 aria-hidden="true" />
                    </button>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default AdminDashboard;

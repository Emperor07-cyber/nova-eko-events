import React, { useEffect, useMemo, useState } from "react";
import { ref, onValue, remove, update, get } from "firebase/database";
import { database } from "../firebase/firebaseConfig";
import { CSVLink } from "react-csv";
import { Link, useNavigate } from "react-router-dom";
import emailjs from "@emailjs/browser";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
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
  FiTrash2,
  FiTrendingUp,
  FiUsers,
  FiX,
} from "react-icons/fi";
import "./admin-dashboard-troop.css";

const EMAILJS_SERVICE_ID = "service_vu5rgjd";
const EMAILJS_TEMPLATE_ID = "template_xdiunfr";
const EMAILJS_PUBLIC_KEY = "H4Z5LHti97uiudwEY";

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
      accumulator[date].total += ticket.totalPaid || 0;
      return accumulator;
    }, {})
  );

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
        alert("Event and all its tickets deleted successfully.");
      } catch (error) {
        alert(`Error deleting event: ${error.message}`);
      }
    }
  };

  const handleWithdrawalStatus = async (id, status) => {
    try {
      await update(ref(database, `withdrawalRequests/${id}`), { status });
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
    const event = events.find((currentEvent) => currentEvent.id === ticket.eventId);
    const ticketPrice = ticket.totalPaid || 0;
    const totalPaid = ticket.totalCharged || ticket.totalPaid || 0;

    try {
      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: ticket.email,
          user_name: ticket.name || ticket.email,
          event_name: ticket.eventTitle || event?.title || "Your Event",
          event_date: event?.date || "",
          event_location: event?.location || "",
          ticket_type: ticket.ticketType || "",
          quantity: String(ticket.quantity || 1),
          unit_price: ticketPrice.toLocaleString(),
          total_paid: totalPaid.toLocaleString(),
          order_id: ticket.transactionId || ticket.id,
          qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.transactionId || ticket.id)}`,
          support_email: "Ekotix234@gmail.com",
          company_name: "Ekotix",
          current_year: String(new Date().getFullYear()),
        },
        EMAILJS_PUBLIC_KEY
      );
      alert(`Email resent successfully to ${ticket.email}`);
    } catch (error) {
      console.error("EmailJS error:", error);
      alert(`Failed to resend email: ${error.text || error.message}`);
    }

    setResendingId(null);
  };

  const getStatusBadgeClass = (status) => `admin-status admin-status-${status || "pending"}`;

  return (
    <div className="admin-dashboard">
      <section className="admin-hero">
        <div className="admin-hero-copy">
          <span className="admin-kicker">Operations center</span>
          <h1>Run Ekotix with clarity</h1>
          <p>
            Oversee platform revenue, track event performance, review withdrawals, and manage ticket activity from one premium control room.
          </p>
          <div className="admin-hero-actions">
            <Link to="/event/new" className="admin-primary-btn">
              <FiCalendar aria-hidden="true" />
              Create New Event
            </Link>
            <button
              type="button"
              className="admin-secondary-btn"
              onClick={() => setShowEventList(true)}
            >
              <FiEye aria-hidden="true" />
              View Event Index
            </button>
            <CSVLink data={filteredTickets} filename="tickets.csv" className="admin-secondary-btn">
              <FiDownload aria-hidden="true" />
              Export Tickets
            </CSVLink>
          </div>
        </div>

        <div className="admin-hero-aside">
          <div className="admin-hero-stat">
            <span>Live events</span>
            <strong>{totalEvents}</strong>
            <small>All active and archived event records</small>
          </div>
          <div className="admin-hero-stat">
            <span>Pending withdrawals</span>
            <strong>{pendingCount}</strong>
            <small>Requests needing finance review</small>
          </div>
        </div>
      </section>

      <section className="admin-kpi-grid">
        <article className="admin-kpi-card">
          <span className="admin-kpi-icon admin-kpi-icon-events">
            <FiCalendar aria-hidden="true" />
          </span>
          <div>
            <p>Total Events</p>
            <strong>{totalEvents}</strong>
          </div>
        </article>

        <article className="admin-kpi-card">
          <span className="admin-kpi-icon admin-kpi-icon-tickets">
            <FiCreditCard aria-hidden="true" />
          </span>
          <div>
            <p>Tickets Sold</p>
            <strong>{totalTicketsSold}</strong>
          </div>
        </article>

        <article className="admin-kpi-card">
          <span className="admin-kpi-icon admin-kpi-icon-revenue">
            <FiDollarSign aria-hidden="true" />
          </span>
          <div>
            <p>Total Revenue</p>
            <strong>{formatNaira(totalRevenue)}</strong>
          </div>
        </article>

        <article className="admin-kpi-card">
          <span className="admin-kpi-icon admin-kpi-icon-attendees">
            <FiUsers aria-hidden="true" />
          </span>
          <div>
            <p>Unique Attendees</p>
            <strong>{totalAttendees}</strong>
          </div>
        </article>
      </section>

      <section className="admin-finance-grid">
        <article className="admin-finance-card admin-finance-card-emerald">
          <div className="admin-finance-head">
            <span className="admin-panel-chip">
              <FiTrendingUp aria-hidden="true" />
              Platform revenue
            </span>
          </div>
          <strong>{formatNaira(platformRevenue)}</strong>
          <p>5% host fee plus NGN 100 service fee per ticket.</p>
        </article>

        <article className="admin-finance-card admin-finance-card-amber">
          <div className="admin-finance-head">
            <span className="admin-panel-chip">
              <FiCheckCircle aria-hidden="true" />
              Total paid out
            </span>
          </div>
          <strong>{formatNaira(totalPaidOut)}</strong>
          <p>Completed withdrawals already processed to hosts.</p>
        </article>

        <article className="admin-finance-card admin-finance-card-blue">
          <div className="admin-finance-head">
            <span className="admin-panel-chip">
              <FiActivity aria-hidden="true" />
              Still owed to hosts
            </span>
          </div>
          <strong>{formatNaira(totalOwedToHosts)}</strong>
          <p>Total host earnings remaining after settled payouts.</p>
        </article>
      </section>

      <section className="admin-main-grid">
        <div className="admin-panel">
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
        </div>

        <div className="admin-panel">
          <div className="admin-panel-head">
            <div>
              <span className="admin-panel-chip">
                <FiTrendingUp aria-hidden="true" />
                Revenue trend
              </span>
              <h2>Sales performance</h2>
            </div>
          </div>

          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={salesData}>
                <XAxis dataKey="date" />
                <YAxis />
                <Tooltip formatter={(value) => formatNaira(value)} />
                <Bar dataKey="total" fill="#16a34a" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
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
                      className="admin-inline-btn admin-inline-btn-amber"
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

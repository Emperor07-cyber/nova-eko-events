import React, { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { FiDollarSign, FiTag, FiUsers, FiTrendingUp } from "react-icons/fi";
import { useAuthState } from "react-firebase-hooks/auth";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import HostLayout from "../components/Layout/HostLayout";
import { database, auth } from "../firebase/firebaseConfig";
import { ref, get } from "firebase/database";

const HostEventDetails = () => {
  const { eventId } = useParams();
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [event, setEvent] = useState(null);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);
  const [copiedCode, setCopiedCode] = useState(null);

  useEffect(() => {
    if (!user || !eventId) return;

    setLoading(true);
    setNotFound(false);

    const eventRef = ref(database, `events/${eventId}`);
    const ticketsRef = ref(database, "tickets");

    Promise.all([get(eventRef), get(ticketsRef)])
      .then(([eventSnap, ticketsSnap]) => {
        if (!eventSnap.exists()) {
          setNotFound(true);
          return;
        }

        const eventData = eventSnap.val();
        if (eventData.createdBy?.toLowerCase() !== user.email?.toLowerCase()) {
          setNotFound(true);
          return;
        }

        setEvent({ id: eventId, ...eventData });

        const ticketsData = ticketsSnap.exists() ? ticketsSnap.val() : {};
        const eventTickets = Object.entries(ticketsData)
          .filter(([, ticket]) => ticket.eventId === eventId)
          .map(([id, value]) => ({ id, ...value }));

        setTickets(eventTickets);
      })
      .catch((error) => {
        console.error("Host event load error:", error);
        setNotFound(true);
      })
      .finally(() => setLoading(false));
  }, [user, eventId]);

  const handleCopyScannerCode = (code) => {
    if (!code) return;
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
    setCopiedCode(code);
    setTimeout(() => setCopiedCode(null), 2000);
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "TBA";
    if (dateStr === "TBA") return "TBA";
    const parsed = Date.parse(dateStr);
    if (isNaN(parsed)) return dateStr;
    return new Intl.DateTimeFormat(undefined, {
      weekday: "short",
      month: "short",
      day: "numeric",
      year: "numeric",
    }).format(new Date(parsed));
  };

  const formatTime = (timeStr) => {
    if (!timeStr) return "Time TBA";
    // try HH:MM (24h) format first
    if (/^\d{1,2}:\d{2}(?:(:\d{2})?)?$/.test(timeStr)) {
      try {
        const d = new Date(`1970-01-01T${timeStr}`);
        if (!isNaN(d.getTime())) {
          return new Intl.DateTimeFormat(undefined, { hour: "numeric", minute: "numeric" }).format(d);
        }
      } catch {}
    }
    // fallback to whatever was provided (e.g., "7:00 PM")
    return timeStr;
  };

  if (loading) {
    return (
      <HostLayout>
        <div className="host-event-detail-page">
          <div className="skeleton skeleton-title" />
          <div className="skeleton skeleton-line" />
          <div className="skeleton skeleton-hero" />
          <div className="skeleton skeleton-line" />
        </div>
      </HostLayout>
    );
  }

  if (notFound || !event) {
    return (
      <HostLayout>
        <div className="host-event-detail-page">
          <div className="empty-state-card">
            <h2>Event not found</h2>
            <p>This event is unavailable or you do not have access to view it.</p>
            <button className="btn-primary" onClick={() => navigate("/host/events")}>Back to events</button>
          </div>
        </div>
      </HostLayout>
    );
  }

  const totalRevenue = tickets.reduce((sum, ticket) => sum + Number(ticket.totalPaid || 0), 0);
  const totalTicketsSold = tickets.reduce((sum, ticket) => sum + (Number(ticket.quantity) || 1), 0);
  const uniqueAttendees = new Set(tickets.map((ticket) => ticket.email)).size;
  const averageTicket = totalTicketsSold ? Math.round(totalRevenue / totalTicketsSold) : 0;

  const salesByDay = Object.values(
    tickets.reduce((acc, ticket) => {
      const day = new Date(ticket.timestamp || Date.now()).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
      });
      if (!acc[day]) acc[day] = { day, revenue: 0 };
      acc[day].revenue += Number(ticket.totalPaid || 0);
      return acc;
    }, {})
  );

  const ticketTypeMap = tickets.reduce((acc, ticket) => {
    const type = ticket.ticketType || "General";
    if (!acc[type]) acc[type] = { type, sold: 0, revenue: 0 };
    acc[type].sold += Number(ticket.quantity || 1);
    acc[type].revenue += Number(ticket.totalPaid || 0);
    return acc;
  }, {});

  const topTicketTypes = Object.values(ticketTypeMap)
    .sort((a, b) => b.sold - a.sold)
    .slice(0, 4);

  const eventLink = event.eventUrl
    ? event.eventUrl
    : `${window.location.origin}/event/${event.id}`;

  const previewUrl = event.eventUrl && event.eventUrl.startsWith("http")
    ? event.eventUrl
    : `/${event.eventUrl?.replace(/^\/+/, "") || `event/${event.id}`}`;

  const eventStatus = event.status || "Live";

  return (
    <HostLayout>
      <div className="host-event-detail-page">
        <div className="host-event-topbar">
          <div>
            <p className="kicker">Event overview</p>
            <h1 className="host-event-title">{event.title}</h1>
            <p className="host-event-subtitle">{formatDate(event.date)} · {event.location || "Location TBA"} · {formatTime(event.startTime)}</p>
          </div>

          <div className="host-event-actions">
            <button className="btn-copy-link" onClick={() => navigate("/host/events")}>Back</button>
            <Link className="btn-copy-link" to={`/event/edit/${event.id}`}>Edit</Link>
            <a className="btn-primary" href={previewUrl} target="_blank" rel="noreferrer">Preview</a>
          </div>
        </div>

        <div className="host-event-hero">
          <img
            className="host-event-hero-image"
            src={event.image || "/images/partypic.jpg"}
            alt={event.title}
          />
          <div className="host-event-hero-info">
            <p className="kicker">Event snapshot</p>
            <h2>{event.title}</h2>
            <p>{event.description ? event.description.slice(0, 180) + (event.description.length > 180 ? "..." : "") : "No description available yet."}</p>
            <div className="host-event-hero-tags">
              <span>{formatDate(event.date)}</span>
              <span>{event.location || "Location TBA"}</span>
              <span>{formatTime(event.startTime)}</span>
            </div>
          </div>
        </div>

        <div className="host-event-metrics">
          <div className="host-metric-card">
            <span className="host-metric-icon"><FiDollarSign /></span>
            <div>
              <span className="host-metric-label">Revenue</span>
              <strong>₦{totalRevenue.toLocaleString()}</strong>
            </div>
          </div>
          <div className="host-metric-card">
            <span className="host-metric-icon"><FiTag /></span>
            <div>
              <span className="host-metric-label">Tickets sold</span>
              <strong>{totalTicketsSold}</strong>
            </div>
          </div>
          <div className="host-metric-card">
            <span className="host-metric-icon"><FiUsers /></span>
            <div>
              <span className="host-metric-label">Attendees</span>
              <strong>{uniqueAttendees}</strong>
            </div>
          </div>
          <div className="host-metric-card">
            <span className="host-metric-icon"><FiTrendingUp /></span>
            <div>
              <span className="host-metric-label">Avg. ticket</span>
              <strong>₦{averageTicket.toLocaleString()}</strong>
            </div>
          </div>
        </div>

        <div className="host-event-grid">
          <section className="host-event-card host-event-summary-card">
            <div className="host-event-card-header">
              <div>
                <h2>Event information</h2>
                <p>Key event details, status, and access data.</p>
              </div>
              <span className={`host-event-status ${eventStatus.toLowerCase() === "live" ? "is-live" : "is-draft"}`}>
                {eventStatus}
              </span>
            </div>

<div className="host-event-info-row host-event-meta-row">
          <div className="host-info-pill">
            <span className="host-info-icon">📅</span>
            <div>
              <p className="info-label">Date</p>
              <p>{formatDate(event.date)}</p>
            </div>
          </div>
          <div className="host-info-pill">
            <span className="host-info-icon">⏰</span>
            <div>
              <p className="info-label">Time</p>
              <p>{formatTime(event.startTime)}</p>
            </div>
          </div>
          <div className="host-info-pill">
            <span className="host-info-icon">📍</span>
            <div>
              <p className="info-label">Venue</p>
              <p>{event.location || "TBA"}</p>
            </div>
          </div>
        </div>
        <div className="host-event-info-row">
          <div>
            <p className="info-label">Type</p>
            <p>{event.eventType || event.type || "Festival"}</p>
          </div>
          <div>
            <p className="info-label">Category</p>
            <p>{event.category || "Music"}</p>
              </div>
              <div>
                <p className="info-label">Link</p>
                <p className="host-event-link">{eventLink}</p>
              </div>
            </div>

            <div className="host-event-copy-row">
              <div>
                <p className="info-label">Scanner code</p>
                <span className="host-scanner-code">{event.scannerCode || "Not generated"}</span>
              </div>
              {event.scannerCode ? (
                <button className="btn-copy-link host-scanner-copy-btn" onClick={() => handleCopyScannerCode(event.scannerCode)}>
                  {copiedCode === event.scannerCode ? "Copied" : "Copy code"}
                </button>
              ) : null}
            </div>
          </section>

          <section className="host-event-card host-event-chart-card">
            <div className="host-event-card-header">
              <div>
                <h2>Revenue overview</h2>
                <p>Live ticket revenue from this event.</p>
              </div>
            </div>
            <div className="chart-wrapper host-event-chart-wrapper">
              {salesByDay.length > 0 ? (
                <ResponsiveContainer width="100%" height={260}>
                  <BarChart data={salesByDay} margin={{ left: -16, right: 0, top: 10, bottom: 0 }}>
                    <XAxis dataKey="day" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <YAxis tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                    <Tooltip formatter={(value) => `₦${Number(value).toLocaleString()}`} />
                    <Bar dataKey="revenue" fill="#14c02b" radius={[6, 6, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              ) : (
                <div className="empty-chart-state">No revenue yet. Ticket sales will appear here once your event receives orders.</div>
              )}
            </div>
          </section>

          <section className="host-event-card host-event-top-sales-card">
            <div className="host-event-card-header">
              <div>
                <h2>Top ticket types</h2>
                <p>Best-performing ticket categories.</p>
              </div>
            </div>
            <div className="ticket-types-list">
              {topTicketTypes.length > 0 ? (
                topTicketTypes.map((type) => (
                  <div key={type.type} className="ticket-type-row">
                    <span>{type.type}</span>
                    <strong>{type.sold} sold</strong>
                  </div>
                ))
              ) : (
                <p className="host-muted-note">No ticket sales yet.</p>
              )}
            </div>
          </section>
        </div>

        <div className="host-event-details-grid">
          <section className="host-event-card host-event-description-card">
            <h2>Description</h2>
            <p>{event.description || "No description has been added for this event."}</p>
          </section>

          <section className="host-event-card host-event-checklist-card">
            <h2>Event checklist</h2>
            <ul className="checklist-items">
              <li className={event.scannerCode ? "done" : "pending"}>Scanner code available</li>
              <li className={event.tickets?.length > 0 ? "done" : "pending"}>Ticket types configured</li>
              <li className={event.image ? "done" : "pending"}>Hero image added</li>
              <li className={event.description ? "done" : "pending"}>Description completed</li>
            </ul>
          </section>
        </div>
      </div>
    </HostLayout>
  );
};

export default HostEventDetails;

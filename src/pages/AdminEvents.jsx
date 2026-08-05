import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { get, onValue, ref, remove } from 'firebase/database';
import { FiCalendar, FiEdit3, FiSearch, FiTrash2 } from 'react-icons/fi';
import { auth, database } from '../firebase/firebaseConfig.jsx';
import { adminApiUrl } from '../Utils/adminApi';
import './admin-dashboard-troop.css';

const formatNaira = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

const getEventTiming = (dateValue) => {
  if (!dateValue || dateValue === 'TBA') return 'tba';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return 'tba';
  return parsed.getTime() >= Date.now() ? 'upcoming' : 'past';
};

const formatEventDate = (dateValue) => {
  if (!dateValue || dateValue === 'TBA') return 'Date TBA';
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) return dateValue;
  return parsed.toLocaleDateString();
};

const AdminEvents = () => {
  const navigate = useNavigate();
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [timingFilter, setTimingFilter] = useState('all');
  const [currentPage, setCurrentPage] = useState(1);
  const [busyEventId, setBusyEventId] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const itemsPerPage = 8;

  useEffect(() => {
    const eventsRef = ref(database, 'events');
    const ticketsRef = ref(database, 'tickets');

    const offEvents = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const rows = Object.entries(data).map(([id, value]) => ({ id, ...value }));
      setEvents(rows);
      setLoading(false);
    });

    const offTickets = onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const rows = Object.entries(data).map(([id, value]) => ({ id, ...value }));
      setTickets(rows);
    });

    return () => {
      offEvents();
      offTickets();
    };
  }, []);

  const sendAudit = async (action, details) => {
    try {
      if (!auth?.currentUser) return;
      const token = await auth.currentUser.getIdToken(true);
      await fetch(adminApiUrl('/audit'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({ action, details }),
      });
    } catch (error) {
      console.warn('Failed to send audit log', error);
    }
  };

  const categories = useMemo(() => {
    return ['all', ...new Set(events.map((event) => event.category).filter(Boolean))];
  }, [events]);

  const eventMetrics = useMemo(() => {
    const byEvent = {};
    tickets.forEach((ticket) => {
      const eventId = ticket.eventId || '';
      if (!eventId) return;
      if (!byEvent[eventId]) {
        byEvent[eventId] = { ticketsSold: 0, revenue: 0 };
      }
      byEvent[eventId].ticketsSold += ticket.quantity || 1;
      byEvent[eventId].revenue += ticket.totalPaid || ticket.totalCharged || 0;
    });
    return byEvent;
  }, [tickets]);

  const overview = useMemo(() => {
    const upcoming = events.filter((event) => getEventTiming(event.date) === 'upcoming').length;
    const past = events.filter((event) => getEventTiming(event.date) === 'past').length;
    return {
      total: events.length,
      upcoming,
      past,
      tba: events.length - upcoming - past,
    };
  }, [events]);

  const filtered = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return events
      .filter((event) => {
        const matchesCategory = categoryFilter === 'all' ? true : event.category === categoryFilter;
        const timing = getEventTiming(event.date);
        const matchesTiming = timingFilter === 'all' ? true : timing === timingFilter;

        const searchable = [event.title, event.location, event.category, event.hostEmail]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();
        const matchesSearch = normalizedSearch ? searchable.includes(normalizedSearch) : true;

        return matchesCategory && matchesTiming && matchesSearch;
      })
      .sort((a, b) => {
        const aDate = new Date(a.date || 0).getTime() || 0;
        const bDate = new Date(b.date || 0).getTime() || 0;
        return bDate - aDate;
      });
  }, [events, searchTerm, categoryFilter, timingFilter]);

  const totalPages = Math.max(1, Math.ceil(filtered.length / itemsPerPage));
  const paginated = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filtered.slice(start, start + itemsPerPage);
  }, [currentPage, filtered]);

  const handleDeleteEvent = async (eventId) => {
    const eventToDelete = events.find((event) => event.id === eventId);
    const title = eventToDelete?.title || 'this event';

    if (!window.confirm(`Delete ${title} and all related tickets?`)) return;

    try {
      setBusyEventId(eventId);
      setFeedback({ type: '', message: '' });

      const ticketsSnap = await get(ref(database, 'tickets'));
      if (ticketsSnap.exists()) {
        const ticketsMap = ticketsSnap.val() || {};
        const deletions = Object.entries(ticketsMap)
          .filter(([, ticket]) => ticket.eventId === eventId)
          .map(([ticketId]) => remove(ref(database, `tickets/${ticketId}`)));
        await Promise.all(deletions);
      }

      await remove(ref(database, `events/${eventId}`));
      await sendAudit('delete_event', { eventId, title: eventToDelete?.title || '' });
      setFeedback({ type: 'success', message: 'Event deleted successfully.' });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.message || 'Failed to delete event.' });
    } finally {
      setBusyEventId('');
    }
  };

  const resetPaging = () => setCurrentPage(1);

  if (loading) return <div className="admin-panel">Loading events...</div>;

  return (
    <div className="admin-panel">
      <div className="admin-panel-head admin-transactions-header">
        <div>
          <span className="admin-panel-chip">Catalog</span>
          <h2>Events management</h2>
        </div>

        <div className="tx-pills">
          <div className="tx-pill">Total {overview.total}</div>
          <div className="tx-pill green">Upcoming {overview.upcoming}</div>
          <div className="tx-pill amber">TBA {overview.tba}</div>
          <div className="tx-pill red">Past {overview.past}</div>
          <Link to="/event/new" className="admin-primary-btn">Create Event</Link>
        </div>
      </div>

      {feedback.message ? (
        <p
          className={feedback.type === 'success' ? 'admin-value admin-value-emerald' : ''}
          style={feedback.type === 'error' ? { color: '#dc2626', fontWeight: 600 } : undefined}
        >
          {feedback.message}
        </p>
      ) : null}

      <div className="admin-toolbar" style={{ marginBottom: '1rem' }}>
        <label className="admin-search" style={{ minWidth: '300px' }}>
          <FiSearch aria-hidden="true" />
          <input
            type="text"
            placeholder="Search by title, location, category, host"
            value={searchTerm}
            onChange={(event) => {
              setSearchTerm(event.target.value);
              resetPaging();
            }}
          />
        </label>

        <label>
          Category
          <select
            value={categoryFilter}
            onChange={(event) => {
              setCategoryFilter(event.target.value);
              resetPaging();
            }}
            style={{ marginLeft: 8 }}
          >
            {categories.map((category) => (
              <option key={category} value={category}>
                {category === 'all' ? 'All' : category}
              </option>
            ))}
          </select>
        </label>

        <label>
          Timing
          <select
            value={timingFilter}
            onChange={(event) => {
              setTimingFilter(event.target.value);
              resetPaging();
            }}
            style={{ marginLeft: 8 }}
          >
            <option value="all">All</option>
            <option value="upcoming">Upcoming</option>
            <option value="tba">TBA</option>
            <option value="past">Past</option>
          </select>
        </label>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-stacked">
          <thead>
            <tr>
              <th>Event</th>
              <th>Date</th>
              <th>Category</th>
              <th>Location</th>
              <th>Tickets Sold</th>
              <th>Revenue</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginated.length === 0 ? (
              <tr>
                <td colSpan={7} className="admin-empty-state">No events match your filters.</td>
              </tr>
            ) : (
              paginated.map((event) => {
                const metrics = eventMetrics[event.id] || { ticketsSold: 0, revenue: 0 };
                return (
                  <tr key={event.id}>
                    <td data-label="Event">
                      <strong>{event.title || 'Untitled event'}</strong>
                      <div className="admin-processed-note">{event.hostEmail || 'No host email'}</div>
                    </td>
                    <td data-label="Date">
                      <span className="admin-value">{formatEventDate(event.date)}</span>
                      <div className="admin-processed-note">{event.startTime || 'No time'}</div>
                    </td>
                    <td data-label="Category">{event.category || 'Uncategorized'}</td>
                    <td data-label="Location">{event.location || 'Location TBA'}</td>
                    <td data-label="Tickets Sold" className="admin-value admin-value-blue">{metrics.ticketsSold}</td>
                    <td data-label="Revenue" className="admin-value admin-value-emerald">{formatNaira(metrics.revenue)}</td>
                    <td data-label="Actions">
                      <div className="admin-action-row">
                        <button
                          type="button"
                          className="admin-icon-btn"
                          onClick={() => navigate(`/event/edit/${event.id}`)}
                          aria-label={`Edit ${event.title || 'event'}`}
                        >
                          <FiEdit3 aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          className="admin-icon-btn admin-icon-btn-danger"
                          onClick={() => handleDeleteEvent(event.id)}
                          disabled={busyEventId === event.id}
                          aria-label={`Delete ${event.title || 'event'}`}
                        >
                          <FiTrash2 aria-hidden="true" />
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {totalPages > 1 ? (
        <div className="admin-pagination" style={{ display: 'flex', gap: 8 }}>
          <button
            type="button"
            className="admin-page-btn"
            onClick={() => setCurrentPage((page) => Math.max(1, page - 1))}
            disabled={currentPage === 1}
          >
            Prev
          </button>

          <span style={{ alignSelf: 'center' }}>Page {currentPage} of {totalPages}</span>

          <button
            type="button"
            className="admin-page-btn"
            onClick={() => setCurrentPage((page) => Math.min(totalPages, page + 1))}
            disabled={currentPage === totalPages}
          >
            Next
          </button>
        </div>
      ) : null}

      <div className="admin-panel" style={{ marginTop: '1rem', borderStyle: 'dashed' }}>
        <span className="admin-panel-chip">
          <FiCalendar aria-hidden="true" />
          Quick tip
        </span>
        <p className="admin-processed-note" style={{ marginTop: '.6rem' }}>
          Use Edit to update event details and ticket tiers. Deleting an event permanently removes its linked tickets.
        </p>
      </div>
    </div>
  );
};

export default AdminEvents;

import React, { useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { CSVLink } from 'react-csv';
import emailjs from '@emailjs/browser';
import { FiDownload, FiFileText, FiMail, FiSearch } from 'react-icons/fi';
import { database } from '../firebase/firebaseConfig.jsx';
import './admin-dashboard-troop.css';

const EMAILJS_SERVICE_ID = import.meta.env.VITE_EMAILJS_SERVICE_ID || '';
const EMAILJS_TEMPLATE_ID = import.meta.env.VITE_EMAILJS_TEMPLATE_ID || '';
const EMAILJS_PUBLIC_KEY = import.meta.env.VITE_EMAILJS_PUBLIC_KEY || '';

const formatNaira = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

const getPeriodStart = (period) => {
  if (period === 'all') return 0;
  const days = Number(period);
  if (!Number.isFinite(days)) return 0;
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  date.setDate(date.getDate() - days + 1);
  return date.getTime();
};

const AdminTicketsLedger = () => {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [period, setPeriod] = useState('30');
  const [currentPage, setCurrentPage] = useState(1);
  const [resendingId, setResendingId] = useState('');
  const [feedback, setFeedback] = useState({ type: '', message: '' });

  const itemsPerPage = 12;

  React.useEffect(() => {
    const offEvents = onValue(ref(database, 'events'), (snapshot) => {
      const map = snapshot.val() || {};
      setEvents(Object.entries(map).map(([id, value]) => ({ id, ...value })));
    });

    const offTickets = onValue(ref(database, 'tickets'), (snapshot) => {
      const map = snapshot.val() || {};
      const rows = Object.entries(map)
        .map(([id, value]) => ({ id, ...value }))
        .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
      setTickets(rows);
    });

    return () => {
      offEvents();
      offTickets();
    };
  }, []);

  const periodStart = useMemo(() => getPeriodStart(period), [period]);

  const filteredTickets = useMemo(() => {
    const normalizedSearch = searchTerm.trim().toLowerCase();

    return tickets
      .filter((ticket) => {
        const inPeriod = periodStart ? Number(ticket.timestamp || 0) >= periodStart : true;
        if (!inPeriod) return false;

        if (!normalizedSearch) return true;
        const eventTitle = ticket.eventTitle || events.find((event) => event.id === ticket.eventId)?.title || '';
        const haystack = [
          ticket.name,
          ticket.email,
          eventTitle,
          ticket.ticketType,
          ticket.transactionId,
          ticket.hostEmail,
        ]
          .filter(Boolean)
          .join(' ')
          .toLowerCase();

        return haystack.includes(normalizedSearch);
      })
      .sort((a, b) => (b.timestamp || 0) - (a.timestamp || 0));
  }, [events, periodStart, searchTerm, tickets]);

  const totalPages = Math.max(1, Math.ceil(filteredTickets.length / itemsPerPage));
  const paginatedTickets = useMemo(() => {
    const start = (currentPage - 1) * itemsPerPage;
    return filteredTickets.slice(start, start + itemsPerPage);
  }, [currentPage, filteredTickets]);

  const totals = useMemo(() => {
    return {
      orders: filteredTickets.length,
      quantity: filteredTickets.reduce((sum, ticket) => sum + (ticket.quantity || 1), 0),
      gross: filteredTickets.reduce((sum, ticket) => sum + (ticket.totalCharged || ticket.totalPaid || 0), 0),
      hostNet: filteredTickets.reduce((sum, ticket) => sum + (ticket.totalPaid || 0), 0),
      fees: filteredTickets.reduce((sum, ticket) => sum + ((ticket.hostFee || 0) + (ticket.serviceFee || 0)), 0),
    };
  }, [filteredTickets]);

  const csvRows = useMemo(() => {
    return filteredTickets.map((ticket) => {
      const eventTitle = ticket.eventTitle || events.find((event) => event.id === ticket.eventId)?.title || 'N/A';
      return {
        date: ticket.timestamp ? new Date(ticket.timestamp).toLocaleString() : 'N/A',
        name: ticket.name || '',
        email: ticket.email || '',
        event: eventTitle,
        ticketType: ticket.ticketType || '',
        quantity: ticket.quantity || 1,
        hostNet: ticket.totalPaid || 0,
        platformFees: (ticket.hostFee || 0) + (ticket.serviceFee || 0),
        buyerPaid: ticket.totalCharged || ticket.totalPaid || 0,
        transactionId: ticket.transactionId || ticket.id,
      };
    });
  }, [events, filteredTickets]);

  const handleResendEmail = async (ticket) => {
    if (!ticket.email) {
      setFeedback({ type: 'error', message: 'No email address found for this ticket.' });
      return;
    }

    if (!EMAILJS_SERVICE_ID || !EMAILJS_TEMPLATE_ID || !EMAILJS_PUBLIC_KEY) {
      setFeedback({ type: 'error', message: 'Email resend is unavailable because EmailJS is not configured.' });
      return;
    }

    try {
      setResendingId(ticket.id);
      setFeedback({ type: '', message: '' });
      const event = events.find((row) => row.id === ticket.eventId);
      const ticketPrice = ticket.totalPaid || 0;
      const totalPaid = ticket.totalCharged || ticket.totalPaid || 0;

      await emailjs.send(
        EMAILJS_SERVICE_ID,
        EMAILJS_TEMPLATE_ID,
        {
          to_email: ticket.email,
          user_name: ticket.name || ticket.email,
          event_name: ticket.eventTitle || event?.title || 'Your Event',
          event_date: event?.date || '',
          event_location: event?.location || '',
          ticket_type: ticket.ticketType || '',
          quantity: String(ticket.quantity || 1),
          unit_price: Number(ticketPrice).toLocaleString(),
          total_paid: Number(totalPaid).toLocaleString(),
          order_id: ticket.transactionId || ticket.id,
          qr_code_url: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(ticket.transactionId || ticket.id)}`,
          support_email: 'Ekotix234@gmail.com',
          company_name: 'Ekotix',
          current_year: String(new Date().getFullYear()),
        },
        EMAILJS_PUBLIC_KEY
      );

      setFeedback({ type: 'success', message: `Ticket email resent to ${ticket.email}.` });
    } catch (error) {
      setFeedback({ type: 'error', message: error?.text || error?.message || 'Failed to resend ticket email.' });
    } finally {
      setResendingId('');
    }
  };

  const resetPage = () => setCurrentPage(1);

  return (
    <div className="admin-panel">
      <div className="admin-panel-head admin-transactions-header">
        <div>
          <span className="admin-panel-chip">Operations</span>
          <h2>Tickets ledger</h2>
        </div>

        <div className="tx-pills">
          <div className="tx-pill">Orders {totals.orders}</div>
          <div className="tx-pill green">Tickets {totals.quantity}</div>
          <div className="tx-pill">Gross {formatNaira(totals.gross)}</div>
          <CSVLink data={csvRows} filename="tickets-ledger.csv" className="admin-primary-btn">
            <FiDownload aria-hidden="true" />
            Export CSV
          </CSVLink>
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
        <label className="admin-search" style={{ minWidth: '320px' }}>
          <FiSearch aria-hidden="true" />
          <input
            type="text"
            value={searchTerm}
            placeholder="Search by buyer, event, transaction, host"
            onChange={(event) => {
              setSearchTerm(event.target.value);
              resetPage();
            }}
          />
        </label>

        <label>
          Period
          <select
            value={period}
            onChange={(event) => {
              setPeriod(event.target.value);
              resetPage();
            }}
            style={{ marginLeft: 8 }}
          >
            <option value="7">Last 7 days</option>
            <option value="30">Last 30 days</option>
            <option value="90">Last 90 days</option>
            <option value="all">All time</option>
          </select>
        </label>

        <div className="tx-pill amber">Host Net {formatNaira(totals.hostNet)}</div>
        <div className="tx-pill red">Fees {formatNaira(totals.fees)}</div>
      </div>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-stacked">
          <thead>
            <tr>
              <th>Date</th>
              <th>Buyer</th>
              <th>Event</th>
              <th>Ticket</th>
              <th>Qty</th>
              <th>Host Net</th>
              <th>Platform Fees</th>
              <th>Buyer Paid</th>
              <th>Transaction</th>
              <th>Resend</th>
            </tr>
          </thead>
          <tbody>
            {paginatedTickets.length === 0 ? (
              <tr>
                <td colSpan={10} className="admin-empty-state">No ticket records found for this filter.</td>
              </tr>
            ) : (
              paginatedTickets.map((ticket) => {
                const eventTitle = ticket.eventTitle || events.find((event) => event.id === ticket.eventId)?.title || 'N/A';
                return (
                  <tr key={ticket.id}>
                    <td data-label="Date">{ticket.timestamp ? new Date(ticket.timestamp).toLocaleString() : 'N/A'}</td>
                    <td data-label="Buyer">
                      <strong>{ticket.name || 'N/A'}</strong>
                      <div className="admin-processed-note">{ticket.email || 'No email'}</div>
                    </td>
                    <td data-label="Event">{eventTitle}</td>
                    <td data-label="Ticket">{ticket.ticketType || 'General'}</td>
                    <td data-label="Qty">{ticket.quantity || 1}</td>
                    <td data-label="Host Net" className="admin-value admin-value-blue">{formatNaira(ticket.totalPaid || 0)}</td>
                    <td data-label="Platform Fees" className="admin-value admin-value-amber">
                      {formatNaira((ticket.hostFee || 0) + (ticket.serviceFee || 0))}
                    </td>
                    <td data-label="Buyer Paid" className="admin-value admin-value-emerald">
                      {formatNaira(ticket.totalCharged || ticket.totalPaid || 0)}
                    </td>
                    <td data-label="Transaction">{ticket.transactionId || ticket.id}</td>
                    <td data-label="Resend">
                      <button
                        type="button"
                        className="admin-inline-btn admin-inline-btn-amber"
                        onClick={() => handleResendEmail(ticket)}
                        disabled={resendingId === ticket.id}
                      >
                        <FiMail aria-hidden="true" />
                        {resendingId === ticket.id ? 'Sending...' : 'Resend'}
                      </button>
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
          <FiFileText aria-hidden="true" />
          Reconciliation tip
        </span>
        <p className="admin-processed-note" style={{ marginTop: '.6rem' }}>
          Buyer Paid = Host Net + Platform Fees. Use this ledger export for finance reconciliation.
        </p>
      </div>
    </div>
  );
};

export default AdminTicketsLedger;

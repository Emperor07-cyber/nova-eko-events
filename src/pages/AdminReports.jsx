import React, { useMemo, useState } from 'react';
import { onValue, ref } from 'firebase/database';
import { CSVLink } from 'react-csv';
import { LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, ResponsiveContainer } from 'recharts';
import { FiBarChart2, FiDownload, FiPieChart, FiTrendingUp, FiUsers } from 'react-icons/fi';
import { database } from '../firebase/firebaseConfig.jsx';
import './admin-dashboard-troop.css';

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

const parseTimestamp = (value) => {
  const asNumber = Number(value);
  return Number.isFinite(asNumber) && asNumber > 0 ? asNumber : 0;
};

const AdminReports = () => {
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [withdrawals, setWithdrawals] = useState([]);
  const [period, setPeriod] = useState('30');

  React.useEffect(() => {
    const offEvents = onValue(ref(database, 'events'), (snapshot) => {
      const map = snapshot.val() || {};
      setEvents(Object.entries(map).map(([id, value]) => ({ id, ...value })));
    });

    const offTickets = onValue(ref(database, 'tickets'), (snapshot) => {
      const map = snapshot.val() || {};
      setTickets(Object.entries(map).map(([id, value]) => ({ id, ...value })));
    });

    const offWithdrawals = onValue(ref(database, 'withdrawalRequests'), (snapshot) => {
      const map = snapshot.val() || {};
      setWithdrawals(Object.entries(map).map(([id, value]) => ({ id, ...value })));
    });

    return () => {
      offEvents();
      offTickets();
      offWithdrawals();
    };
  }, []);

  const rangeStart = useMemo(() => getPeriodStart(period), [period]);

  const filteredTickets = useMemo(() => {
    if (!rangeStart) return tickets;
    return tickets.filter((ticket) => parseTimestamp(ticket.timestamp) >= rangeStart);
  }, [tickets, rangeStart]);

  const grossRevenue = useMemo(() => {
    return filteredTickets.reduce((sum, ticket) => sum + (ticket.totalCharged || ticket.totalPaid || 0), 0);
  }, [filteredTickets]);

  const platformFees = useMemo(() => {
    return filteredTickets.reduce((sum, ticket) => sum + ((ticket.hostFee || 0) + (ticket.serviceFee || 0)), 0);
  }, [filteredTickets]);

  const hostNetRevenue = useMemo(() => {
    return filteredTickets.reduce((sum, ticket) => sum + (ticket.totalPaid || 0), 0);
  }, [filteredTickets]);

  const filteredWithdrawals = useMemo(() => {
    if (!rangeStart) return withdrawals;
    return withdrawals.filter((withdrawal) => parseTimestamp(withdrawal.timestamp) >= rangeStart);
  }, [withdrawals, rangeStart]);

  const payoutsCompleted = useMemo(() => {
    return filteredWithdrawals
      .filter((withdrawal) => withdrawal.status === 'completed')
      .reduce((sum, withdrawal) => sum + (withdrawal.amount || 0), 0);
  }, [filteredWithdrawals]);

  const pendingPayouts = useMemo(() => {
    return filteredWithdrawals
      .filter((withdrawal) => withdrawal.status === 'pending')
      .reduce((sum, withdrawal) => sum + (withdrawal.amount || 0), 0);
  }, [filteredWithdrawals]);

  const trendData = useMemo(() => {
    const byDay = {};
    filteredTickets.forEach((ticket) => {
      const ts = parseTimestamp(ticket.timestamp);
      const key = ts ? new Date(ts).toISOString().slice(0, 10) : 'Unknown';
      if (!byDay[key]) byDay[key] = { date: key, revenue: 0, tickets: 0 };
      byDay[key].revenue += ticket.totalCharged || ticket.totalPaid || 0;
      byDay[key].tickets += ticket.quantity || 1;
    });

    return Object.values(byDay).sort((a, b) => (a.date > b.date ? 1 : -1));
  }, [filteredTickets]);

  const topEvents = useMemo(() => {
    const byEvent = {};
    filteredTickets.forEach((ticket) => {
      const eventId = ticket.eventId || 'unknown';
      if (!byEvent[eventId]) {
        const event = events.find((row) => row.id === eventId);
        byEvent[eventId] = {
          eventId,
          title: ticket.eventTitle || event?.title || 'Untitled event',
          ticketsSold: 0,
          gross: 0,
          hostNet: 0,
          platform: 0,
        };
      }

      byEvent[eventId].ticketsSold += ticket.quantity || 1;
      byEvent[eventId].gross += ticket.totalCharged || ticket.totalPaid || 0;
      byEvent[eventId].hostNet += ticket.totalPaid || 0;
      byEvent[eventId].platform += (ticket.hostFee || 0) + (ticket.serviceFee || 0);
    });

    return Object.values(byEvent)
      .sort((a, b) => b.gross - a.gross)
      .slice(0, 8);
  }, [events, filteredTickets]);

  const topHosts = useMemo(() => {
    const byHost = {};

    filteredTickets.forEach((ticket) => {
      const host = ticket.hostEmail || 'Unknown';
      if (!byHost[host]) {
        byHost[host] = { hostEmail: host, ticketsSold: 0, hostNet: 0 };
      }
      byHost[host].ticketsSold += ticket.quantity || 1;
      byHost[host].hostNet += ticket.totalPaid || 0;
    });

    return Object.values(byHost)
      .sort((a, b) => b.hostNet - a.hostNet)
      .slice(0, 8);
  }, [filteredTickets]);

  const csvRows = useMemo(() => {
    return topEvents.map((event) => ({
      event: event.title,
      ticketsSold: event.ticketsSold,
      grossRevenue: event.gross,
      hostNetRevenue: event.hostNet,
      platformFees: event.platform,
    }));
  }, [topEvents]);

  const summaryRows = useMemo(() => {
    return [
      { metric: 'Gross Revenue', value: grossRevenue },
      { metric: 'Host Net Revenue', value: hostNetRevenue },
      { metric: 'Platform Fees', value: platformFees },
      { metric: 'Completed Payouts', value: payoutsCompleted },
      { metric: 'Pending Payouts', value: pendingPayouts },
      { metric: 'Tickets Sold', value: filteredTickets.reduce((sum, ticket) => sum + (ticket.quantity || 1), 0) },
      { metric: 'Events with Sales', value: topEvents.length },
      { metric: 'Unique Buyers', value: new Set(filteredTickets.map((ticket) => ticket.email)).size },
    ];
  }, [filteredTickets, grossRevenue, hostNetRevenue, pendingPayouts, platformFees, payoutsCompleted, topEvents.length]);

  return (
    <div className="admin-dashboard">
      <section className="admin-panel">
        <div className="admin-panel-head admin-transactions-header">
          <div>
            <span className="admin-panel-chip">Insights</span>
            <h2>Reports</h2>
          </div>

          <div className="tx-pills">
            <label>
              Period
              <select value={period} onChange={(event) => setPeriod(event.target.value)} style={{ marginLeft: 8 }}>
                <option value="7">Last 7 days</option>
                <option value="30">Last 30 days</option>
                <option value="90">Last 90 days</option>
                <option value="all">All time</option>
              </select>
            </label>
            <CSVLink data={summaryRows} filename="admin-report-summary.csv" className="admin-secondary-btn">
              <FiDownload aria-hidden="true" />
              Export Summary CSV
            </CSVLink>
            <CSVLink data={csvRows} filename="admin-top-events.csv" className="admin-primary-btn">
              <FiDownload aria-hidden="true" />
              Export Top Events CSV
            </CSVLink>
          </div>
        </div>
      </section>

      <section className="admin-kpi-grid admin-remote-overview">
        <article className="admin-kpi-card kpi-card-emerald admin-card">
          <span className="admin-kpi-icon"><FiTrendingUp aria-hidden="true" /></span>
          <div>
            <p>Gross Revenue</p>
            <strong className="kpi-value">{formatNaira(grossRevenue)}</strong>
          </div>
        </article>

        <article className="admin-kpi-card kpi-card-blue admin-card">
          <span className="admin-kpi-icon"><FiUsers aria-hidden="true" /></span>
          <div>
            <p>Host Net Revenue</p>
            <strong className="kpi-value">{formatNaira(hostNetRevenue)}</strong>
          </div>
        </article>

        <article className="admin-kpi-card kpi-card-amber admin-card">
          <span className="admin-kpi-icon"><FiPieChart aria-hidden="true" /></span>
          <div>
            <p>Platform Fees</p>
            <strong className="kpi-value">{formatNaira(platformFees)}</strong>
          </div>
        </article>

        <article className="admin-kpi-card kpi-card-purple admin-card">
          <span className="admin-kpi-icon"><FiBarChart2 aria-hidden="true" /></span>
          <div>
            <p>Pending Payouts</p>
            <strong className="kpi-value">{formatNaira(pendingPayouts)}</strong>
          </div>
        </article>
      </section>

      <section className="admin-main-grid admin-dashboard-main">
        <article className="admin-panel admin-panel-graph">
          <div className="admin-panel-head admin-panel-head-wrap">
            <div>
              <span className="admin-panel-chip">Revenue trend</span>
              <h2>Daily sales trend</h2>
            </div>
          </div>

          <div className="admin-chart-wrap">
            <ResponsiveContainer width="100%" height={320}>
              <LineChart data={trendData} margin={{ top: 12, right: 0, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 6" vertical={false} stroke="#e6f2ea" />
                <XAxis dataKey="date" tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                <YAxis tick={{ fill: '#64748b', fontSize: 12 }} tickLine={false} axisLine={false} />
                <Tooltip formatter={(value, name) => (name === 'revenue' ? formatNaira(value) : value)} />
                <Line type="monotone" dataKey="revenue" stroke="#16a34a" strokeWidth={3} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </article>

        <article className="admin-panel admin-panel-events">
          <div className="admin-panel-head admin-panel-head-wrap">
            <div>
              <span className="admin-panel-chip">Payouts</span>
              <h2>Payout status</h2>
            </div>
          </div>

          <div className="admin-activity-list">
            <div className="admin-activity-row">
              <div>
                <strong>Completed payouts</strong>
                <span>Total paid to hosts</span>
              </div>
              <div className="admin-value admin-value-emerald">{formatNaira(payoutsCompleted)}</div>
            </div>
            <div className="admin-activity-row">
              <div>
                <strong>Pending payouts</strong>
                <span>Awaiting admin processing</span>
              </div>
              <div className="admin-value admin-value-amber">{formatNaira(pendingPayouts)}</div>
            </div>
            <div className="admin-activity-row">
              <div>
                <strong>Requests count</strong>
                <span>Within selected period</span>
              </div>
              <div className="admin-value">{filteredWithdrawals.length}</div>
            </div>
          </div>
        </article>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span className="admin-panel-chip">Performance</span>
            <h2>Top events by revenue</h2>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table-stacked">
            <thead>
              <tr>
                <th>Event</th>
                <th>Tickets Sold</th>
                <th>Gross Revenue</th>
                <th>Host Net</th>
                <th>Platform Fees</th>
              </tr>
            </thead>
            <tbody>
              {topEvents.length === 0 ? (
                <tr>
                  <td colSpan={5} className="admin-empty-state">No event sales found for this period.</td>
                </tr>
              ) : (
                topEvents.map((event) => (
                  <tr key={event.eventId}>
                    <td data-label="Event">{event.title}</td>
                    <td data-label="Tickets Sold">{event.ticketsSold}</td>
                    <td data-label="Gross Revenue" className="admin-value admin-value-emerald">{formatNaira(event.gross)}</td>
                    <td data-label="Host Net" className="admin-value admin-value-blue">{formatNaira(event.hostNet)}</td>
                    <td data-label="Platform Fees" className="admin-value admin-value-amber">{formatNaira(event.platform)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <section className="admin-panel">
        <div className="admin-panel-head">
          <div>
            <span className="admin-panel-chip">Hosts</span>
            <h2>Top hosts by earnings</h2>
          </div>
        </div>

        <div className="admin-table-wrap">
          <table className="admin-table admin-table-stacked">
            <thead>
              <tr>
                <th>Host</th>
                <th>Tickets Sold</th>
                <th>Net Earnings</th>
              </tr>
            </thead>
            <tbody>
              {topHosts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="admin-empty-state">No host earnings found for this period.</td>
                </tr>
              ) : (
                topHosts.map((host) => (
                  <tr key={host.hostEmail}>
                    <td data-label="Host">{host.hostEmail}</td>
                    <td data-label="Tickets Sold">{host.ticketsSold}</td>
                    <td data-label="Net Earnings" className="admin-value admin-value-emerald">{formatNaira(host.hostNet)}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
};

export default AdminReports;

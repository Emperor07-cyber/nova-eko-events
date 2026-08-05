import React from 'react';
import { useAdminSummary } from '../../hooks/useAdminSummary';
import KPICard from './KPICard';
import { FiCalendar, FiCreditCard, FiDollarSign, FiUsers } from 'react-icons/fi';

const formatNaira = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

const RemoteAdminOverview = () => {
  const { data, error, isLoading } = useAdminSummary();

  if (isLoading) return <div className="admin-remote-loading">Loading summary...</div>;
  if (error) return <div className="admin-remote-error">Error loading summary</div>;

  const stats = {
    totalEvents: data.totalEvents || 0,
    totalTicketsSold: data.totalTicketsSold || 0,
    totalRevenue: data.totalRevenue || 0,
    totalAttendees: data.uniqueAttendees || 0,
  };

  // If server provides changes, use them; otherwise omit delta
  const deltas = data.deltas || {};

  return (
    <section className="admin-kpi-grid admin-remote-overview">
      <KPICard icon={FiCalendar} label="Total Events" value={stats.totalEvents} delta={deltas.totalEvents} colorClass="kpi-card-emerald" />
      <KPICard icon={FiCreditCard} label="Tickets Sold" value={stats.totalTicketsSold} delta={deltas.totalTicketsSold} colorClass="kpi-card-blue" />
      <KPICard icon={FiDollarSign} label="Total Revenue" value={formatNaira(stats.totalRevenue)} delta={deltas.totalRevenue} colorClass="kpi-card-amber" />
      <KPICard icon={FiUsers} label="Unique Attendees" value={stats.totalAttendees} delta={deltas.totalAttendees} colorClass="kpi-card-purple" />
    </section>
  );
};

export default RemoteAdminOverview;

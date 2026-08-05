import React from 'react';
import KPICard from './KPICard';
import { FiCalendar, FiCreditCard, FiDollarSign, FiUsers } from 'react-icons/fi';

const AdminOverview = ({ stats = {} }) => {
  const {
    totalEvents = 0,
    totalTicketsSold = 0,
    totalRevenue = 0,
    totalAttendees = 0,
  } = stats;

  const formatNaira = (value) => `NGN ${Number(value || 0).toLocaleString()}`;

  return (
    <section className="admin-kpi-grid">
      <KPICard icon={FiCalendar} label="Total Events" value={totalEvents} />
      <KPICard icon={FiCreditCard} label="Tickets Sold" value={totalTicketsSold} />
      <KPICard icon={FiDollarSign} label="Total Revenue" value={formatNaira(totalRevenue)} />
      <KPICard icon={FiUsers} label="Unique Attendees" value={totalAttendees} />
    </section>
  );
};

export default AdminOverview;

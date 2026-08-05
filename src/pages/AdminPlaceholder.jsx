import React from 'react';
import { useParams, Link } from 'react-router-dom';

const sectionTitles = {
  transactions: 'Transactions',
  withdrawals: 'Withdrawal Requests',
  events: 'Events',
  reports: 'Reports',
  'tickets-ledger': 'Tickets Ledger',
  users: 'Users',
  settings: 'Settings',
  'system-logs': 'System Logs',
};

const AdminPlaceholder = () => {
  const { section } = useParams();
  const title = sectionTitles[section] || 'Admin Section';

  return (
    <div className="admin-dashboard admin-panel" style={{ padding: '2rem' }}>
      <div className="admin-panel-head">
        <div>
          <span className="admin-panel-chip">Admin</span>
          <h2>{title}</h2>
        </div>
      </div>
      <div className="admin-empty-state">
        <p>This section is coming soon. The sidebar has been updated to match the new admin design.</p>
        <Link to="/admin/dashboard" className="admin-secondary-btn" style={{ marginTop: '1rem' }}>
          Back to Overview
        </Link>
      </div>
    </div>
  );
};

export default AdminPlaceholder;

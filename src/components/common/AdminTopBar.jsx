import React from 'react';

const AdminTopBar = ({ children }) => {
  return (
    <div className="admin-topbar admin-card" role="banner">
      <div className="admin-topbar-left">
        {children}
      </div>
      <div className="admin-topbar-actions">
        <div className="admin-topbar-controls">
          <label className="date-range">
            <input type="month" aria-label="Select date range start" />
          </label>
        </div>
        <button className="button-primary">Export Report</button>
      </div>
    </div>
  );
};

export default AdminTopBar;

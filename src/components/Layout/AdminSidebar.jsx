import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiGrid,
  FiLogOut,
  FiShield,
  FiTool,
  FiX,
  FiFileText,
  FiList,
  FiSettings,
  FiUsers,
  FiActivity,
  FiCreditCard,
} from "react-icons/fi";
import { signOut } from "firebase/auth";
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth as firebaseAuth } from '../../firebase/firebaseConfig.jsx';

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const [user] = useAuthState(firebaseAuth);

  const navItems = [
    { to: "/admin/dashboard", icon: FiGrid, label: "Overview" },
    { to: "/admin/transactions", icon: FiActivity, label: "Transactions" },
    { to: "/admin/withdrawals", icon: FiCreditCard, label: "Withdrawal Requests" },
    { to: "/admin/events", icon: FiCalendar, label: "Events" },
    { to: "/admin/reports", icon: FiFileText, label: "Reports" },
    { to: "/admin/tickets-ledger", icon: FiList, label: "Tickets Ledger" },
    { to: "/admin/users", icon: FiUsers, label: "Users" },
    { to: "/admin/settings", icon: FiSettings, label: "Settings" },
    { to: "/admin/system-logs", icon: FiShield, label: "System Logs" },
  ];

  const handleLogout = async () => {
    await signOut(firebaseAuth);
    navigate("/login");
  };

  return (
    <>
      {sidebarOpen ? (
        <div className="admin-sidebar-overlay" onClick={() => setSidebarOpen(false)} />
      ) : null}

      <aside className={`admin-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-brand">
            <img
              src="/images/Logo1.jpg"
              alt="Ekotix logo"
              className="admin-sidebar-logo"
            />
            <div className="admin-sidebar-brand-copy">
              <strong>Etix.</strong>
              <span>eko tix</span>
            </div>
          </div>
          <button
            type="button"
            className="admin-sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
            aria-label="Close sidebar"
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <nav className="admin-sidebar-nav">
          <p className="admin-sidebar-nav-title">ADMIN PANEL</p>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;

            return (
              <Link
                key={to}
                to={to}
                className={`admin-sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="admin-sidebar-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="admin-sidebar-label">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="admin-sidebar-highlight">
          <span className="admin-sidebar-highlight-icon" aria-hidden="true">
            <FiShield />
          </span>
          <div>
            <strong>Admin-only access</strong>
            <p>Monitor revenue, payouts, ticket activity, and event operations.</p>
          </div>
        </div>

        {/* user box */}
        <div className="admin-sidebar-user">
          <img src={user?.photoURL || '/images/ekotixx.jpeg'} alt={user?.displayName || user?.email || 'Admin'} className="admin-user-avatar" />
          <div className="admin-user-info">
            <div className="admin-user-name">{user?.displayName || 'Admin'}</div>
            <div className="admin-user-email">{user?.email || ''}</div>
          </div>
        </div>

        <div className="admin-sidebar-logout">
          <button type="button" className="admin-sidebar-logout-btn" onClick={handleLogout}>
            <span className="admin-sidebar-icon" aria-hidden="true">
              <FiLogOut />
            </span>
            <span className="admin-sidebar-label">Logout</span>
          </button>
        </div>

        <div className="admin-sidebar-footer">Ekotix Admin Portal</div>
      </aside>
    </>
  );
};

export default AdminSidebar;

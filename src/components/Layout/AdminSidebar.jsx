import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiGrid,
  FiLogOut,
  FiShield,
  FiTool,
  FiX,
} from "react-icons/fi";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";

const AdminSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: "/admin/dashboard", icon: FiGrid, label: "Dashboard" },
    { to: "/event/new", icon: FiCalendar, label: "Create Event" },
    { to: "/checkin", icon: FiTool, label: "Check-In Tool" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
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
              <strong>Ekotix Admin</strong>
              <span>Operations Suite</span>
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
          <p className="admin-sidebar-nav-title">Navigation</p>
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

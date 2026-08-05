import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  FiCalendar,
  FiCheckCircle,
  FiCreditCard,
  FiGrid,
  FiLogOut,
  FiSettings,
  FiShoppingBag,
  FiUsers,
  FiX,
} from "react-icons/fi";
import { auth } from "../../firebase/firebaseConfig";
import { signOut } from "firebase/auth";

const HostSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: "/host/dashboard", icon: FiGrid, label: "Dashboard" },
    { to: "/host/events", icon: FiCalendar, label: "Events" },
    { to: "/host/checkin", icon: FiCheckCircle, label: "Check-In" },
    { to: "/host/attendees", icon: FiUsers, label: "Attendees" },
    { to: "/host/merch", icon: FiShoppingBag, label: "Merch" },
    { to: "/host/wallet", icon: FiCreditCard, label: "Wallet" },
    { to: "/host/settings", icon: FiSettings, label: "Settings" },
  ];

  const handleLogout = async () => {
    await signOut(auth);
    navigate("/login");
  };

  return (
    <>
      {sidebarOpen && (
        <div
          className="sidebar-overlay"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`host-sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <img
              src="/images/Logo1.jpg"
              alt="Ekotix logo"
              className="sidebar-logo-img"
            />
            <div className="sidebar-brand-copy">
              <strong>Ekotix Host</strong>
              <span>Control Center</span>
            </div>
          </div>
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            <FiX aria-hidden="true" />
          </button>
        </div>

        <nav className="sidebar-nav">
          <p className="sidebar-nav-title">Navigation</p>
          {navItems.map(({ to, icon: Icon, label }) => {
            const isActive = location.pathname === to;

            return (
              <Link
                key={to}
                to={to}
                className={`sidebar-link ${isActive ? "active" : ""}`}
                onClick={() => setSidebarOpen(false)}
              >
                <span className="sidebar-icon" aria-hidden="true">
                  <Icon />
                </span>
                <span className="sidebar-label">{label}</span>
              </Link>
            );
          })}
        </nav>

        <div className="sidebar-logout">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span className="sidebar-icon sidebar-icon-logout" aria-hidden="true">
              <FiLogOut />
            </span>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>

        <div className="sidebar-footer">Ekotix Host Portal</div>
      </aside>
    </>
  );
};

export default HostSidebar;
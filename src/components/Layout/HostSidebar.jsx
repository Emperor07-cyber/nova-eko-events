import React from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { auth } from "../../firebase/firebaseConfig";
import { signOut } from "firebase/auth";

const HostSidebar = ({ sidebarOpen, setSidebarOpen }) => {
  const location = useLocation();
  const navigate = useNavigate();

  const navItems = [
    { to: "/host/dashboard", icon: "📊", label: "Dashboard" },
    { to: "/host/events",    icon: "🎫", label: "Events"    },
    { to: "/host/wallet",    icon: "💳", label: "Wallet"    },
    { to: "/host/settings",  icon: "⚙️", label: "Settings"  },
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
          <img
            src="/images/Logo4.jpg"
            alt="Nova Eko Logo"
            className="sidebar-logo-img"
          />
          <button
            className="sidebar-close-btn"
            onClick={() => setSidebarOpen(false)}
          >
            ✕
          </button>
        </div>

        <nav className="sidebar-nav">
          {navItems.map(({ to, icon, label }) => (
            <Link
              key={to}
              to={to}
              className={`sidebar-link ${location.pathname === to ? "active" : ""}`}
              onClick={() => setSidebarOpen(false)}
            >
              <span className="sidebar-icon">{icon}</span>
              <span className="sidebar-label">{label}</span>
            </Link>
          ))}
        </nav>

        {/* Logout at bottom */}
        <div className="sidebar-logout">
          <button className="sidebar-logout-btn" onClick={handleLogout}>
            <span className="sidebar-icon">🚪</span>
            <span className="sidebar-label">Logout</span>
          </button>
        </div>

        <div className="sidebar-footer">Host Portal</div>
      </aside>
    </>
  );
};

export default HostSidebar;
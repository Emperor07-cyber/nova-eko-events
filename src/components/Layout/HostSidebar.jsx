import React, { useState } from "react";
import { Link } from "react-router-dom";

const HostSidebar = () => {
  const [expanded, setExpanded] = useState(false);

  return (
    <div className={`host-sidebar ${expanded ? "expanded" : ""}`}>
      
      <button
        className="sidebar-toggle-btn"
        onClick={() => setExpanded(!expanded)}
      >
        ☰
      </button>

      <ul>
        <li>
          <Link to="/host/dashboard">
            📊 <span>Dashboard</span>
          </Link>
        </li>
        <li>
          <Link to="/host/events">
            🎫 <span>Events</span>
          </Link>
        </li>
        <li>
          <Link to="/host/wallet">
            💳 <span>Wallet</span>
          </Link>
        </li>
        <li>
          <Link to="/host/settings">
            ⚙️ <span>Settings</span>
          </Link>
        </li>
      </ul>
    </div>
  );
};

export default HostSidebar;

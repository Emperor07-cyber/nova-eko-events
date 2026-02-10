import React from "react";
import { Link } from "react-router-dom";
import {
  FaTachometerAlt,
  FaWallet,
  FaCalendarAlt,
  FaCog
} from "react-icons/fa";
import "../../main.css"; // ✅ correct path to global CSS



const HostSidebar = () => {
  return (
    <aside className="host-sidebar">
      <nav>
        <ul>
          <li>
            <Link to="/host/dashboard">
  <FaTachometerAlt className="icon" />
  <span>Dashboard</span>
</Link>

<Link to="/host/wallet">
  <FaWallet className="icon" />
  <span>Wallet</span>
</Link>

<Link to="/host/events">
  <FaCalendarAlt className="icon" />
  <span>Events</span>
</Link>

<Link to="/host/settings">
  <FaCog className="icon" />
  <span>Settings</span>
</Link>

          </li>
        </ul>
      </nav>
    </aside>
  );
};
export default HostSidebar;
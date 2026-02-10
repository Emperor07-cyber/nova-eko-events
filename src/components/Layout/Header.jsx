import React, { useState } from "react";
import { Link, useLocation } from "react-router-dom";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const location = useLocation();

  // ✅ Detect host routes
  const isHostRoute = location.pathname.startsWith("/host");

  const handleLinkClick = () => {
    setMenuOpen(false);
  };

  // ✅ Hide header entirely on host routes (mobile-first)
  if (isHostRoute) return null;

  return (
    <header className="site-header">
      <div className="home-logo">
        <Link to="/">
          <img
            src="/images/Logo4.jpg"
            alt="NovaEko Logo"
            className="logo-img"
          />
        </Link>
      </div>

      <div
        className={`menu-toggle ${menuOpen ? "open" : ""}`}
        onClick={() => setMenuOpen(!menuOpen)}
        aria-label="Toggle menu"
      >
        <span></span>
        <span></span>
        <span></span>
      </div>

      <nav className={`nav-links ${menuOpen ? "open" : ""}`}>
        <Link to="/" onClick={handleLinkClick}>Home</Link>
        <Link to="/eventlist" onClick={handleLinkClick}>Events</Link>
        <Link to="/my-tickets" onClick={handleLinkClick}>My Tickets</Link>
        <Link to="/login" onClick={handleLinkClick}>Login</Link>
      </nav>
    </header>
  );
};

export default Header;

import React from "react";
import { Link } from "react-router-dom";


const Header = () => {
  return (
    <header className="site-header">
      <div className="logo">
        <Link to="/">🎫 NovaEko</Link>
      </div>
      <nav className="nav-links">
        <Link to="/">Home</Link>
        <Link to="/my-tickets">My Tickets</Link>
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </nav>
    </header>
  );
};

export default Header;

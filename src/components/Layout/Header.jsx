import React, { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { auth } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { ref, get } from "firebase/database";
import { database } from "../../firebase/firebaseConfig";
import { signOut } from "firebase/auth";
import "./header.css";

const Header = () => {
  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [user] = useAuthState(auth);
  const location = useLocation();

  const isHostRoute = location.pathname.startsWith("/host");
  const isAdminRoute = location.pathname.startsWith("/admin");

  // Detect scroll for header shadow
  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 8);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // Fetch user role
  useEffect(() => {
    if (!user) { setUserRole(null); return; }
    get(ref(database, `users/${user.uid}`)).then((snap) => {
      setUserRole(snap.val()?.role || null);
    });
  }, [user]);

  const handleLinkClick = () => setMenuOpen(false);

  const handleSignOut = async () => {
    await signOut(auth);
    setMenuOpen(false);
  };

  if (isHostRoute || isAdminRoute) return null;

  return (
    <>
      <header className={`hdr${scrolled ? " hdr--scrolled" : ""}`}>
        <div className="hdr-inner">

          {/* Logo */}
          <Link to="/" className="hdr-logo" onClick={handleLinkClick}>
            <img src="/images/Logo4.jpg" alt="Ekotix" className="hdr-logo-img" />
          </Link>

          {/* Desktop Nav */}
          <nav className="hdr-nav">
            <Link to="/" className={`hdr-link${location.pathname === "/" ? " hdr-link--active" : ""}`}>Home</Link>
            <Link to="/eventlist" className={`hdr-link${location.pathname === "/eventlist" ? " hdr-link--active" : ""}`}>Discover</Link>
            {user && (
              <Link to="/my-tickets" className={`hdr-link${location.pathname === "/my-tickets" ? " hdr-link--active" : ""}`}>My Tickets</Link>
            )}
            {userRole === "host" && (
              <Link to="/host/dashboard" className="hdr-link">Dashboard</Link>
            )}
            {userRole === "admin" && (
              <Link to="/admin/dashboard" className="hdr-link">Admin</Link>
            )}
          </nav>

          {/* Desktop Actions */}
          <div className="hdr-actions">
            {user ? (
              <>
                <div className="hdr-avatar" title={user.email}>
                  {user.email?.[0]?.toUpperCase()}
                </div>
                <button className="hdr-btn-ghost" onClick={handleSignOut}>Sign out</button>
              </>
            ) : (
              <>
                <Link to="/login" className="hdr-btn-ghost">Log in</Link>
                <Link to="/register" className="hdr-btn-primary">Host an event</Link>
              </>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            className={`hdr-hamburger${menuOpen ? " hdr-hamburger--open" : ""}`}
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label="Toggle menu"
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </header>

      {/* Mobile Menu */}
      {menuOpen && (
        <div className="hdr-mobile-menu">
          <Link to="/" className="hdr-mobile-link" onClick={handleLinkClick}>Home</Link>
          <Link to="/eventlist" className="hdr-mobile-link" onClick={handleLinkClick}>Discover</Link>
          {user && (
            <Link to="/my-tickets" className="hdr-mobile-link" onClick={handleLinkClick}>My Tickets</Link>
          )}
          {userRole === "host" && (
            <Link to="/host/dashboard" className="hdr-mobile-link" onClick={handleLinkClick}>Dashboard</Link>
          )}
          {userRole === "admin" && (
            <Link to="/admin/dashboard" className="hdr-mobile-link" onClick={handleLinkClick}>Admin</Link>
          )}
          <div className="hdr-mobile-divider" />
          {user ? (
            <button className="hdr-mobile-link hdr-mobile-signout" onClick={handleSignOut}>Sign out</button>
          ) : (
            <>
              <Link to="/login" className="hdr-mobile-link" onClick={handleLinkClick}>Log in</Link>
              <Link to="/register" className="hdr-mobile-btn" onClick={handleLinkClick}>Host an event</Link>
            </>
          )}
        </div>
      )}

      {/* Backdrop */}
      {menuOpen && <div className="hdr-backdrop" onClick={() => setMenuOpen(false)} />}
    </>
  );
};

export default Header;
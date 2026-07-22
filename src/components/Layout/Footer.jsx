import React from "react";
import { FiArrowRight, FiCreditCard, FiMail, FiPhoneCall, FiShield, FiUsers } from "react-icons/fi";
import { FaInstagram } from "react-icons/fa";
import { Link } from "react-router-dom";

const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-shell">
        <section className="footer-spotlight">
          <div className="footer-spotlight-copy">
            <span className="footer-kicker">Built for modern event culture</span>
            <h2>Ticketing, check-in, payouts, and merch - all in one Ekotix flow.</h2>
            <p>
              From nightlife drops to premium experiences, Ekotix helps hosts launch faster and helps guests book with confidence.
            </p>
          </div>

          <div className="footer-spotlight-stats">
            <div className="footer-stat-card">
              <span className="footer-stat-icon">
                <FiCreditCard aria-hidden="true" />
              </span>
              <strong>Instant ticket delivery</strong>
              <p>Fast checkout with digital access ready at the door.</p>
            </div>
            <div className="footer-stat-card">
              <span className="footer-stat-icon">
                <FiShield aria-hidden="true" />
              </span>
              <strong>Reliable operations</strong>
              <p>Track sales, manage payouts, and keep entry secure.</p>
            </div>
            <div className="footer-stat-card">
              <span className="footer-stat-icon">
                <FiUsers aria-hidden="true" />
              </span>
              <strong>Made for hosts and guests</strong>
              <p>Cleaner event discovery on the front end and powerful controls backstage.</p>
            </div>
          </div>
        </section>

        <div className="footer-container">
          <div className="footer-brand">
            <div className="footer-brand-mark">
              <img src="/images/Logo1.jpg" alt="Ekotix logo" />
            </div>
            <div className="footer-brand-copy">
              <strong>Ekotix</strong>
              <p>
                Premium event experiences for organizers, teams, and attendees across Nigeria.
              </p>
            </div>
            <Link to="/register" className="footer-cta-link">
              Start hosting
              <FiArrowRight aria-hidden="true" />
            </Link>
          </div>

          <div className="footer-links">
            <h4>Explore</h4>
            <ul>
              <li><Link to="/">Discover</Link></li>
              <li><Link to="/eventlist">Events</Link></li>
              <li><Link to="/my-tickets">My Tickets</Link></li>
              <li><Link to="/register">Host an Event</Link></li>
            </ul>
          </div>

          <div className="footer-links">
            <h4>Company</h4>
            <ul>
              <li><Link to="/privacy">Privacy Policy</Link></li>
              <li><Link to="/terms">Terms &amp; Conditions</Link></li>
              <li><Link to="/checkin">Check-In Tool</Link></li>
            </ul>
          </div>

          <div className="footer-contact">
            <h4>Contact</h4>
            <div className="footer-contact-list">
              <a href="mailto:Ekotix234@gmail.com">
                <FiMail aria-hidden="true" />
                <span>Ekotix234@gmail.com</span>
              </a>
              <a href="tel:+2349035092518">
                <FiPhoneCall aria-hidden="true" />
                <span>+234 903 509 2518</span>
              </a>
              <a href="tel:+2349013286471">
                <FiPhoneCall aria-hidden="true" />
                <span>+234 901 328 6471</span>
              </a>
            </div>
          </div>

          <div className="footer-social">
            <h4>Follow Ekotix</h4>
            <p>Stay close to upcoming drops, host tools, and event culture updates.</p>
            <div className="footer-social-icons">
              <a href="https://www.instagram.com/eko.tix?igsh=ZDg5YWFmanA1dDFo" target="_blank" rel="noopener noreferrer" aria-label="Follow Ekotix on Instagram">
                <FaInstagram size={20} />
              </a>
            </div>
          </div>
        </div>

        <div className="footer-bottom">
          <p>© {new Date().getFullYear()} Ekotix. All rights reserved.</p>
          <div className="footer-bottom-links">
            <Link to="/privacy">Privacy Policy</Link>
            <Link to="/terms">Terms &amp; Conditions</Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;

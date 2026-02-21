import React from "react";
import { FaTwitter, FaInstagram, FaSnapchat } from "react-icons/fa";
import { Link } from "react-router-dom";


const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="footer-container">
        {/* Left Section */}
        <div className="footer-brand">

          <img src="/images/Logo4.jpg" style={{ width: "90px", height: "80px" }} />
          <p>Making events simple, fun, and accessible.</p>
        </div>{
        /* Links */}
        <div className="footer-links">
          <h4>Quick Links</h4>
          <ul>
            <li><Link to="/eventlist">Discover</Link></li>
            <li><Link to="/pricing">Pricing</Link></li>
            <li><Link to="/faq">FAQ</Link></li>
          </ul>
        </div>
        {/* Social Media */}
        <div className="footer-social">
          <h4>Follow Us</h4>
          <div className="footer-social-icons">
          {/* <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
            <FaTwitter size={24} />
          </a> */}
          <a href="https://www.instagram.com/eko.tix?igsh=ZDg5YWFmanA1dDFo" target="_blank" rel="noopener noreferrer">
            <FaInstagram size={24} />
          </a>
          {/* <a href="https://snapchat.com" target="_blank" rel="noopener noreferrer">
            <FaSnapchat size={24} />
          </a> */}
        </div>
        </div>

        

        {/* Contact */}
        <div className="footer-contact">
          <h4>Contact</h4>
          <p>Email: Ekotix234@gmail.com</p>
          <p>Phone: +234 903 509 2518 </p>
          <p>Phone: +234 901 328 6471 </p>
        </div>
      </div>

      <div className="footer-bottom">
        <p>© {new Date().getFullYear()} Ekotixx. All rights reserved.</p>
      </div>
    </footer>
  );
};


export default Footer;

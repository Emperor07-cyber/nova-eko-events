import React from "react";
import { FaTwitter, FaInstagram, FaSnapchat } from "react-icons/fa";


const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="social-icons">
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <FaTwitter />
        </a>
        <a href="https://www.instagram.com/nova.eko_events?igsh=YWxwY2QxZDRlczV6" target="_blank" rel="noopener noreferrer">
          <FaInstagram />
        </a>
        <a href="https://snapchat.com/t/OTD9j1YH" target="_blank" rel="noopener noreferrer">
          <FaSnapchat />
        </a>
      </div>
      <p>&copy; {new Date().getFullYear()} NovaEko Events. All rights reserved.</p>
    </footer>
  );
};

export default Footer;

import React from "react";
import { FaTwitter, FaInstagram, FaFacebookF } from "react-icons/fa";


const Footer = () => {
  return (
    <footer className="site-footer">
      <div className="social-icons">
        <a href="https://twitter.com" target="_blank" rel="noopener noreferrer">
          <FaTwitter />
        </a>
        <a href="https://instagram.com" target="_blank" rel="noopener noreferrer">
          <FaInstagram />
        </a>
        <a href="https://facebook.com" target="_blank" rel="noopener noreferrer">
          <FaFacebookF />
        </a>
      </div>
      <p>&copy; {new Date().getFullYear()} NovaEko Events. All rights reserved.</p>
    </footer>
  );
};

export default Footer;

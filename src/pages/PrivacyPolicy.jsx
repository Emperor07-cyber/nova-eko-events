import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";

const PrivacyPolicy = () => {
  return (
    <>
      <Header />
      <div className="legal-page">
        <div className="legal-container">
          <div className="legal-header">
            <h1>Privacy Policy</h1>
            <p className="legal-date">Last updated: June 2025</p>
          </div>

          <div className="legal-content">
            <p>
              Welcome to <strong>Ekotix</strong> ("we", "our", or "us"). We are committed to protecting your
              personal information and your right to privacy. This Privacy Policy explains how we collect,
              use, and share information about you when you use our platform at{" "}
              <strong>ekotixx.com</strong> (the "Service").
            </p>

            <h2>1. Information We Collect</h2>
            <p>We collect information you provide directly to us, including:</p>
            <ul>
              <li><strong>Account Information:</strong> Name, email address, phone number, and password when you register.</li>
              <li><strong>Event & Ticket Data:</strong> Events you create, tickets you purchase, and attendance records.</li>
              <li><strong>Payment Information:</strong> Payment is processed securely through Paystack. We do not store your card details.</li>
              <li><strong>Usage Data:</strong> Pages visited, time spent on the platform, device type, browser, and IP address.</li>
            </ul>

            <h2>2. How We Use Your Information</h2>
            <p>We use the information we collect to:</p>
            <ul>
              <li>Create and manage your account</li>
              <li>Process ticket purchases and payments</li>
              <li>Send booking confirmations, event reminders, and support messages</li>
              <li>Improve our platform and user experience</li>
              <li>Detect fraud and ensure platform security</li>
              <li>Comply with legal obligations</li>
            </ul>

            <h2>3. Sharing of Information</h2>
            <p>
              We do not sell your personal information. We may share your information with:
            </p>
            <ul>
              <li><strong>Event Organizers:</strong> When you purchase a ticket, the organizer receives your name and contact details to manage attendance.</li>
              <li><strong>Payment Processors:</strong> Paystack processes transactions on our behalf under their own privacy policy.</li>
              <li><strong>Service Providers:</strong> Third-party vendors who help us operate the platform (e.g., hosting, analytics), bound by confidentiality agreements.</li>
              <li><strong>Legal Requirements:</strong> If required by law, court order, or government authority.</li>
            </ul>

            <h2>4. Data Retention</h2>
            <p>
              We retain your personal data for as long as your account is active or as needed to provide services.
              You may request deletion of your account and associated data at any time by contacting us.
            </p>

            <h2>5. Cookies</h2>
            <p>
              We use cookies and similar tracking technologies to improve your experience, remember your preferences,
              and analyze platform usage. You can disable cookies in your browser settings, though some features
              may not function properly.
            </p>

            <h2>6. Security</h2>
            <p>
              We implement industry-standard security measures including HTTPS encryption, secure authentication,
              and regular security audits. However, no method of transmission over the internet is 100% secure.
            </p>

            <h2>7. Children's Privacy</h2>
            <p>
              Our platform is not directed to children under 13. We do not knowingly collect personal information
              from children. If you believe a child has provided us with personal data, please contact us immediately.
            </p>

            <h2>8. Your Rights</h2>
            <p>You have the right to:</p>
            <ul>
              <li>Access and receive a copy of the personal data we hold about you</li>
              <li>Request correction of inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Withdraw consent at any time where we rely on consent to process data</li>
            </ul>
            <p>To exercise these rights, contact us at <strong>Ekotix234@gmail.com</strong>.</p>

            <h2>9. Changes to This Policy</h2>
            <p>
              We may update this Privacy Policy from time to time. We will notify you of significant changes
              via email or a prominent notice on our platform. Continued use of the Service after changes
              constitutes acceptance of the updated policy.
            </p>

            <h2>10. Contact Us</h2>
            <p>If you have questions about this Privacy Policy, please contact us:</p>
            <ul>
              <li>Email: <strong>Ekotix234@gmail.com</strong></li>
              <li>Phone: <strong>+234 903 509 2518</strong></li>
            </ul>
          </div>

          <div className="legal-footer-nav">
            <Link to="/">← Back to Home</Link>
            <Link to="/terms">Terms &amp; Conditions →</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default PrivacyPolicy;

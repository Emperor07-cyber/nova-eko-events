import React from "react";
import { Link } from "react-router-dom";
import Header from "../components/Layout/Header";
import Footer from "../components/Layout/Footer";

const Terms = () => {
  return (
    <>
      <Header />
      <div className="legal-page">
        <div className="legal-container">
          <div className="legal-header">
            <h1>Terms &amp; Conditions</h1>
            <p className="legal-date">Last updated: June 2025</p>
          </div>

          <div className="legal-content">
            <p>
              Please read these Terms &amp; Conditions ("Terms") carefully before using the Ekotix platform
              operated by <strong>Ekotix</strong> ("we", "us", or "our"). By accessing or using our Service,
              you agree to be bound by these Terms.
            </p>

            <h2>1. Acceptance of Terms</h2>
            <p>
              By creating an account, browsing events, or purchasing tickets on Ekotix, you confirm that you
              are at least 18 years old (or have parental consent), and that you agree to these Terms and our{" "}
              <Link to="/privacy">Privacy Policy</Link>.
            </p>

            <h2>2. The Platform</h2>
            <p>
              Ekotix is a ticketing and event discovery platform that connects event organizers with attendees.
              We facilitate ticket sales but are not the organizer of any event listed on the platform unless
              explicitly stated.
            </p>

            <h2>3. Accounts</h2>
            <ul>
              <li>You are responsible for maintaining the confidentiality of your account credentials.</li>
              <li>You must provide accurate and complete information when registering.</li>
              <li>You are responsible for all activities that occur under your account.</li>
              <li>You must notify us immediately of any unauthorized use of your account.</li>
            </ul>

            <h2>4. Event Organizers</h2>
            <p>If you create and host events on Ekotix, you agree that:</p>
            <ul>
              <li>All event information you provide is accurate and not misleading.</li>
              <li>You are solely responsible for organizing and delivering the event as advertised.</li>
              <li>You will handle attendee disputes and refunds in accordance with your stated policy.</li>
              <li>You will not list events that are illegal, fraudulent, or violate our community guidelines.</li>
              <li>
                <strong>Fees:</strong> Ekotix charges a platform fee of <strong>5% + ₦100</strong> per paid
                ticket sold. Free events are listed at no cost. Fees are deducted before payout.
              </li>
            </ul>

            <h2>5. Ticket Purchases</h2>
            <ul>
              <li>All ticket sales are final unless the event organizer has a stated refund policy.</li>
              <li>Tickets are non-transferable unless the organizer permits transfers.</li>
              <li>Ekotix is not responsible for event cancellations or changes made by organizers.</li>
              <li>Payments are processed securely via Paystack. Ekotix does not store payment card data.</li>
            </ul>

            <h2>6. Refunds &amp; Cancellations</h2>
            <p>
              Refund policies are set by individual event organizers. Ekotix platform fees are non-refundable.
              If an organizer cancels an event, they are responsible for issuing refunds to ticket holders.
              Ekotix may, at its discretion, assist in facilitating refunds in cases of verified fraud.
            </p>

            <h2>7. Prohibited Conduct</h2>
            <p>You agree not to:</p>
            <ul>
              <li>Use the platform for any illegal or unauthorized purpose</li>
              <li>List fraudulent, misleading, or fake events</li>
              <li>Resell tickets at inflated prices (scalping) without organizer approval</li>
              <li>Attempt to hack, scrape, or disrupt the platform</li>
              <li>Harass other users or Ekotix staff</li>
              <li>Impersonate another person or organization</li>
            </ul>

            <h2>8. Intellectual Property</h2>
            <p>
              All content on the Ekotix platform — including logos, design, software, and text — is owned by
              Ekotix or its licensors. You may not reproduce or use any content without prior written permission.
              Event organizers grant Ekotix a license to display their event content on the platform.
            </p>

            <h2>9. Limitation of Liability</h2>
            <p>
              Ekotix is a facilitating platform and is not liable for the actions, content, or conduct of
              event organizers or attendees. We are not responsible for any direct, indirect, or consequential
              loss arising from your use of the platform, including event cancellations, no-shows, or disputes
              between parties.
            </p>

            <h2>10. Disclaimer of Warranties</h2>
            <p>
              The Service is provided "as is" and "as available" without warranties of any kind. We do not
              guarantee that the platform will be uninterrupted, error-free, or secure at all times.
            </p>

            <h2>11. Governing Law</h2>
            <p>
              These Terms are governed by the laws of the <strong>Federal Republic of Nigeria</strong>.
              Any disputes shall be resolved in the appropriate courts of Nigeria.
            </p>

            <h2>12. Changes to Terms</h2>
            <p>
              We reserve the right to update these Terms at any time. We will notify users of material changes
              via email or a platform notice. Continued use of the Service after changes constitutes acceptance.
            </p>

            <h2>13. Contact Us</h2>
            <p>For questions about these Terms, reach us at:</p>
            <ul>
              <li>Email: <strong>Ekotix234@gmail.com</strong></li>
              <li>Phone: <strong>+234 903 509 2518</strong></li>
            </ul>
          </div>

          <div className="legal-footer-nav">
            <Link to="/">← Back to Home</Link>
            <Link to="/privacy">Privacy Policy →</Link>
          </div>
        </div>
      </div>
      <Footer />
    </>
  );
};

export default Terms;

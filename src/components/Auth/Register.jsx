import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useNavigate, Link } from "react-router-dom";
import { auth, database } from "../../firebase/firebaseConfig";

function Register() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("user");
  const [emailInUse, setEmailInUse] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const navigate = useNavigate();

  const showFeedback = (type, message) => {
    setFeedback({ type, message });
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setEmailInUse(false);
    setFeedback({ type: "", message: "" });

    if (role === "host") {
      navigate("/host-setup", {
        state: { email, password, name, role },
      });
      return;
    }

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      await set(ref(database, "users/" + user.uid), {
        uid: user.uid,
        name,
        email,
        role,
      });

      showFeedback("success", "Registration successful. Redirecting...");
      navigate("/");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setEmailInUse(true);
        showFeedback("warning", "This email is already registered.");
      } else {
        showFeedback("error", "Registration failed. Please try again.");
      }
    }
  };

  return (
    <div className="auth-grid">
      <div className="auth-brand">
        <img src="/images/Logo4.jpg" alt="Ekotix logo" className="auth-logo" />
        <div className="auth-brand-copy">
          <strong className="auth-brand-name">Ekotix</strong>
          
        </div>
      </div>

      <div className="auth-hero">
        <p className="kicker">Join Ekotix</p>
        <h1 className="auth-title">Create your account</h1>
        <p className="auth-note">Buy tickets, host events, and keep everything in one place.</p>
        <div className="auth-badges">
          <span className="auth-badge"><span className="auth-badge-icon">🛒</span>Buy tickets</span>
          <span className="auth-badge"><span className="auth-badge-icon">🏠</span>Host events</span>
          <span className="auth-badge"><span className="auth-badge-icon">⚡</span>Fast checkout</span>
        </div>
      </div>

      <form onSubmit={handleRegister} className="auth-grid auth-form">
        {feedback.message ? (
          <div className={`auth-feedback auth-feedback-${feedback.type}`} role="status" aria-live="polite">
            {feedback.message}
          </div>
        ) : null}
        <input
          className="input"
          type="text"
          placeholder="Full Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
        <input
          className="input"
          type="email"
          placeholder="Email Address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password (min. 6 characters)"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          minLength={6}
          required
        />
        <select className="select" value={role} onChange={(e) => setRole(e.target.value)} required>
          <option value="user">User (Buy Tickets)</option>
          <option value="host">Host (Create Events)</option>
        </select>

        {role === "host" ? (
          <p className="event-meta">
            You&apos;ll add and verify payout details in the next step.
          </p>
        ) : null}

        <button className="btn btn-primary" type="submit">
          {role === "host" ? "Continue to Bank Setup" : "Register"}
        </button>
      </form>

      {emailInUse ? (
        <div className="card card-body stack">
          <p style={{ color: "var(--danger)" }}>This email is already registered.</p>
          <Link to="/login" className="btn btn-outline auth-switch-button">Sign in instead</Link>
        </div>
      ) : null}

      <div className="auth-footer">
        <span className="event-meta">Already have an account?</span>
        <Link to="/login" className="btn btn-primary auth-switch-button">Sign in</Link>
      </div>
    </div>
  );
}

export default Register;

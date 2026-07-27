import React, { useState } from "react";
import { signInWithEmailAndPassword, sendPasswordResetEmail } from "firebase/auth";
import { Link, useNavigate } from "react-router-dom";
import { auth } from "../../firebase/firebaseConfig";
import "./auth.css";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate("/");
    } catch (err) {
      if (err.code === "auth/invalid-credential" || err.code === "auth/wrong-password") {
        setError("Incorrect email or password. Please try again.");
      } else if (err.code === "auth/user-not-found") {
        setError("No account found with this email.");
      } else if (err.code === "auth/network-request-failed") {
        setError("Network error. Please check your connection.");
      } else {
        setError("Login failed. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) { setError("Please enter your email address first."); return; }
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError("");
    } catch {
      setError("Could not send reset email. Check the address and try again.");
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-bg">
          <img src="/images/nova1.jpg" alt="" className="auth-left-bg-img" />
          <div className="auth-left-overlay" />
        </div>
        <div className="auth-left-inner">
          <Link to="/" className="auth-logo">
            <img src="/images/Logo4.jpg" alt="Ekotix" className="auth-logo-img" />
          </Link>
          <div className="auth-left-content">
            <h2 className="auth-left-title">
              Your events.<br />
              Your way.<br />
              <span className="auth-left-accent">One platform.</span>
            </h2>
            <p className="auth-left-sub">
              Discover and buy tickets to the best events around you.
            </p>
            <div className="auth-left-badges">
              <div className="auth-left-badge">
                <span className="auth-badge-icon">⚡</span>
                <div>
                  <strong>Instant QR Tickets</strong>
                  <span>Get your tickets instantly and securely.</span>
                </div>
              </div>
              <div className="auth-left-badge">
                <span className="auth-badge-icon">🔒</span>
                <div>
                  <strong>Secure Payments</strong>
                  <span>Your payments are protected with bank-level security.</span>
                </div>
              </div>
              <div className="auth-left-badge">
                <span className="auth-badge-icon">✅</span>
                <div>
                  <strong>Easy Check-in</strong>
                  <span>Smooth check-in experience for every event.</span>
                </div>
              </div>
            </div>
          </div>
          <p className="auth-left-footer">© 2025 EKOTIXX. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Welcome Back</h1>
            <p className="auth-form-sub">
              Login to your <span className="auth-brand-name">EKOTIXX</span> account
            </p>
          </div>

          <form onSubmit={handleLogin} className="auth-form">
            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  className="auth-input"
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setError(""); }}
                  required
                />
              </div>
            </div>

            <div className="auth-field">
              <div className="auth-label-row">
                <label className="auth-label">Password</label>
                <button type="button" className="auth-forgot" onClick={handleForgotPassword}>
                  Forgot password?
                </button>
              </div>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  className={`auth-input${error ? " auth-input--error" : ""}`}
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => { setPassword(e.target.value); setError(""); }}
                  required
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
                </button>
              </div>
              {error && <p className="auth-error">{error}</p>}
              {resetSent && <p className="auth-success">Password reset email sent! Check your inbox.</p>}
            </div>

            <button className="auth-submit-btn" type="submit" disabled={loading}>
              {loading ? "Logging in..." : "Log In"}
            </button>
          </form>

          <div className="auth-divider"><span>OR</span></div>

          <div className="auth-social">
            <button className="auth-social-btn" type="button">
              <img src="/images/google.png" alt="" className="auth-social-img" />
              Continue with Google
            </button>
            <button className="auth-social-btn" type="button">
              <svg className="auth-social-svg" viewBox="0 0 24 24" fill="currentColor"><path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.8-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.73-.83 1.94-1.46 2.94-1.5.13 1.17-.34 2.35-1.04 3.19-.69.85-1.83 1.51-2.95 1.42-.15-1.15.41-2.35 1.05-3.11z"/></svg>
              Continue with Apple
            </button>
            <button className="auth-social-btn" type="button">
              <svg className="auth-social-svg" viewBox="0 0 24 24" fill="none"><path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07A19.5 19.5 0 0 1 4.69 12a19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 3.6 1.18h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L7.91 8.71a16 16 0 0 0 6.29 6.29l.91-.91a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/></svg>
              Continue with Phone
            </button>
          </div>

          <p className="auth-register-cta">
            Don't have an account?{" "}
            <Link to="/register" className="auth-link auth-link--bold">Sign up</Link>
          </p>

          <p className="auth-terms">
            By logging in, you agree to our{" "}
            <Link to="/terms" className="auth-link">Terms of Use</Link>{" "}
            and <Link to="/privacy" className="auth-link">Privacy Policy</Link>.
          </p>
        </div>
      </div>
    </div>
  );
}

export default Login;

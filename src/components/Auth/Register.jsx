import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useNavigate, Link } from "react-router-dom";
import { auth, database } from "../../firebase/firebaseConfig";
import "./auth.css";

function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [role] = useState("user");
  const [emailInUse, setEmailInUse] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const checks = {
    length: password.length >= 8,
    upper: /[A-Z]/.test(password),
    number: /[0-9]/.test(password),
  };

  const handleRegister = async (e) => {
    e.preventDefault();
    setEmailInUse(false);
    setPasswordError("");

    if (password !== confirmPassword) {
      setPasswordError("Passwords do not match.");
      return;
    }
    if (!agreed) {
      setPasswordError("Please agree to the Terms of Use and Privacy Policy.");
      return;
    }

    setLoading(true);
    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;
      await set(ref(database, "users/" + user.uid), {
        uid: user.uid, name, email, phone, role,
      });
      navigate("/");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setEmailInUse(true);
      } else {
        alert("Error registering: " + error.message);
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      {/* Left panel */}
      <div className="auth-left">
        <div className="auth-left-bg">
          <img src="/images/nova3.jpg" alt="" className="auth-left-bg-img" />
          <div className="auth-left-overlay" />
        </div>
        <div className="auth-left-inner">
          <Link to="/" className="auth-logo">
            <img src="/images/Logo4.jpg" alt="Ekotix" className="auth-logo-img" />
          </Link>
          <div className="auth-left-content">
            <h2 className="auth-left-title">
              Create your account<br />
              and join the<br />
              <span className="auth-left-accent">experience.</span>
            </h2>
            <p className="auth-left-sub">
              Join thousands of event lovers and never miss out.
            </p>
            <div className="auth-trust-row">
              <div className="auth-trust-avatars">
                <img src="/images/nova5.jpg" alt="" className="auth-trust-avatar" />
                <img src="/images/nova2.jpg" alt="" className="auth-trust-avatar" />
                <img src="/images/nov3.jpg" alt="" className="auth-trust-avatar" />
                <span className="auth-trust-count">10K+</span>
              </div>
              <p className="auth-trust-label">Trusted by 10,000+ event lovers</p>
            </div>
          </div>
          <p className="auth-left-footer">© 2025 EKOTIXX. All rights reserved.</p>
        </div>
      </div>

      {/* Right panel */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <div className="auth-form-header">
            <h1 className="auth-form-title">Create Account</h1>
            <p className="auth-form-sub">
              Get started with your <span className="auth-brand-name">EKOTIXX</span> account
            </p>
          </div>

          <form onSubmit={handleRegister} className="auth-form">
            {/* Full Name */}
            <div className="auth-field">
              <label className="auth-label">Full Name</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                  <circle cx="12" cy="7" r="4" stroke="currentColor" strokeWidth="1.5"/>
                </svg>
                <input
                  className="auth-input"
                  type="text"
                  placeholder="Enter your full name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                />
              </div>
            </div>

            {/* Email */}
            <div className="auth-field">
              <label className="auth-label">Email Address</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="2" y="4" width="20" height="16" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M2 8l10 6 10-6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  className={`auth-input${emailInUse ? " auth-input--error" : ""}`}
                  type="email"
                  placeholder="Enter your email address"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailInUse(false); }}
                  required
                />
              </div>
              {emailInUse && (
                <p className="auth-error">
                  Email already registered.{" "}
                  <Link to="/login" className="auth-link">Log in instead</Link>
                </p>
              )}
            </div>

            {/* Phone */}
            <div className="auth-field">
              <label className="auth-label">Phone Number <span className="auth-optional">(Optional)</span></label>
              <div className="auth-input-wrap auth-phone-wrap">
                <span className="auth-phone-prefix">
                  🇳🇬 +234
                </span>
                <div className="auth-phone-divider" />
                <input
                  className="auth-input auth-phone-input"
                  type="tel"
                  placeholder="Enter your phone number"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                />
              </div>
            </div>

            {/* Password */}
            <div className="auth-field">
              <label className="auth-label">Password</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  className="auth-input"
                  type={showPassword ? "text" : "password"}
                  placeholder="Create a password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowPassword((v) => !v)} aria-label="Toggle password">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
                </button>
              </div>
              {password.length > 0 && (
                <div className="auth-pw-checks">
                  <span className={checks.length ? "auth-pw-check--ok" : "auth-pw-check"}>
                    {checks.length ? "✅" : "○"} At least 8 characters
                  </span>
                  <span className={checks.upper ? "auth-pw-check--ok" : "auth-pw-check"}>
                    {checks.upper ? "✅" : "○"} One uppercase letter
                  </span>
                  <span className={checks.number ? "auth-pw-check--ok" : "auth-pw-check"}>
                    {checks.number ? "✅" : "○"} One number
                  </span>
                </div>
              )}
            </div>

            {/* Confirm Password */}
            <div className="auth-field">
              <label className="auth-label">Confirm Password</label>
              <div className="auth-input-wrap">
                <svg className="auth-input-icon" viewBox="0 0 24 24" fill="none">
                  <rect x="5" y="11" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.5"/>
                  <path d="M8 11V7a4 4 0 0 1 8 0v4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"/>
                </svg>
                <input
                  className={`auth-input${passwordError && confirmPassword ? " auth-input--error" : ""}`}
                  type={showConfirm ? "text" : "password"}
                  placeholder="Confirm your password"
                  value={confirmPassword}
                  onChange={(e) => { setConfirmPassword(e.target.value); setPasswordError(""); }}
                  required
                />
                <button type="button" className="auth-eye-btn" onClick={() => setShowConfirm((v) => !v)} aria-label="Toggle confirm password">
                  <svg viewBox="0 0 24 24" fill="none"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" stroke="currentColor" strokeWidth="1.5"/><circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5"/></svg>
                </button>
              </div>
              {passwordError && <p className="auth-error">{passwordError}</p>}
            </div>

            {/* Terms checkbox */}
            <label className="auth-agree-row">
              <input
                type="checkbox"
                className="auth-checkbox"
                checked={agreed}
                onChange={(e) => setAgreed(e.target.checked)}
              />
              <span className="auth-agree-text">
                I agree to the{" "}
                <Link to="/terms" className="auth-link">Terms of Use</Link>{" "}
                and <Link to="/privacy" className="auth-link">Privacy Policy</Link>
              </span>
            </label>

            <button className="auth-submit-btn" type="submit" disabled={loading}>
              {loading ? "Creating account..." : "Create Account"}
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
            Already have an account?{" "}
            <Link to="/login" className="auth-link auth-link--bold">Log in</Link>
          </p>
        </div>
      </div>
    </div>
  );
}

export default Register;

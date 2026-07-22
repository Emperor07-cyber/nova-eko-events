import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup,
  setPersistence,
  browserSessionPersistence,
} from "firebase/auth";
import { auth, database } from "../../firebase/firebaseConfig";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { ref, set, get } from "firebase/database";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const routeAfterLogin = (userData) => {
    const from = location.state?.from?.pathname;

    if (from === "/event/new") {
      navigate("/event/new");
    } else if (userData.role === "admin") {
      navigate("/admin/dashboard");
    } else if (userData.role === "host") {
      navigate("/host/dashboard");
    } else {
      navigate("/my-tickets");
    }
  };

  const getOrCreateUser = async (user) => {
    const userRef = ref(database, "users/" + user.uid);
    const snapshot = await get(userRef);
    let userData = snapshot.val();

    if (!userData) {
      userData = {
        uid: user.uid,
        email: user.email,
        name: user.displayName || "",
        role: "user",
      };
      await set(userRef, userData);
    }

    return userData;
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await setPersistence(auth, browserSessionPersistence);
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const userData = await getOrCreateUser(userCredential.user);
      alert("Login successful!");
      routeAfterLogin(userData);
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) {
      alert("Please enter your email to reset password.");
      return;
    }

    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent!");
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleGoogleSignIn = async () => {
    const provider = new GoogleAuthProvider();
    try {
      await setPersistence(auth, browserSessionPersistence);
      const result = await signInWithPopup(auth, provider);
      const userData = await getOrCreateUser(result.user);
      alert("Google sign-in successful!");
      routeAfterLogin(userData);
    } catch (error) {
      alert("Google sign-in failed: " + error.message);
    }
  };

  return (
    <div className="auth-grid">
      <div className="auth-hero">
        <p className="kicker">Welcome back</p>
        <h2 className="section-title">Login</h2>
        <p className="auth-note">Access tickets, hosting tools, and your Ekotix dashboard.</p>
        <div className="auth-badges">
          <span className="auth-badge">Secure session</span>
          <span className="auth-badge">Fast checkout</span>
          <span className="auth-badge">Host access</span>
        </div>
      </div>

      <form onSubmit={handleLogin} className="auth-grid">
        <input
          className="input"
          type="email"
          placeholder="Email address"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          className="input"
          type="password"
          placeholder="Password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="btn btn-primary" type="submit">Login</button>
      </form>

      <button className="btn btn-ghost" type="button" onClick={handleForgotPassword}>
        Forgot Password?
      </button>

      <hr className="auth-divider" />

      <button className="btn btn-ghost btn-google" type="button" onClick={handleGoogleSignIn}>
        <svg className="google-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
          <path fill="#EA4335" d="M12 10.2v3.9h5.5c-.23 1.26-.95 2.33-2.03 3.04l3.28 2.54c1.91-1.76 3.01-4.36 3.01-7.45 0-.71-.06-1.39-.18-2.05H12z" />
          <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.44l-3.28-2.54c-.91.61-2.07.98-3.34.98-2.57 0-4.76-1.73-5.54-4.06l-3.39 2.62C4.72 19.85 8.07 22 12 22z" />
          <path fill="#4A90E2" d="M6.46 13.94A5.95 5.95 0 0 1 6.15 12c0-.68.11-1.35.31-1.94l-3.39-2.62A9.98 9.98 0 0 0 2 12c0 1.61.39 3.13 1.07 4.56l3.39-2.62z" />
          <path fill="#FBBC05" d="M12 5.96c1.47 0 2.79.5 3.83 1.48l2.87-2.87C16.95 2.94 14.7 2 12 2 8.07 2 4.72 4.15 3.07 7.44l3.39 2.62C7.24 7.69 9.43 5.96 12 5.96z" />
        </svg>
        <span>Sign in with Google</span>
      </button>

      <p className="event-meta">
        Don&apos;t have an account? <Link to="/register">Sign Up</Link>
      </p>
    </div>
  );
}

export default Login;

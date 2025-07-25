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
import { useNavigate, useLocation } from "react-router-dom";
import { ref, set, get } from "firebase/database";
import { FaGoogle } from "react-icons/fa";
import Header1 from "../Layout/Header1";
import Footer from "../Layout/Footer";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      await setPersistence(auth, browserSessionPersistence);

      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

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

      alert("Login successful!");

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
    } catch (error) {
      alert("Error: " + error.message);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return alert("Please enter your email to reset password.");
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
      const user = result.user;

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

      alert("Google sign-in successful!");

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
    } catch (error) {
      alert("Google sign-in failed: " + error.message);
    }
  };

  return (
    <>
      <Header1 />
      <div className="register-wrapper">
        <div className="register-image">
          <img src="/images/loginpic.png" alt="Login" />
        </div>
        <div className="register-form">
          <div className="login-logo">
            <img src="/images/Logo4.jpg" alt="Logo" />
          </div>

          <h2 className="register-title">Login</h2>
          <form onSubmit={handleLogin} className="auth-form">
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
            <button type="submit">Login</button>
          </form>

          <button onClick={handleForgotPassword} className="forgot-btn">
            Forgot Password?
          </button>

          <p className="register-link">
            Don't have an account? <a href="/register">Sign Up</a>
          </p>

          <hr style={{ margin: "1.5rem 0" }} />

          <button onClick={handleGoogleSignIn} className="google-btn">
            <FaGoogle style={{ marginRight: "8px" }} />
            Sign in with Google
          </button>
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Login;

import React, { useState } from "react";
import {
  signInWithEmailAndPassword,
  sendPasswordResetEmail,
  GoogleAuthProvider,
  signInWithPopup
} from "firebase/auth";
import { auth, database } from "../../firebase/firebaseConfig";
import { useNavigate, useLocation } from "react-router-dom";
import { ref, set, get } from "firebase/database"; // ✅ FIXED HERE
import { FaGoogle } from "react-icons/fa";
import Header1 from "../Layout/Header1";
import Footer from "../Layout/Footer";


function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const navigate = useNavigate();
  const location = useLocation(); // Add this at the top with your hooks

const handleLogin = async (e) => {
  e.preventDefault();
  try {
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
} else {
  // Refresh userData from Firebase after initial check
  const refreshedSnapshot = await get(userRef);
  userData = refreshedSnapshot.val();
}
    alert("Login successful!");

    if (userData.role === "admin") {
  navigate("/admin/dashboard");
} else if (userData.role === "host") {
  navigate("/host/dashboard");
} else {
  const from = location.state?.from?.pathname || "/my-tickets";
  navigate(from);
}


  } catch (error) {
    alert("Error: " + error.message);
  }
};


  const handleForgotPassword = async ()  => {
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
      const result = await signInWithPopup(auth, provider);
      const user = result.user;

      // Save user to Realtime Database if new
      await set(ref(database, "users/" + user.uid), {
        uid: user.uid,
        name: user.displayName,
        email: user.email,
        role: "user",
      });

      alert("Google sign-in successful!");
      navigate("/");
    } catch (error) {
      alert("Google sign-in failed: " + error.message);
    }
  };

  return (
    <>
    <Header1 />
    <div className="register-wrapper">
      <div className="register-image">
        <img src="/images/loginpic.png"  />
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

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
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setEmailInUse(false);

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

      alert("Registration successful!");
      navigate("/");
    } catch (error) {
      if (error.code === "auth/email-already-in-use") {
        setEmailInUse(true);
      } else {
        alert("Error registering: " + error.message);
      }
    }
  };

  return (
    <div className="auth-grid">
      <div className="auth-hero">
        <p className="kicker">Join Ekotix</p>
        <h2 className="section-title">Create account</h2>
        <p className="auth-note">Buy tickets, host events, and manage everything in one place.</p>
        <div className="auth-badges">
          <span className="auth-badge">Buyer account</span>
          <span className="auth-badge">Host tools</span>
          <span className="auth-badge">Premium checkout</span>
        </div>
      </div>

      <form onSubmit={handleRegister} className="auth-grid">
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
            You&apos;ll add and verify your payout bank details in the next step.
          </p>
        ) : null}

        <button className="btn btn-primary" type="submit">
          {role === "host" ? "Continue to Bank Setup" : "Register"}
        </button>
      </form>

      {emailInUse ? (
        <div className="card card-body stack">
          <p style={{ color: "var(--danger)" }}>This email is already registered.</p>
          <Link to="/login" className="btn btn-ghost">Login instead</Link>
        </div>
      ) : null}

      <p className="event-meta">
        Already have an account? <Link to="/login">Login</Link>
      </p>
    </div>
  );
}

export default Register;

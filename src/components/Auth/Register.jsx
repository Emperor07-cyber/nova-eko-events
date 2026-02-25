import React, { useState } from "react";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { ref, set } from "firebase/database";
import { useNavigate } from "react-router-dom";
import { auth, database } from "../../firebase/firebaseConfig";
import Header1 from "../Layout/Header1";
import Footer from "../Layout/Footer";

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

    // If host, go to setup page FIRST — pass form data via state
    // Account will only be created AFTER bank details are verified
    if (role === "host") {
      navigate("/host-setup", {
        state: { email, password, name, role },
      });
      return;
    }

    // For regular users, create account immediately as before
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
    <>
      <Header1 />
      <div className="register-wrapper">
        <div className="register-image">
          <img src="/images/regispic.png" alt="Register" />
        </div>
        <div className="register-form">
          <div className="login-logo">
            <img src="/images/Logo4.jpg" alt="Logo" />
          </div>
          <h2 className="register-title">Register</h2>
          <p className="register-description">Join us to book tickets or create events!</p>
          <form onSubmit={handleRegister} className="auth-form">
            <input
              type="text"
              placeholder="Full Name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
            />
            <input
              type="email"
              placeholder="Email Address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <input
              type="password"
              placeholder="Password (min. 6 characters)"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength={6}
              required
            />
            <select value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="user">User (Buy Tickets)</option>
              <option value="host">Host (Create Events)</option>
            </select>

            {role === "host" && (
              <p className="host-info-note">
                ℹ️ As a host, you'll be asked to add your bank details on the next step before your account is created.
              </p>
            )}

            <button type="submit">
              {role === "host" ? "Continue to Bank Setup →" : "Register"}
            </button>
          </form>

          {emailInUse && (
            <div className="email-error">
              <p style={{ color: "red" }}>This email is already registered.</p>
              <button onClick={() => navigate("/login")}>Login Instead</button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
}

export default Register;

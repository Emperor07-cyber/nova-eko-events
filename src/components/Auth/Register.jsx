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
  const [role, setRole] = useState("user"); // Default role
  const [emailInUse, setEmailInUse] = useState(false);
  const navigate = useNavigate();

  const handleRegister = async (e) => {
    e.preventDefault();
    setEmailInUse(false);

    try {
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Save basic details first
      await set(ref(database, "users/" + user.uid), {
        uid: user.uid,
        name,
        email,
        role,
      });

      if (role === "host") {
        // Redirect host to account setup page
        navigate("/host-setup", { state: { uid: user.uid } });
      } else {
        alert("Registration successful!");
        navigate("/");
      }
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
              placeholder="Password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />

            <select value={role} onChange={(e) => setRole(e.target.value)} required>
              <option value="user">User (Buy Tickets)</option>
              <option value="host">Host (Create Events)</option>
            </select>

            <button type="submit">Register</button>
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

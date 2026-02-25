import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, set } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { database, auth } from "../../firebase/firebaseConfig";
import Header1 from "../Layout/Header1";
import Footer from "../Layout/Footer";

function HostSetup() {
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  const navigate = useNavigate();
  const location = useLocation();

  // Registration data passed from Register.jsx — no account exists yet
  const { email, password, name, role } = location.state || {};
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Redirect back if someone navigates here directly without coming from Register
  useEffect(() => {
    if (!email || !password || !name) {
      alert("Please complete the registration form first.");
      navigate("/register");
    }
  }, [email, password, name, navigate]);

  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch(`${API_URL}/get-banks`);
        const data = await res.json();
        setBanks(data.data);
      } catch (err) {
        console.error("Error fetching banks:", err);
        setError("Could not load bank list. Please refresh.");
      }
    };
    fetchBanks();
  }, [API_URL]);

  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!bankCode || !accountNumber) {
      setError("Please select a bank and enter your account number.");
      return;
    }

    setLoading(true);

    try {
      // Step 1: Verify bank account with Paystack
      const res = await fetch(
        `${API_URL}/verifyAccount?accountNumber=${accountNumber}&bankCode=${bankCode}`,
        { method: "GET", cache: "no-store" }
      );
      const data = await res.json();

      if (!data.status) {
        setError("❌ Invalid account details. Please check and try again.");
        setLoading(false);
        return;
      }

      const verifiedName = data.data.account_name;
      setAccountName(verifiedName);
      setVerified(true);

      // Step 2: Bank verified — NOW create the Firebase Auth account
      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      // Step 3: Save ALL user + bank details together in one write
      const selectedBank = banks.find((b) => b.code === bankCode);
      await set(ref(database, "users/" + user.uid), {
        uid: user.uid,
        name,
        email,
        role: "host",
        accountName: verifiedName,
        accountNumber,
        bank: selectedBank ? selectedBank.name : bankCode,
        bankCode,
        hostVerified: true,
        createdAt: new Date().toISOString(),
      });

      alert(`✅ Account created! Welcome, ${name}.`);
      navigate("/host/dashboard");

    } catch (err) {
      console.error(err);

      // Handle the case where email is already registered
      if (err.code === "auth/email-already-in-use") {
        setError("❌ This email is already registered. Please log in instead.");
      } else if (err.code === "auth/weak-password") {
        setError("❌ Password is too weak. Please go back and use at least 6 characters.");
      } else {
        setError("Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Header1 />
      <div className="host-setup">
        <div className="host-setup-header">
          <h2>Host Account Setup</h2>
          <p>Enter your payout bank details. Your account will be created once verified.</p>
        </div>

        {/* Progress indicator */}
        <div className="setup-steps">
          <span className="step step--done">① Basic Info ✓</span>
          <span className="step-divider">──</span>
          <span className="step step--active">② Bank Details</span>
        </div>

        <form onSubmit={handleVerifyAndSave} className="host-setup-form">
          <label htmlFor="accountNumber">
            <h4>Account Number</h4>
            <input
              id="accountNumber"
              type="text"
              placeholder="e.g. 0123456789"
              value={accountNumber}
              onChange={(e) => {
                setAccountNumber(e.target.value);
                setVerified(false);
                setAccountName("");
              }}
              maxLength={10}
              required
            />
          </label>

          <div style={{ marginTop: "1rem" }}>
            <h4>Bank</h4>
            <select
              value={bankCode}
              onChange={(e) => {
                setBankCode(e.target.value);
                setVerified(false);
                setAccountName("");
              }}
              required
            >
              <option value="">Select Bank</option>
              {banks.map((bank) => (
                <option key={bank.code} value={bank.code}>
                  {bank.name}
                </option>
              ))}
            </select>
          </div>

          {/* Error message */}
          {error && (
            <p className="setup-error">{error}</p>
          )}

          {/* Verified account name preview */}
          {verified && accountName && (
            <p className="setup-success">✅ Account Name: <strong>{accountName}</strong></p>
          )}

          <button type="submit" disabled={loading} className="btn purple">
            {loading ? "Verifying & Creating Account..." : "Verify & Create Account"}
          </button>

          <button
            type="button"
            className="btn outline"
            style={{ marginTop: "0.5rem" }}
            onClick={() => navigate("/register")}
          >
            ← Back to Registration
          </button>
        </form>
      </div>
      <Footer />
    </>
  );
}

export default HostSetup;

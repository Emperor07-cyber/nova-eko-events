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
  const [banksLoading, setBanksLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");
  const [bankError, setBankError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const { email, password, name, role } = location.state || {};
  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  useEffect(() => {
    if (!email || !password || !name) {
      alert("Please complete the registration form first.");
      navigate("/register");
    }
  }, [email, password, name, navigate]);

  useEffect(() => {
    const fetchBanks = async (retriesLeft = 3) => {
      setBanksLoading(true);
      setBankError("");
      try {
        const res = await fetch(`${API_URL}/get-banks`);
        if (!res.ok) throw new Error("Server error");
        const data = await res.json();
        if (!data.data || data.data.length === 0) throw new Error("Empty bank list");
        setBanks(data.data);
        setBanksLoading(false);
      } catch (err) {
        console.error("Error fetching banks:", err);
        if (retriesLeft > 0) {
          setBankError(`Server is waking up... retrying in 5 seconds (${retriesLeft} attempt${retriesLeft > 1 ? "s" : ""} left)`);
          setTimeout(() => fetchBanks(retriesLeft - 1), 5000);
        } else {
          setBanksLoading(false);
          setBankError("Could not load bank list. Please click Retry.");
        }
      }
    };
    fetchBanks();
  }, [API_URL, retryCount]);

  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!bankCode || !accountNumber) {
      setError("Please select a bank and enter your account number.");
      return;
    }

    setLoading(true);

    try {
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

      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

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
            {banksLoading ? (
              <div style={{ padding: "0.75rem", background: "#f8fafc", borderRadius: "8px", color: "#555", fontSize: "0.9rem" }}>
                ⏳ {bankError || "Loading banks..."}
              </div>
            ) : bankError ? (
              <div>
                <p style={{ color: "#ef4444", fontSize: "0.9rem" }}>{bankError}</p>
                <button
                  type="button"
                  onClick={() => setRetryCount(c => c + 1)}
                  style={{ marginTop: "0.5rem", padding: "6px 16px", background: "#14c02b", color: "#fff", border: "none", borderRadius: "6px", cursor: "pointer" }}
                >
                  🔄 Retry
                </button>
              </div>
            ) : (
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
            )}
          </div>

          {error && <p className="setup-error">{error}</p>}

          {verified && accountName && (
            <p className="setup-success">✅ Account Name: <strong>{accountName}</strong></p>
          )}

          <button
            type="submit"
            disabled={loading || banksLoading || !!bankError}
            className="btn purple"
          >
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
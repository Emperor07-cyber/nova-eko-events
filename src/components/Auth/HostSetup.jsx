import React, { useState, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { ref, set } from "firebase/database";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { database, auth } from "../../firebase/firebaseConfig";

function HostSetup() {
  const [accountName, setAccountName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [bankCode, setBankCode] = useState("");
  const [banks, setBanks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [banksLoading, setBanksLoading] = useState(true);
  const [verified, setVerified] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [error, setError] = useState("");
  const [bankError, setBankError] = useState("");
  const [retryCount, setRetryCount] = useState(0);

  const navigate = useNavigate();
  const location = useLocation();

  const { email, password, name } = location.state || {};
  const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.DEV ? "/api" : "https://nova-eko-events.onrender.com");

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

        const uniqueBanks = Array.from(
          new Map((data.data || []).map((bank) => [bank.code, bank])).values()
        );
        setBanks(uniqueBanks);
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

  useEffect(() => {
    if (!bankCode || accountNumber.length !== 10) {
      setAccountName("");
      setVerified(false);
      setError("");
      setVerifying(false);
      return;
    }

    let active = true;
    const controller = new AbortController();
    const timer = setTimeout(async () => {
      setVerifying(true);
      setError("");

      try {
        const res = await fetch(
          `${API_URL}/verifyAccount?accountNumber=${accountNumber}&bankCode=${bankCode}`,
          { method: "GET", cache: "no-store", signal: controller.signal }
        );

        if (!res.ok) {
          throw new Error("Verification request failed");
        }

        const data = await res.json();
        if (!data.status || !data.data?.account_name) {
          throw new Error("Invalid account details");
        }

        if (active) {
          setAccountName(data.data.account_name);
          setVerified(true);
          setError("");
        }
      } catch (err) {
        if (err.name === "AbortError") return;
        if (active) {
          setAccountName("");
          setVerified(false);
          setError("Account name could not be verified. Check the details and try again.");
        }
      } finally {
        if (active) setVerifying(false);
      }
    }, 700);

    return () => {
      active = false;
      controller.abort();
      clearTimeout(timer);
    };
  }, [API_URL, bankCode, accountNumber]);

  const handleVerifyAndSave = async (e) => {
    e.preventDefault();
    setError("");

    if (!bankCode || !accountNumber) {
      setError("Please select a bank and enter your account number.");
      return;
    }

    setLoading(true);

    try {
      let verifiedName = accountName;

      if (!verified || !verifiedName) {
        const res = await fetch(
          `${API_URL}/verifyAccount?accountNumber=${accountNumber}&bankCode=${bankCode}`,
          { method: "GET", cache: "no-store" }
        );
        if (!res.ok) {
          throw new Error("Verification request failed");
        }

        const data = await res.json();
        if (!data.status || !data.data?.account_name) {
          throw new Error("Invalid account details");
        }

        verifiedName = data.data.account_name;
        setAccountName(verifiedName);
        setVerified(true);
      }

      const result = await createUserWithEmailAndPassword(auth, email, password);
      const user = result.user;

      const selectedBank = banks.find((bank) => bank.code === bankCode);
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

      alert(`Account created. Welcome, ${name}.`);
      navigate("/host/dashboard");
    } catch (err) {
      console.error(err);
      if (err.code === "auth/email-already-in-use") {
        setError("This email is already registered. Please log in instead.");
      } else if (err.code === "auth/weak-password") {
        setError("Password is too weak. Use at least 6 characters.");
      } else {
        setError(err.message === "Invalid account details" ? "Invalid account details. Please check and try again." : "Something went wrong. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-grid">
      <div className="auth-hero">
        <p className="kicker">Host onboarding</p>
        <h2 className="section-title">Host Account Setup</h2>
        <p className="auth-note">Enter your payout bank details. Your account is created after verification.</p>
        <div className="auth-badges">
          <span className="auth-badge">Step 1: register</span>
          <span className="auth-badge">Step 2: verify bank</span>
          <span className="auth-badge">Step 3: go live</span>
        </div>
      </div>

      <div className="card card-body stack">
        <div className="event-meta">Step 1: Basic Info ✓</div>
        <div className="event-meta">Step 2: Bank Details (Current)</div>
      </div>

      <form onSubmit={handleVerifyAndSave} className="auth-grid">
        <input
          className="input"
          type="text"
          placeholder="Account number (10 digits)"
          value={accountNumber}
          onChange={(e) => {
            setAccountNumber(e.target.value);
            setVerified(false);
            setAccountName("");
          }}
          maxLength={10}
          required
        />

        {verifying ? (
          <div className="verification-card verification-card-loading">
            <div className="verification-icon">
              <div className="verify-spinner" />
            </div>
            <div>
              <span className="verification-pill">Verifying</span>
              <p className="verification-title">Checking account name…</p>
              <p className="verification-note">Confirming your payout account with Paystack.</p>
            </div>
          </div>
        ) : verified && accountName ? (
          <div className="verification-card verification-card-success">
            <div className="verification-icon">
              <svg className="check-svg" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                <circle className="check-circle" cx="22" cy="22" r="20" />
                <polyline className="check-tick" points="13,22 19,29 31,15" />
              </svg>
            </div>
            <div className="verification-copy">
              <span className="verification-pill">Verified</span>
              <p className="verification-title">{accountName}</p>
              <p className="verification-note">
                Account confirmed — this name will be used for all payouts.
              </p>
            </div>
          </div>
        ) : bankCode && accountNumber.length === 10 ? (
          <div className="verification-card verification-card-muted">
            <div className="verification-icon">
              <div className="pending-dot" />
            </div>
            <div>
              <span className="verification-pill">Pending</span>
              <p className="verification-title">Waiting for response</p>
              <p className="verification-note">Enter a valid bank and 10-digit account number.</p>
            </div>
          </div>
        ) : null}

        {banksLoading ? (
          <div className="card card-body">
            <p className="event-meta">{bankError || "Loading banks..."}</p>
          </div>
        ) : bankError ? (
          <div className="card card-body stack">
            <p style={{ color: "var(--danger)" }}>{bankError}</p>
            <button type="button" className="btn btn-ghost" onClick={() => setRetryCount((count) => count + 1)}>
              Retry
            </button>
          </div>
        ) : (
          <select
            className="select"
            value={bankCode}
            onChange={(e) => {
              setBankCode(e.target.value);
              setVerified(false);
              setAccountName("");
            }}
            required
          >
            <option value="">Select bank</option>
            {banks.map((bank, index) => (
              <option key={`${bank.code}-${index}`} value={bank.code}>{bank.name}</option>
            ))}
          </select>
        )}

        {error ? <p style={{ color: "var(--danger)" }}>{error}</p> : null}

        <button type="submit" className="btn btn-primary" disabled={loading || banksLoading || !!bankError || verifying}>
          {loading ? "Verifying & Creating Account..." : "Verify & Create Account"}
        </button>
        <button type="button" className="btn btn-ghost" onClick={() => navigate("/register")}>
          Back to Registration
        </button>
      </form>
    </div>
  );
}

export default HostSetup;

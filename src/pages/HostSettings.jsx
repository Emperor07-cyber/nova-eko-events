import React, { useState, useEffect } from "react";
import HostLayout from "../components/Layout/HostLayout";
import { auth, database } from "../firebase/firebaseConfig";
import { updateProfile, updatePassword } from "firebase/auth";
import { ref, update, get } from "firebase/database";

const HostSettings = () => {
  const user = auth.currentUser;

  const [name, setName] = useState(user?.displayName || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  // Bank details state
  const [banks, setBanks] = useState([]);
  const [bankCode, setBankCode] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [currentBank, setCurrentBank] = useState("");
  const [currentAccountNumber, setCurrentAccountNumber] = useState("");
  const [bankLoading, setBankLoading] = useState(false);
  const [bankError, setBankError] = useState("");
  const [bankSuccess, setBankSuccess] = useState("");

  const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

  // Load existing bank details from Firebase
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) return;
      const snap = await get(ref(database, "users/" + user.uid));
      if (snap.exists()) {
        const data = snap.val();
        setCurrentBank(data.bank || "");
        setCurrentAccountNumber(data.accountNumber || "");
        setAccountName(data.accountName || "");
      }
    };
    loadUserData();
  }, [user]);

  // Load bank list from Paystack
  useEffect(() => {
    const fetchBanks = async () => {
      try {
        const res = await fetch(`${API_URL}/get-banks`);
        const data = await res.json();
        setBanks(data.data);
      } catch (err) {
        console.error("Error fetching banks:", err);
      }
    };
    fetchBanks();
  }, [API_URL]);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!user) return;
    try {
      setLoading(true);
      await updateProfile(user, { displayName: name });
      await update(ref(database, "users/" + user.uid), { name });
      alert("Name updated successfully!");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!user || !password) return;
    try {
      setLoading(true);
      await updatePassword(user, password);
      alert("Password updated successfully!");
      setPassword("");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateBankDetails = async (e) => {
    e.preventDefault();
    setBankError("");
    setBankSuccess("");

    if (!bankCode || !accountNumber) {
      setBankError("Please select a bank and enter your account number.");
      return;
    }

    setBankLoading(true);

    try {
      // Verify account with Paystack first
      const res = await fetch(
        `${API_URL}/verifyAccount?accountNumber=${accountNumber}&bankCode=${bankCode}`,
        { method: "GET", cache: "no-store" }
      );
      const data = await res.json();

      if (!data.status) {
        setBankError("❌ Invalid account details. Please check and try again.");
        setBankLoading(false);
        return;
      }

      const verifiedName = data.data.account_name;
      const selectedBank = banks.find((b) => b.code === bankCode);

      // Save verified details to Firebase
      await update(ref(database, "users/" + user.uid), {
        accountName: verifiedName,
        accountNumber,
        bank: selectedBank ? selectedBank.name : bankCode,
        bankCode,
      });

      // Update local display
      setAccountName(verifiedName);
      setCurrentBank(selectedBank ? selectedBank.name : bankCode);
      setCurrentAccountNumber(accountNumber);
      setBankSuccess(`✅ Account updated! Verified name: ${verifiedName}`);
      setAccountNumber("");
      setBankCode("");
    } catch (err) {
      console.error(err);
      setBankError("Verification failed. Please try again.");
    } finally {
      setBankLoading(false);
    }
  };

  return (
    <HostLayout>
      <div className="host-settings">
        <h2>⚙ Host Settings</h2>

        {/* Update Name */}
        <form onSubmit={handleUpdateName} className="settings-card">
          <h3>Update Display Name</h3>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter new name"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Name"}
          </button>
        </form>

        {/* Update Password */}
        <form onSubmit={handleUpdatePassword} className="settings-card">
          <h3>Change Password</h3>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>

        {/* Email (read-only) */}
        <div className="settings-card">
          <h3>Email</h3>
          <p>{user?.email}</p>
        </div>

        {/* Update Bank / Payout Details */}
        <form onSubmit={handleUpdateBankDetails} className="settings-card">
          <h3>Payout Account Details</h3>

          {/* Show current saved details */}
          {currentBank && currentAccountNumber && (
            <div className="current-account-info">
              <p>
                <span className="info-label">Current Bank:</span> {currentBank}
              </p>
              <p>
                <span className="info-label">Account Number:</span>{" "}
                {"*".repeat(currentAccountNumber.length - 4) +
                  currentAccountNumber.slice(-4)}
              </p>
              {accountName && (
                <p>
                  <span className="info-label">Account Name:</span> {accountName}
                </p>
              )}
            </div>
          )}

          <p className="settings-sub">Enter new details to update your payout account:</p>

          <input
            type="text"
            placeholder="New Account Number"
            value={accountNumber}
            onChange={(e) => {
              setAccountNumber(e.target.value);
              setBankError("");
              setBankSuccess("");
            }}
            maxLength={10}
            required
          />

          <select
            value={bankCode}
            onChange={(e) => {
              setBankCode(e.target.value);
              setBankError("");
              setBankSuccess("");
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

          {bankError && <p className="settings-error">{bankError}</p>}
          {bankSuccess && <p className="settings-success">{bankSuccess}</p>}

          <button type="submit" disabled={bankLoading}>
            {bankLoading ? "Verifying & Saving..." : "Update Payout Account"}
          </button>
        </form>
      </div>
    </HostLayout>
  );
};

export default HostSettings;
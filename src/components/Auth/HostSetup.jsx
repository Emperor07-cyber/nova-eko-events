    import React, { useState, useEffect } from "react";
    import { useLocation, useNavigate } from "react-router-dom";
    import { ref, update } from "firebase/database";
    import { database } from "../../firebase/firebaseConfig";
    import Header1 from "../Layout/Header1";
    import Footer from "../Layout/Footer";
    import { auth } from "../../firebase/firebaseConfig";
    import { useAuthState } from "react-firebase-hooks/auth";

    function HostSetup() {
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankCode, setBankCode] = useState("");
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const [user] = useAuthState(auth);
    const API_URL = import.meta.env.VITE_API_URL || "http://localhost:5000";

    useEffect(() => {
        const fetchBanks = async () => {
        try {
            const res = await fetch(`${API_URL}/get-banks`);
            const data = await res.json();
            setBanks(data.data); // Paystack returns {status, message, data: []}
        } catch (error) {
            console.error("Error fetching banks:", error);
        }
        };
        fetchBanks();
    }, []);

    const handleVerifyAndSave = async (e) => {
  e.preventDefault();

  if (!user) {
    alert("Please login first.");
    return;
  }

  if (!bankCode || !accountNumber) {
    alert("Please enter account details.");
    return;
  }

  setLoading(true);

  try {
    const res = await fetch(
      `${API_URL}/verifyAccount?accountNumber=${accountNumber}&bankCode=${bankCode}`,
      { method: "GET", cache: "no-store" }
    );

    const data = await res.json();
    console.log("Verification response:", data);

    if (!data.status) {
      alert("Invalid account details.");
      setLoading(false);
      return;
    }

    const verifiedName = data.data.account_name;
    setAccountName(verifiedName);

    // ✅ Replaces the old await update(...) block
    const selectedBank = banks.find((b) => b.code === bankCode);

    await update(ref(database, "users/" + user.uid), {
      accountName: verifiedName,
      accountNumber,
      bank: selectedBank ? selectedBank.name : bankCode,
      bankCode,
      hostVerified: true,
    });

    alert("Account verified successfully!");
    navigate("/host/dashboard");

  } catch (error) {
    console.error(error); // 👈 keep this so you can see future errors
    alert("Verification failed.");
  } finally {
    setLoading(false);
  }
};

    return (
        <>
        <Header1 />
        <div className="host-setup">
        <h2>Host Account Setup</h2>
        <p>Please provide your payout details:</p>

        <form onSubmit={handleVerifyAndSave}>
  {/* ❌ Remove this — user shouldn't manually enter account name */}
  {/* Paystack will resolve it automatically */}

  <label htmlFor="accountNumber">
    <h4>Account Number</h4>
    <input
      type="text"
      placeholder="Account Number"
      value={accountNumber}
      onChange={(e) => setAccountNumber(e.target.value)}
      required
    />
  </label>

  <h4 style={{ marginTop: "1rem" }}>Bank</h4>
  <select value={bankCode} onChange={(e) => setBankCode(e.target.value)} required>
    <option value="">Select Bank</option>
    {banks.map((bank) => (
      <option key={bank.code} value={bank.code}>{bank.name}</option> 
    ))}
  </select>

  <button type="submit" disabled={loading}>
    {loading ? "Verifying..." : "Save Details"}
  </button>
</form>

{/* ✅ This now correctly shows after setAccountName() is called */}
{accountName && <p>✅ Account Name: {accountName}</p>}

        {accountName && <p>✅ Account Name: {accountName}</p>}
        </div>
            <Footer />
        </>
    );
    }


    export default HostSetup;

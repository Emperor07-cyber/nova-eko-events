    import React, { useState, useEffect } from "react";
    import { useLocation, useNavigate } from "react-router-dom";
    import { ref, update } from "firebase/database";
    import { database } from "../../firebase/firebaseConfig";
    import Header1 from "../Layout/Header1";
    import Footer from "../Layout/Footer";

    function HostSetup() {
    const [accountName, setAccountName] = useState("");
    const [accountNumber, setAccountNumber] = useState("");
    const [bankCode, setBankCode] = useState("");
    const [banks, setBanks] = useState([]);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();
    const location = useLocation();
    const { uid } = location.state || {}; // From Register

    useEffect(() => {
        const fetchBanks = async () => {
        try {
            const res = await fetch("/getBanks"); // Your Firebase function URL
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
        if (!uid) {
        alert("Error: No user ID found!");
        return;
        }

        setLoading(true);
        try {
        // Verify account
        const res = await fetch(
            `/verifyAccount?accountNumber=${accountNumber}&bankCode=${bankCode}`
        );
        const data = await res.json();

        if (data.status && data.data) {
            setAccountName(data.data.account_name);

            // Save to Firebase
            await update(ref(database, "users/" + uid), {
            accountName: data.data.account_name,
            accountNumber,
            bank: data.data.bank_name,
            });

            alert("Host setup completed!");
            navigate("/");
        } else {
            alert("Invalid account details. Please check and try again.");
        }
        } catch (error) {
        alert("Error verifying account: " + error.message);
        }
        setLoading(false);
    };

    return (
        <>
        <Header1 />
        <div className="host-setup">
        <h2>Host Account Setup</h2>
        <p>Please provide your payout details:</p>

        <form onSubmit={handleVerifyAndSave}>
            <label htmlFor="accountName"><h4>Account Name</h4> 
            <input
            type="text"
            placeholder="Account Name"
            value={accountName}
            onChange={(e) => setAccountName(e.target.value)}
            required
            />
            </label>
            <label htmlFor="accountNumber"><h4>Account Number</h4>
            <input
            type="text"
            placeholder="Account Number"
            value={accountNumber}
            onChange={(e) => setAccountNumber(e.target.value)}
            required
            />
            </label>
            <h4 style={{ marginTop: "1rem" }}>Bank</h4>
            <select
            s
            
            value={bankCode}
            onChange={(e) => setBankCode(e.target.value)}
            required
            >
             <option value="" style={{ display: "none",width: "80%" }}>Select Bank</option>

  {/* Commercial Banks */}
  <optgroup label="Commercial Banks">
    <option value="044">Access Bank Limited</option>
    <option value="070">Fidelity Bank Plc</option>
    <option value="214">First City Monument Bank (FCMB) Limited</option>
    <option value="011">First Bank of Nigeria Limited</option>
    <option value="058">Guaranty Trust Bank (GTBank) Limited</option>
    <option value="033">United Bank for Africa (UBA) Plc</option>
    <option value="057">Zenith Bank Plc</option>
    <option value="023">Citibank Nigeria Limited</option>
    <option value="050">Ecobank Nigeria Limited</option>
    <option value="030">Heritage Bank Plc</option>
    <option value="001">Globus Bank Limited</option>
    <option value="082">Keystone Bank Limited</option>
    <option value="076">Polaris Bank Limited</option>
    <option value="221">Stanbic IBTC Bank Limited</option>
    <option value="068">Standard Chartered Bank Limited</option>
    <option value="232">Sterling Bank Limited</option>
    <option value="526">Titan Trust Bank Limited</option>
    <option value="032">Union Bank of Nigeria Plc</option>
    <option value="215">Unity Bank Plc</option>
    <option value="035">Wema Bank Plc</option>
    <option value="101">Premium Trust Bank Limited</option>
    <option value="107">Optimus Bank Limited</option>
    <option value="101">Providus Bank Limited</option>
    <option value="104">Parallex Bank Limited</option>
    <option value="100">Suntrust Bank Nigeria Limited</option>
    <option value="106">Signature Bank Limited</option>
  </optgroup>

  {/* Microfinance Banks */}
  <optgroup label="Microfinance Banks">
    <option value="601">AB Microfinance Bank Limited</option>
    <option value="602">ACCION Microfinance Bank Limited</option>
    <option value="603">Advans La Fayette Microfinance Bank Limited</option>
    <option value="604">Assets Microfinance Bank Limited</option>
    <option value="605">Caurie Microfinance Bank Limited</option>
    <option value="606">CreditRegistry Microfinance Bank Limited</option>
    <option value="607">DealDey Microfinance Bank Limited</option>
    <option value="608">Fina Trust Microfinance Bank Limited</option>
    <option value="609">Fortis Microfinance Bank Limited</option>
    <option value="610">Full Gospel Businessmen's Fellowship MFB</option>
    <option value="611">Grooming Microfinance Bank Limited</option>
    <option value="612">Infinity Trust Mortgage & MFB</option>
    <option value="613">Links Microfinance Bank Limited</option>
    <option value="614">Lotus Microfinance Bank Limited</option>
    <option value="615">Newedge Microfinance Bank Limited</option>
    <option value="616">NIRSAL Microfinance Bank Limited</option>
    <option value="617">Noetix MFB</option>
    <option value="618">OMA Microfinance Bank Limited</option>
    <option value="619">Pagoda Microfinance Bank Limited</option>
    <option value="620">Reliance Microfinance Bank Limited</option>
    <option value="621">Rigo Microfinance Bank Limited</option>
    <option value="622">Sokopay Microfinance Bank Limited</option>
    <option value="623">Tyreless Microfinance Bank Limited</option>
    <option value="624">X3M Microfinance Bank Limited</option>
    <option value="625">Zapay Microfinance Bank Limited</option>
  </optgroup>

  {/* Digital Microfinance Banks */}
  <optgroup label="Digital Microfinance Banks">
    <option value="901">Carbon (PayLater MFB)</option>
    <option value="902">FairMoney (MFB)</option>
    <option value="903">Kuda Bank (MFB)</option>
    <option value="904">Moniepoint (MFB)</option>
    <option value="905">OPay (MFB)</option>
    <option value="906">Palmpay (MFB)</option>
    <option value="907">Sparkle (MFB)</option>
    <option value="908">V Bank (VFD MFB)</option>
    <option value="909">Branch (MFB)</option>
    <option value="910">HopePSB</option>
    <option value="911">Migo (MFB)</option>
    <option value="912">Okash (MFB)</option>
    <option value="913">QuickCheck (MFB)</option>
    <option value="914">Sofri by Links (MFB)</option>
  </optgroup>
            </select>

            <button type="submit" disabled={loading}>
            {loading ? "Verifying..." : "Save Details"}
            </button>
        </form>

        {accountName && <p>✅ Account Name: {accountName}</p>}
        </div>
            <Footer />
        </>
    );
    }


    export default HostSetup;

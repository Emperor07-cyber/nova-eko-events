import React, { useEffect, useState } from "react";
import HostLayout from "../components/Layout/HostLayout";
import { database, auth } from "../firebase/firebaseConfig";
import { ref, onValue, push, set, get } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";

const HostWallet = () => {
  const [user] = useAuthState(auth);
  const [tickets, setTickets] = useState([]);
  const [balance, setBalance] = useState(0);
  const [showModal, setShowModal] = useState(false);
  const [withdrawAmount, setWithdrawAmount] = useState("");
  const [withdrawNote, setWithdrawNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    if (!user) return;
    const ticketsRef = ref(database, "tickets");
    const unsubscribe = onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const hostTickets = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .filter((ticket) => ticket.hostEmail === user.email);
      setTickets(hostTickets);
      let net = 0;
      hostTickets.forEach((ticket) => {
        const gross = ticket.totalPaid || 0;
        const fee = gross * 0.05 + 100;
        net += gross - fee;
      });
      setBalance(net);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user) return;
    const requestsRef = ref(database, "withdrawalRequests");
    const unsubscribe = onValue(requestsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const hostRequests = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .filter((r) => r.hostEmail === user.email)
        .sort((a, b) => b.timestamp - a.timestamp);
      setRequests(hostRequests);
    });
    return () => unsubscribe();
  }, [user]);

  const totalGross = tickets.reduce((sum, t) => sum + (t.totalPaid || 0), 0);
  const totalFees = totalGross - balance;

  const handleWithdrawRequest = async (e) => {
    e.preventDefault();
    const amount = Number(withdrawAmount);
    if (!amount || amount <= 0) { alert("Please enter a valid amount."); return; }
    if (amount > balance) { alert(`Amount exceeds your available balance of ₦${balance.toLocaleString()}.`); return; }
    setSubmitting(true);
    try {
      const userSnap = await get(ref(database, "users/" + user.uid));
      const userInfo = userSnap.val();
      const requestData = {
        hostEmail: user.email, hostUid: user.uid,
        hostName: userInfo?.displayName || user.email,
        accountName: userInfo?.accountName || "",
        accountNumber: userInfo?.accountNumber || "",
        bank: userInfo?.bank || "", bankCode: userInfo?.bankCode || "",
        amount, note: withdrawNote, balance, status: "pending", timestamp: Date.now(),
      };
      const newRef = push(ref(database, "withdrawalRequests"));
      await set(newRef, requestData);
      alert("✅ Withdrawal request submitted! Admin will process it shortly.");
      setShowModal(false); setWithdrawAmount(""); setWithdrawNote("");
    } catch (err) {
      console.error(err);
      alert("Failed to submit request. Please try again.");
    } finally { setSubmitting(false); }
  };

  const getStatusBadge = (status) => {
    const styles = {
      pending:   { background: "#fff8e1", color: "#f59e0b", border: "1px solid #fcd34d" },
      approved:  { background: "#f0fdf4", color: "#009f15", border: "1px solid #86efac" },
      rejected:  { background: "#fef2f2", color: "#ef4444", border: "1px solid #fca5a5" },
      completed: { background: "#eff6ff", color: "#3b82f6", border: "1px solid #93c5fd" },
    };
    const style = styles[status] || styles.pending;
    return (
      <span style={{ ...style, padding: "3px 10px", borderRadius: "20px", fontSize: "0.75rem", fontWeight: "600", textTransform: "capitalize" }}>
        {status}
      </span>
    );
  };

  return (
    <HostLayout>
      <h2 className="section-title">💳 Wallet</h2>

      <div className="wallet-stats">
        <div className="wallet-card">
          <div className="wallet-card-inner">
            <span className="wallet-label">Available Balance</span>
            <span className="wallet-amount">₦{balance.toLocaleString()}</span>
          </div>
        </div>
        <div className="wallet-stat-card">
          <span className="wallet-stat-label">Gross Revenue</span>
          <span className="wallet-stat-value">₦{totalGross.toLocaleString()}</span>
        </div>
        <div className="wallet-stat-card">
          <span className="wallet-stat-label">Platform Fees</span>
          <span className="wallet-stat-value fees">₦{totalFees.toLocaleString()}</span>
        </div>
      </div>

      <div style={{ marginBottom: "2rem" }}>
        <button className="btn-withdraw" onClick={() => setShowModal(true)} disabled={balance <= 0}>
          💸 Request Withdrawal
        </button>
        {balance <= 0 && (
          <p style={{ fontSize: "0.82rem", color: "#94a3b8", marginTop: "6px" }}>No balance available to withdraw.</p>
        )}
      </div>

      {requests.length > 0 && (
        <>
          <h3 className="section-title" style={{ marginTop: "0" }}>📋 Withdrawal Requests</h3>
          <div className="table-wrapper" style={{ marginBottom: "2rem" }}>
            <table className="host-table">
              <thead>
                <tr><th>Date</th><th>Amount</th><th>Status</th><th>Note</th></tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td>{new Date(r.timestamp).toLocaleDateString()}</td>
                    <td style={{ fontWeight: 600 }}>₦{r.amount.toLocaleString()}</td>
                    <td>{getStatusBadge(r.status)}</td>
                    <td style={{ color: "#64748b", fontSize: "0.85rem" }}>{r.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h3 className="section-title">Transaction History</h3>
      <div className="table-wrapper">
        <table className="host-table">
          <thead>
            <tr><th>Buyer</th><th>Event</th><th>Gross</th><th>Fee (5% + ₦100)</th><th>Net Payout</th></tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr><td colSpan={5} className="table-empty">No transactions yet.</td></tr>
            ) : (
              tickets.map((ticket) => {
                const gross = ticket.totalPaid || 0;
                const fee = gross * 0.05 + 100;
                const net = gross - fee;
                return (
                  <tr key={ticket.id}>
                    <td>{ticket.email}</td><td>{ticket.eventTitle}</td>
                    <td>₦{gross.toLocaleString()}</td>
                    <td className="fee-cell">₦{fee.toLocaleString()}</td>
                    <td className="net-cell">₦{net.toLocaleString()}</td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 style={{ marginBottom: "0.25rem", color: "#1e293b" }}>💸 Request Withdrawal</h3>
            <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "1.5rem" }}>
              Available: <strong style={{ color: "#009f15" }}>₦{balance.toLocaleString()}</strong>
            </p>
            <form onSubmit={handleWithdrawRequest} style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
              <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" }}>
                Amount (₦)
                <input type="number" min="1" max={balance} value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Max ₦${balance.toLocaleString()}`} required
                  style={{ display: "block", width: "100%", marginTop: "6px", padding: "0.65rem 1rem", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "0.95rem", outline: "none", fontFamily: "inherit" }}
                />
              </label>
              <label style={{ fontSize: "0.9rem", fontWeight: 600, color: "#1e293b" }}>
                Note to admin (optional)
                <textarea value={withdrawNote} onChange={(e) => setWithdrawNote(e.target.value)}
                  placeholder="Any message for the admin..." rows={3}
                  style={{ display: "block", width: "100%", marginTop: "6px", padding: "0.65rem 1rem", border: "1px solid #e5e7eb", borderRadius: "6px", fontSize: "0.9rem", resize: "vertical", outline: "none", fontFamily: "inherit" }}
                />
              </label>
              <div style={{ display: "flex", gap: "0.75rem", justifyContent: "flex-end", marginTop: "0.5rem" }}>
                <button type="button" onClick={() => setShowModal(false)}
                  style={{ padding: "0.6rem 1.25rem", border: "1px solid #e5e7eb", borderRadius: "6px", background: "#fff", color: "#64748b", cursor: "pointer", fontSize: "0.9rem", fontFamily: "inherit" }}>
                  Cancel
                </button>
                <button type="submit" className="btn-primary" disabled={submitting}>
                  {submitting ? "Submitting..." : "Submit Request"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </HostLayout>
  );
};

export default HostWallet;

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
  const [hostEventIds, setHostEventIds] = useState([]);

  useEffect(() => {
    if (!user) return;
    const eventsRef = ref(database, "events");
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const ids = Object.entries(data)
        .filter(([, val]) => val.createdBy?.toLowerCase() === user.email?.toLowerCase())
        .map(([id]) => id);
      setHostEventIds(ids);
    });
    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (!user || hostEventIds.length === 0) return;
    const ticketsRef = ref(database, "tickets");
    const unsubscribe = onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const hostTickets = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .filter((ticket) =>
          ticket.hostEmail?.toLowerCase() === user.email?.toLowerCase() ||
          hostEventIds.includes(ticket.eventId)
        );
      setTickets(hostTickets);
    });
    return () => unsubscribe();
  }, [user, hostEventIds]);

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

  // Recalculate balance whenever tickets or requests change
  useEffect(() => {
    const totalEarned = tickets.reduce((sum, t) => sum + (t.totalPaid || 0), 0);
    const totalWithdrawn = requests
      .filter((r) => r.status === "completed")
      .reduce((sum, r) => sum + (r.amount || 0), 0);
    setBalance(totalEarned - totalWithdrawn);
  }, [tickets, requests]);

  const totalGross = tickets.reduce((sum, t) => sum + (t.totalPaid || 0), 0);
  const totalWithdrawn = requests
    .filter((r) => r.status === "completed")
    .reduce((sum, r) => sum + (r.amount || 0), 0);

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
    const statusClass = {
      pending: "is-pending",
      approved: "is-approved",
      rejected: "is-rejected",
      completed: "is-completed",
    }[status] || "is-pending";

    return <span className={`wallet-status-badge ${statusClass}`}>{status}</span>;
  };

  return (
    <HostLayout>
      <h2 className="section-title">Wallet</h2>

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
          <span className="wallet-stat-label">Total Withdrawn</span>
          <span className="wallet-stat-value fees">₦{totalWithdrawn.toLocaleString()}</span>
        </div>
      </div>

      <div className="wallet-withdraw-row">
        <button className="btn-withdraw" onClick={() => setShowModal(true)} disabled={balance <= 0}>
          Request Withdrawal
        </button>
        {balance <= 0 && (
          <p className="wallet-muted-message">No balance available to withdraw.</p>
        )}
      </div>

      {requests.length > 0 && (
        <>
          <h3 className="section-title wallet-section-tight">Withdrawal Requests</h3>
          <div className="table-wrapper wallet-table-gap">
            <table className="host-table host-table-stacked">
              <thead>
                <tr><th>Date</th><th>Amount</th><th>Status</th><th>Note</th></tr>
              </thead>
              <tbody>
                {requests.map((r) => (
                  <tr key={r.id}>
                    <td data-label="Date">{new Date(r.timestamp).toLocaleDateString()}</td>
                    <td className="wallet-amount-cell" data-label="Amount">₦{r.amount.toLocaleString()}</td>
                    <td data-label="Status">{getStatusBadge(r.status)}</td>
                    <td className="wallet-note-cell" data-label="Note">{r.note || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      <h3 className="section-title">Transaction History</h3>
      <div className="table-wrapper">
        <table className="host-table host-table-stacked">
          <thead>
            <tr><th>Buyer</th><th>Event</th><th>Amount</th></tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr><td colSpan={3} className="table-empty">No transactions yet.</td></tr>
            ) : (
              tickets.map((ticket) => (
                <tr key={ticket.id}>
                  <td data-label="Buyer">{ticket.email}</td>
                  <td data-label="Event">{ticket.eventTitle}</td>
                  <td data-label="Amount">₦{(ticket.totalPaid || 0).toLocaleString()}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-box" onClick={(e) => e.stopPropagation()}>
            <h3 className="wallet-modal-title">Request Withdrawal</h3>
            <p className="wallet-modal-sub">
              Available: <strong className="wallet-modal-balance">₦{balance.toLocaleString()}</strong>
            </p>
            <form onSubmit={handleWithdrawRequest} className="wallet-modal-form">
              <label className="wallet-modal-label">
                Amount (₦)
                <input
                  className="wallet-modal-input"
                  type="number"
                  min="1"
                  max={balance}
                  value={withdrawAmount}
                  onChange={(e) => setWithdrawAmount(e.target.value)}
                  placeholder={`Max ₦${balance.toLocaleString()}`}
                  required
                />
              </label>
              <label className="wallet-modal-label">
                Note to admin (optional)
                <textarea
                  className="wallet-modal-textarea"
                  value={withdrawNote}
                  onChange={(e) => setWithdrawNote(e.target.value)}
                  placeholder="Any message for the admin..."
                  rows={3}
                />
              </label>
              <div className="wallet-modal-actions">
                <button type="button" onClick={() => setShowModal(false)} className="wallet-modal-cancel">
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

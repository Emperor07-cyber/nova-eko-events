import React, { useEffect, useState } from "react";
import HostLayout from "../components/Layout/HostLayout";
import { database, auth } from "../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";


const HostWallet = () => {
  const [user] = useAuthState(auth);
  const [tickets, setTickets] = useState([]);
  const [balance, setBalance] = useState(0);

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

  const totalGross = tickets.reduce((sum, t) => sum + (t.totalPaid || 0), 0);
  const totalFees = totalGross - balance;

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

      <h3 className="section-title" style={{ marginTop: "2rem" }}>
        Transaction History
      </h3>

      <div className="table-wrapper">
        <table className="host-table">
          <thead>
            <tr>
              <th>Buyer</th>
              <th>Event</th>
              <th>Gross</th>
              <th>Fee (5% + ₦100)</th>
              <th>Net Payout</th>
            </tr>
          </thead>
          <tbody>
            {tickets.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  No transactions yet.
                </td>
              </tr>
            ) : (
              tickets.map((ticket) => {
                const gross = ticket.totalPaid || 0;
                const fee = gross * 0.05 + 100;
                const net = gross - fee;
                return (
                  <tr key={ticket.id}>
                    <td>{ticket.email}</td>
                    <td>{ticket.eventTitle}</td>
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
    </HostLayout>
  );
};

export default HostWallet;

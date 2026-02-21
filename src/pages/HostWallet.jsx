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

    onValue(ticketsRef, (snapshot) => {
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
  }, [user]);

  return (
    <HostLayout>
      <h2>Wallet</h2>

      <div>
        <h3>Available Balance</h3>
        <p>₦{balance.toLocaleString()}</p>
      </div>

      <h3>Transactions</h3>

      <table>
        <thead>
          <tr>
            <th>Buyer</th>
            <th>Event</th>
            <th>Amount</th>
          </tr>
        </thead>

        <tbody>
          {tickets.map((ticket) => (
            <tr key={ticket.id}>
              <td>{ticket.email}</td>
              <td>{ticket.eventTitle}</td>
              <td>₦{ticket.totalPaid}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </HostLayout>
  );
};

export default HostWallet;

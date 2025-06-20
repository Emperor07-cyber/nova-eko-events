import React, { useEffect, useState } from "react";
import { auth, database } from "../../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import QRCode from "react-qr-code";

const MyTickets = () => {
  const [tickets, setTickets] = useState([]);
  const currentUser = auth.currentUser;

  useEffect(() => {
    if (!currentUser) return;

    const userTicketsRef = ref(database, "tickets/");
    onValue(userTicketsRef, (snapshot) => {
      const data = snapshot.val();
      if (data) {
        const userTickets = Object.values(data).filter(
          (ticket) => ticket.userId === currentUser.uid
        );
        setTickets(userTickets);
      }
    });
  }, [currentUser]);

  if (!currentUser) return <p>Please log in to view your tickets.</p>;

  return (
    <div className="my-tickets-page">
      <h2>My Tickets</h2>
      {tickets.length === 0 ? (
        <p>You have no tickets yet.</p>
      ) : (
        tickets.map((ticket, index) => (
          <div className="ticket-card" key={index}>
            <h3>{ticket.eventTitle}</h3>
            <p>Type: {ticket.ticketType}</p>
            <p>Email: {ticket.email}</p>
            <p>Name: {ticket.name}</p>
            <p>Ticket Ref: {ticket.ticketId}</p>
            <QRCode value={JSON.stringify(ticket)} size={160} />
          </div>
        ))
      )}
    </div>
  );
};

export default MyTickets;

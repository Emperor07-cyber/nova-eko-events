import { useAuthState } from "react-firebase-hooks/auth";
import { auth, database } from "../../firebase/firebaseConfig";
import { ref, get, onValue } from "firebase/database";
import { useEffect, useState } from "react";

const MyTickets = () => {
  const [user] = useAuthState(auth);
  const [tickets, setTickets] = useState([]);

  useEffect(() => {
    if (!user) return;

    const ticketsRef = ref(database, "tickets");
    onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val();
      const userTickets = Object.values(data || {}).filter(
        (ticket) => ticket.email === user.email
      );
      setTickets(userTickets);
    });
  }, [user]);

  return (
    <div>
      <h2>My Tickets</h2>
      {tickets.length === 0 ? (
        <p>No tickets found.</p>
      ) : (
        tickets.map((ticket, index) => (
          <div key={index}>
            <h4>{ticket.ticketType}</h4>
            <p>Quantity: {ticket.quantity}</p>
            <p>Event ID: {ticket.eventId}</p>
          </div>
        ))
      )}
    </div>
  );
};

export default MyTickets;

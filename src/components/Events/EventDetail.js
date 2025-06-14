import React from "react";
import Checkout from "../Payments/Checkout";
import { auth } from "../../firebase/firebaseConfig";

function EventDetail() {
  const user = auth.currentUser;

  const handlePaymentSuccess = (reference) => {
    console.log("Ticket purchased with reference:", reference.reference);
    // Save ticket to Firebase here
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Event Title</h2>
      <p>Details about the event...</p>

      {user ? (
        <Checkout user={user} amount={5000} onSuccess={handlePaymentSuccess} />
      ) : (
        <p>Please login to buy tickets.</p>
      )}
    </div>
  );
}

export default EventDetail;

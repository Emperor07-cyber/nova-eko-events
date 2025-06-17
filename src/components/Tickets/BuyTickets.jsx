// src/tickets/BuyTicket.jsx
import React from "react";
import { FlutterWaveButton, closePaymentModal } from "flutterwave-react-v3";
import { auth } from "../firebase/firebaseConfig";
import storeTicket from "./storeTicket";

function BuyTicket({ event }) {
  const user = auth.currentUser;

  const config = {
    public_key: "YOUR_FLUTTERWAVE_PUBLIC_KEY",
    tx_ref: Date.now(),
    amount: event.price,
    currency: "NGN",
    payment_options: "card,mobilemoney,ussd",
    customer: {
      email: user?.email,
      name: user?.displayName || "Nova Eko User",
    },
    customizations: {
      title: event.title,
      description: `Ticket for ${event.title}`,
      logo: "https://your-logo-url.com/logo.png",
    },
  };

  const fwConfig = {
    ...config,
    text: "Pay Now",
    callback: async (response) => {
      if (response.status === "successful") {
        await storeTicket({
          userId: user.uid,
          eventId: event.id,
          eventTitle: event.title,
          ticketId: response.transaction_id,
        });
        alert("Payment successful! Ticket stored.");
        closePaymentModal();
      } else {
        alert("Payment failed or cancelled.");
      }
    },
    onClose: () => {
      console.log("Payment modal closed");
    },
  };

  return <FlutterWaveButton {...fwConfig} />;
}

export default BuyTicket;

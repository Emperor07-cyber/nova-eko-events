import React from "react";
import QRCode from "react-qr-code";

const TicketQRCode = ({ ticketId }) => {
  return (
    <div>
      <h3>Your Ticket QR Code:</h3>
      <QRCode value={ticketId} />
    </div>
  );
};

export default TicketQRCode;

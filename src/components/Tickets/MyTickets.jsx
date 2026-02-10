import { useAuthState } from "react-firebase-hooks/auth";
import { auth, database } from "../../firebase/firebaseConfig";
import { ref, onValue } from "firebase/database";
import { useEffect, useState } from "react";
import QRCode from "react-qr-code";
import Modal from "react-modal";
import jsPDF from "jspdf";
import html2canvas from "html2canvas";

const MyTickets = () => {
  const [user] = useAuthState(auth);
  const [tickets, setTickets] = useState([]);
  const [selectedTicket, setSelectedTicket] = useState(null);
  const [modalOpen, setModalOpen] = useState(false);

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

  Modal.setAppElement("#root");

  const handlePrint = () => {
    const printContent = document.getElementById("qr-ticket-print");
    const win = window.open();
    win.document.write(`
      <html>
        <head><title>Print Ticket</title></head>
        <body>${printContent.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const handleDownloadPDF = () => {
    const qrElement = document.getElementById("qr-ticket-print");
    if (!qrElement) return;

    html2canvas(qrElement).then((canvas) => {
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF("p", "mm", "a4");
      const imgWidth = 190;
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, "PNG", 10, 10, imgWidth, imgHeight);
      pdf.save(`ticket-${selectedTicket.transactionId}.pdf`);
    });
  };

  const handleDownloadImage = () => {
    const qrElement = document.getElementById("qr-ticket-print");
    if (!qrElement) return;

    html2canvas(qrElement).then((canvas) => {
      const link = document.createElement("a");
      link.href = canvas.toDataURL("image/png");
      link.download = `ticket-${selectedTicket.transactionId}.png`;
      link.click();
    });
  };

  return (
    <div>
      <h2>🎟️ My Tickets</h2>
      {tickets.length === 0 ? (
        <p>No tickets found.</p>
      ) : (
        tickets.map((ticket, index) => (
          <div key={index} className="ticket-card">
            <h4>{ticket.ticketType}</h4>
            <p>Quantity: {ticket.quantity}</p>
            <p>Event ID: {ticket.eventId}</p>
            <button
              onClick={() => {
                setSelectedTicket(ticket);
                setModalOpen(true);
              }}
            >
              View Ticket
            </button>
          </div>
        ))
      )}

      {selectedTicket && (
        <Modal
          isOpen={modalOpen}
          onRequestClose={() => setModalOpen(false)}
          className="qr-modal"
          overlayClassName="qr-overlay"
        >
          <div id="qr-ticket-print" className="qr-content">
            <h2>🎫 Your Ticket</h2>
            <QRCode value={JSON.stringify(selectedTicket)} size={180} />
            <p><strong>Name:</strong> {selectedTicket.name}</p>
            <p><strong>Email:</strong> {selectedTicket.email}</p>
            <p><strong>Event ID:</strong> {selectedTicket.eventId}</p>
            <p><strong>Ticket Type:</strong> {selectedTicket.ticketType}</p>
            <p><strong>Quantity:</strong> {selectedTicket.quantity}</p>
            <p><strong>Transaction ID:</strong> {selectedTicket.transactionId}</p>
          </div>
          <div className="modal-buttons">
            <button onClick={handlePrint}>🖨️ Print Ticket</button>
            <button onClick={handleDownloadPDF}>⬇️ Download PDF</button>
            <button onClick={handleDownloadImage}>🖼️ Download Image</button>
            <button onClick={() => setModalOpen(false)}>Close</button>
          </div>
        </Modal>
      )}
    </div>
  );
};

export default MyTickets;

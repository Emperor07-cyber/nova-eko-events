// api/checkin/ticket.js
const admin = require('firebase-admin');

const admin = require('firebase-admin');

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      // Replace literal \n with actual line breaks
      privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n'),
    }),
    databaseURL: process.env.FIREBASE_DATABASE_URL
  });
}

// Ensure your Firebase Admin app is initialized before this runs
// admin.initializeApp({...});

module.exports = async (req, res) => {
  // 1. Accept POST requests only
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  const { ticketId, eventId, accessCode } = req.body;

  if (!ticketId || !eventId) {
    return res.status(400).json({ error: 'Missing ticketId or eventId' });
  }

  try {
    const db = admin.database();
    const ticketRef = db.ref(`tickets/${ticketId}`);

    // 2. Execute an Atomic Transaction
    const { committed, snapshot } = await ticketRef.transaction((currentData) => {
      // If the ticket doesn't exist, abort the transaction
      if (currentData === null) return undefined;

      // If the ticket belongs to a different event, abort
      if (currentData.eventId !== eventId) return undefined;

      // If the ticket is already checked in, abort
      if (currentData.checkedIn === true) return undefined;

      // Otherwise, apply the check-in status and timestamp
      currentData.checkedIn = true;
      currentData.checkedInAt = admin.database.ServerValue.TIMESTAMP;
      
      // Returning the modified object commits the write
      return currentData; 
    });

    // 3. Handle Aborted Transactions (Errors or Already Used)
    if (!committed) {
      // The transaction aborted because one of our conditions failed.
      // We must fetch the latest state to tell the front-end exactly why it failed.
      const ticketSnap = await ticketRef.once('value');
      const ticket = ticketSnap.val();

      if (!ticket) {
        return res.status(404).json({ error: 'Invalid Ticket' });
      }
      if (ticket.eventId !== eventId) {
        return res.status(400).json({ error: 'Ticket is for a different event' });
      }
      if (ticket.checkedIn) {
        // Returns the exact format your React app's 409 error handler expects
        return res.status(409).json({ 
          error: 'Already checked in',
          alreadyCheckedIn: true,
          checkedInAt: ticket.checkedInAt 
        });
      }
    }

    // 4. Success Response
    const updatedTicket = snapshot.val();
    return res.status(200).json({ 
      success: true, 
      ticket: updatedTicket 
    });

  } catch (error) {
    console.error('Check-in transaction error:', error);
    return res.status(500).json({ error: 'Internal server error verifying ticket' });
  }
};
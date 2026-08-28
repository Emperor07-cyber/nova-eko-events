const admin = require('firebase-admin');

// Ensure admin is initialized (same as your ticket.js file)
if (!admin.apps.length) {
  admin.initializeApp({ /* your credentials */ });
}

module.exports = async (req, res) => {
  if (req.method !== 'POST') return res.status(405).send('Method Not Allowed');
  
  const { accessCode } = req.body;
  if (!accessCode) return res.status(400).json({ error: 'Code required' });

  try {
    const db = admin.database();
    const eventsSnap = await db.ref('events').once('value');
    const events = eventsSnap.val();
    
    const enteredCode = accessCode.trim().toUpperCase();
    let matchedEventId = null;
    let scannerId = null;

    // Find the event and the specific scanner using the code
    Object.entries(events).forEach(([eventId, ev]) => {
      if (ev.scannerCode?.toUpperCase() === enteredCode) {
        matchedEventId = eventId;
        scannerId = `host_${eventId}`; // The main host code
      } else if (ev.scanners) {
        const foundScanner = Object.entries(ev.scanners).find(
          ([, scanner]) => scanner.active !== false && scanner.code?.toUpperCase() === enteredCode
        );
        if (foundScanner) {
          matchedEventId = eventId;
          scannerId = `volunteer_${foundScanner[0]}`; // A specific volunteer
        }
      }
    });

    if (!matchedEventId) {
      return res.status(401).json({ error: 'Invalid Access Code' });
    }

    // Generate a secure Firebase login token for this specific scanner
    const customToken = await admin.auth().createCustomToken(scannerId, {
      eventId: matchedEventId // We attach the eventId directly to their auth profile!
    });

    return res.status(200).json({ token: customToken, eventId: matchedEventId });
  } catch (error) {
    return res.status(500).json({ error: 'Login failed' });
  }
};
import React, { useEffect, useRef, useState } from "react";
import { ref, get, query, orderByChild, equalTo, runTransaction, serverTimestamp } from "firebase/database";
import { database } from "../firebase/firebaseConfig";
import { Html5Qrcode } from "html5-qrcode";
import { getAuth, signInAnonymously, signOut } from "firebase/auth";

const CheckInPage = () => {
  const [step, setStep] = useState("login");
  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [eventData, setEventData] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [scanResult, setScanResult] = useState(null); 
  const [scanMessage, setScanMessage] = useState("");
  const [attendeeInfo, setAttendeeInfo] = useState(null);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const [scanMode, setScanMode] = useState("camera"); 
  const [manualCode, setManualCode] = useState("");
  const [manualBusy, setManualBusy] = useState(false);
  
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const resultTimeoutRef = useRef(null);

  useEffect(() => {
    return () => {
      if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    };
  }, []);

  const playSound = (type) => {
    try {
      const ctx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);
      if (type === "success") {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        osc.frequency.setValueAtTime(1200, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      } else {
        osc.frequency.setValueAtTime(200, ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.3, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.4);
        osc.start(ctx.currentTime);
        osc.stop(ctx.currentTime + 0.4);
      }
    } catch (e) {}
  };

  const vibrate = (type) => {
    if (!navigator.vibrate) return;
    if (type === "success") navigator.vibrate([100, 50, 100]);
    else navigator.vibrate([300, 100, 300]);
  };

  // Client-Side Validation & Anonymous Auth
  const handleStartScanner = async () => {
    if (!accessCode.trim()) {
      setCodeError("Please enter an access code.");
      return;
    }
    setLoading(true);
    setCodeError("");

    try {
      // 1. Log in anonymously to bypass Firebase rules
      const auth = getAuth();
      await signInAnonymously(auth);

      // 2. Validate the code directly against the database
      const eventsRef = ref(database, "events");
      const snapshot = await get(eventsRef);
      
      if (!snapshot.exists()) {
        setCodeError("Invalid Access Code.");
        setLoading(false);
        return;
      }
      
      const events = snapshot.val();
      const enteredCode = accessCode.trim().toUpperCase();
      
      const match = Object.entries(events).find(([, ev]) => {
        if (ev.scannerCode?.toUpperCase() === enteredCode) return true;
        const scanners = ev.scanners || {};
        return Object.values(scanners).some(
          (scanner) => scanner.active !== false && scanner.code?.toUpperCase() === enteredCode
        );
      });

      if (!match) {
        setCodeError("Invalid Access Code.");
        await signOut(auth); // Log out if code fails
        setLoading(false);
        return;
      }

      const [id, ev] = match;
      setEventId(id);
      setEventData(ev);

      // 3. Fetch Event Tickets safely
      const ticketsQuery = query(ref(database, "tickets"), orderByChild("eventId"), equalTo(id));
      const ticketsSnap = await get(ticketsQuery);
      
      if (ticketsSnap.exists()) {
        const allTickets = Object.values(ticketsSnap.val());
        const totalQty = allTickets.reduce((sum, t) => sum + (t.quantity || 1), 0);
        const checkedIn = allTickets.filter((t) => t.checkedIn).reduce((sum, t) => sum + (t.quantity || 1), 0);
        setTotalTickets(totalQty);
        setCheckedInCount(checkedIn);
      } else {
        setTotalTickets(0);
        setCheckedInCount(0);
      }
      
      setStep("scanning");
    } catch (err) {
      console.error(err);
      setCodeError("Something went wrong. Try again.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step !== "scanning" || scanMode !== "camera") return;
    
    const startScanner = async () => {
      if (!document.getElementById("qr-reader")) return;
      
      try {
        html5QrRef.current = new Html5Qrcode("qr-reader");
        await html5QrRef.current.start(
          { facingMode: "environment" },
          { fps: 10, qrbox: { width: 280, height: 280 } },
          handleScan,
          () => {}
        );
      } catch (err) {
        console.error("Camera error:", err);
      }
    };
    
    startScanner();
    
    return () => {
      // BULLETPROOF CLEANUP: Prevents the crash if scanner isn't ready
      if (html5QrRef.current) {
        try {
          html5QrRef.current.stop().catch(() => {});
        } catch (error) {
          // Scanner wasn't running yet, safely ignore the library's error
        }
        html5QrRef.current = null;
      }
    };
  }, [step, scanMode]);

  const handleScan = async (decodedText) => {
    if (scanResult) return;
    if (html5QrRef.current) {
      await html5QrRef.current.pause();
    }
    await lookupAndCheckIn(decodedText, { resumeCamera: true });
  };

  const handleManualSubmit = async (e) => {
    e?.preventDefault?.();
    if (!manualCode.trim() || manualBusy) return;
    setManualBusy(true);
    await lookupAndCheckIn(manualCode.trim(), { resumeCamera: false });
    setManualCode("");
    setManualBusy(false);
  };

  // Client-Side Firebase Transaction for safe Check-In
  const lookupAndCheckIn = async (rawValue, { resumeCamera }) => {
    try {
      const ticketsQuery = query(ref(database, "tickets"), orderByChild("eventId"), equalTo(eventId));
      const ticketsSnap = await get(ticketsQuery);
      
      if (!ticketsSnap.exists()) {
        showResult("error", "Invalid Ticket", null, resumeCamera);
        return;
      }

      const allTickets = Object.entries(ticketsSnap.val()).map(([id, t]) => ({ id, ...t }));
      const needle = rawValue.trim();
      const ticket = allTickets.find(
        (t) => t.token === needle || t.transactionId === needle || t.id === needle
      );

      if (!ticket) {
        showResult("error", "Invalid Ticket", null, resumeCamera);
        return;
      }

      // Execute atomic transaction directly from React
      const ticketRef = ref(database, `tickets/${ticket.id}`);
      const transactionResult = await runTransaction(ticketRef, (currentData) => {
        // If ticket doesn't exist, abort
        if (currentData === null) return currentData;
        
        // If already checked in by someone else, abort transaction
        if (currentData.checkedIn === true) {
          return; // Returning undefined aborts the transaction
        }

        // Apply check-in
        currentData.checkedIn = true;
        currentData.checkedInAt = serverTimestamp();
        return currentData;
      });

      // If transaction was aborted, it means they are already checked in
      if (!transactionResult.committed) {
        // Fetch latest state to get the exact time it was used
        const freshSnap = await get(ticketRef);
        const freshData = freshSnap.val();
        showResult("already", `Already checked in at ${freshData?.checkedInAt ? new Date(freshData.checkedInAt).toLocaleTimeString() : "earlier"}`, ticket, resumeCamera);
        return;
      }

      // Transaction successful
      setCheckedInCount((c) => c + (ticket.quantity || 1));
      showResult("success", "Check-in Successful!", ticket, resumeCamera);

      setScanHistory((prev) => [
        { name: ticket.name, type: ticket.ticketType, time: new Date().toLocaleTimeString(), status: "success" },
        ...prev.slice(0, 19),
      ]);
    } catch (err) {
      console.error(err);
      showResult("error", "Error verifying ticket", null, resumeCamera);
    }
  };

  const showResult = (type, message, ticket, resumeCamera = false) => {
    setScanResult(type);
    setScanMessage(message);
    setAttendeeInfo(ticket);
    playSound(type === "success" ? "success" : "error");
    vibrate(type === "success" ? "success" : "error");

    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    
    resultTimeoutRef.current = setTimeout(async () => {
      setScanResult(null);
      setScanMessage("");
      setAttendeeInfo(null);
      if (resumeCamera && html5QrRef.current) {
        try { await html5QrRef.current.resume(); } catch (e) {}
      }
    }, 3000);
  };

  const handleToggleTorch = async () => {
    try {
      const track = html5QrRef.current?.getRunningTrackCapabilities?.();
      if (track) {
        await html5QrRef.current.applyVideoConstraints({ advanced: [{ torch: !torchOn }] });
        setTorchOn(!torchOn);
      }
    } catch (e) {}
  };

const handleExit = async () => {
    if (resultTimeoutRef.current) clearTimeout(resultTimeoutRef.current);
    
    // BULLETPROOF TEARDOWN
    if (html5QrRef.current) {
      try {
        await html5QrRef.current.stop().catch(() => {});
      } catch (error) {
        // Safely ignore if it wasn't fully running
      }
      html5QrRef.current = null;
    }
    
    try {
      const auth = getAuth();
      await signOut(auth);
    } catch (e) {}

    setStep("login");
    setEventData(null);
    setEventId(null);
    setScanResult(null);
    setAccessCode("");
    setScanHistory([]);
    setScanMode("camera");
    setManualCode("");
  };

  if (step === "login") {
    return (
      <div style={styles.page}>
        <div style={styles.loginCard}>
          <div style={styles.heroBadge}>Check-in portal</div>
          <div style={styles.logo}>🎫</div>
          <h1 style={styles.title}>Event Check-In</h1>
          <p style={styles.subtitle}>Enter your event access code to begin scanning tickets.</p>
          <div style={styles.badgeRow}>
            <span style={styles.badge}>Fast scanning</span>
            <span style={styles.badge}>Live validation</span>
            <span style={styles.badge}>Attendance history</span>
          </div>

          <input
            style={styles.input}
            type="text"
            placeholder="e.g. EVT-4K92P"
            value={accessCode}
            onChange={(e) => setAccessCode(e.target.value.toUpperCase())}
            onKeyDown={(e) => e.key === "Enter" && handleStartScanner()}
            autoCapitalize="characters"
          />

          {codeError && <p style={styles.errorText}>{codeError}</p>}

          <button
            style={{ ...styles.btn, opacity: loading ? 0.7 : 1 }}
            onClick={handleStartScanner}
            disabled={loading}
          >
            {loading ? "Validating..." : "Start Scanner"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div style={styles.scanPage}>
      <div style={styles.scanHeader}>
        <div>
          <p style={styles.eventName}>{eventData?.title}</p>
          <p style={styles.scanCount}>✅ {checkedInCount} / {totalTickets} checked in</p>
        </div>
        <button style={styles.exitBtn} onClick={handleExit}>Exit</button>
      </div>

      <div style={styles.modeToggleRow}>
        <button
          style={{ ...styles.modeToggleBtn, ...(scanMode === "camera" ? styles.modeToggleBtnActive : {}) }}
          onClick={() => setScanMode("camera")}
        >
          📷 Camera
        </button>
        <button
          style={{ ...styles.modeToggleBtn, ...(scanMode === "manual" ? styles.modeToggleBtnActive : {}) }}
          onClick={() => setScanMode("manual")}
        >
          ⌨️ Ticket code
        </button>
      </div>

      <div style={styles.scannerWrapper}>
        {scanMode === "camera" ? (
          <div id="qr-reader" style={styles.qrReader} ref={scannerRef} />
        ) : (
          <form style={styles.manualEntryBox} onSubmit={handleManualSubmit}>
            <p style={styles.manualEntryLabel}>Enter the 7-character ticket code</p>
            <input
              style={styles.codeInput}
              type="text"
              inputMode="text"
              autoCapitalize="characters"
              autoComplete="off"
              autoCorrect="off"
              spellCheck="false"
              maxLength={7}
              placeholder="ABC23XY"
              value={manualCode}
              onChange={(e) => setManualCode(e.target.value.toUpperCase().slice(0, 7))}
              autoFocus
            />
            <p style={styles.manualEntryHint}>Order reference or old-style codes still work too.</p>
            <button
              type="submit"
              style={{ ...styles.btn, opacity: manualBusy || !manualCode.trim() ? 0.7 : 1 }}
              disabled={manualBusy || !manualCode.trim()}
            >
              {manualBusy ? "Checking..." : "Check in"}
            </button>
          </form>
        )}

        {scanResult && (
          <div style={{
            ...styles.resultOverlay,
            background: scanResult === "success" ? "rgba(0,159,21,0.95)" : "rgba(239,68,68,0.95)"
          }}>
            <div style={styles.resultIcon}>
              {scanResult === "success" ? "✅" : scanResult === "already" ? "⚠️" : "❌"}
            </div>
            <p style={styles.resultTitle}>
              {scanResult === "success" ? "CHECK-IN SUCCESSFUL" : scanResult === "already" ? "ALREADY USED" : "INVALID TICKET"}
            </p>
            {attendeeInfo && (
              <div style={styles.attendeeBox}>
                <p style={styles.attendeeName}>{attendeeInfo.name}</p>
                <p style={styles.attendeeDetail}>🎫 {attendeeInfo.ticketType} × {attendeeInfo.quantity || 1}</p>
              </div>
            )}
            <p style={styles.resultMessage}>{scanMessage}</p>
          </div>
        )}
      </div>

      {scanMode === "camera" && (
        <div style={styles.controls}>
          <button style={styles.controlBtn} onClick={handleToggleTorch}>
            {torchOn ? "🔦 Torch Off" : "🔦 Torch On"}
          </button>
        </div>
      )}

      {scanHistory.length > 0 && (
        <div style={styles.historySection}>
          <p style={styles.historyTitle}>Recent Scans</p>
          {scanHistory.slice(0, 5).map((h, i) => (
            <div key={i} style={styles.historyItem}>
              <span>{h.status === "success" ? "✅" : "❌"} {h.name}</span>
              <span style={{ color: "#94a3b8", fontSize: "0.8rem" }}>{h.time}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const styles = {
  page: { minHeight: "100vh", background: "radial-gradient(800px 220px at 50% 0%, rgba(16, 97, 43, 0.08), transparent 55%), linear-gradient(180deg, #f7fbf7 0%, #eff7ee 100%)", display: "flex", alignItems: "center", justifyContent: "center", padding: "1rem" },
  loginCard: { background: "var(--surface)", padding: "2rem", width: "100%", maxWidth: "430px", textAlign: "center", border: "1px solid #dcead8", boxShadow: "0 18px 40px rgba(16, 97, 43, 0.08)" },
  heroBadge: { display: "inline-flex", marginBottom: "0.65rem", padding: "5px 10px", borderRadius: "999px", background: "#e7f6eb", color: "#10612B", fontSize: "0.75rem", fontWeight: 700, letterSpacing: "0.04em", textTransform: "uppercase" },
  logo: { fontSize: "2.4rem", marginBottom: "0.25rem" },
  title: { color: "var(--text-primary)", fontWeight: 800, margin: "0 0 0.4rem" },
  subtitle: { color: "#4f6b57", fontSize: "0.95rem", marginBottom: "1rem", lineHeight: 1.6 },
  badgeRow: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginBottom: "1rem" },
  badge: { display: "inline-flex", alignItems: "center", padding: "5px 10px", borderRadius: "999px", border: "1px solid #d6eedb", background: "var(--surface)", color: "#2b6b4d", fontSize: "0.78rem", fontWeight: 600 },
  input: { width: "100%", padding: "0.85rem 1rem", borderRadius: "12px", border: "1px solid #dbe2ee", background: "var(--surface)", color: "var(--text-primary)", textAlign: "center", letterSpacing: "0.12em", boxSizing: "border-box", marginBottom: "0.75rem", outline: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)" },
  errorText: { color: "#fca5a5", fontSize: "0.9rem", marginBottom: "0.75rem" },
  codeInput: { width: "100%", padding: "0.9rem 1rem", borderRadius: "12px", border: "1px solid #dbe2ee", background: "var(--surface)", color: "var(--text-primary)", fontWeight: 700, fontFamily: "monospace", textAlign: "center", letterSpacing: "0.3em", boxSizing: "border-box", marginBottom: "0.5rem", outline: "none", boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)" },
  manualEntryHint: { color: "#a8c9b1", fontSize: "0.78rem", textAlign: "center", marginBottom: "0.75rem" },
  modeToggleRow: { display: "flex", gap: "8px", padding: "0 1rem", marginBottom: "0.75rem" },
  modeToggleBtn: { flex: 1, padding: "0.65rem", borderRadius: "10px", border: "1px solid rgba(95, 224, 128, 0.14)", background: "rgba(255,255,255,0.04)", color: "#d9eadf", fontSize: "0.9rem", fontWeight: 600, cursor: "pointer" },
  modeToggleBtnActive: { background: "linear-gradient(135deg, #10612B, #1F7A47)", color: "#fff", border: "1px solid transparent" },
  manualEntryBox: { display: "flex", flexDirection: "column", padding: "1.5rem", background: "rgba(255,255,255,0.04)", borderRadius: "16px", border: "1px solid rgba(95, 224, 128, 0.14)" },
  manualEntryLabel: { color: "#cde7d4", fontSize: "0.9rem", marginBottom: "0.75rem", textAlign: "center" },
  btn: { width: "100%", padding: "0.9rem", background: "linear-gradient(135deg, #10612B, #1F7A47)", color: "#fff", border: "none", borderRadius: "12px", fontSize: "1rem", fontWeight: 700, cursor: "pointer", boxShadow: "0 10px 22px rgba(16, 97, 43, 0.24)" },
  scanPage: { minHeight: "100vh", background: "radial-gradient(800px 220px at 50% 0%, rgba(46, 224, 111, 0.1), transparent 55%), linear-gradient(180deg, #04140b 0%, #081b10 100%)", color: "#f4fff5", padding: "1rem" },
  scanHeader: { display: "flex", justifyContent: "space-between", alignItems: "center", padding: "1rem 1.25rem", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(95, 224, 128, 0.14)", borderRadius: "16px", boxShadow: "0 12px 28px rgba(0, 0, 0, 0.22)", marginBottom: "1rem" },
  eventName: { color: "#f4fff5", fontWeight: 800, fontSize: "1.05rem", margin: 0 },
  scanCount: { color: "#cde7d4", fontSize: "0.85rem", margin: "4px 0 0", fontWeight: 600 },
  exitBtn: { background: "rgba(255,255,255,0.04)", color: "#f4fff5", border: "1px solid rgba(95, 224, 128, 0.14)", borderRadius: "10px", padding: "8px 14px", cursor: "pointer", fontWeight: 700 },
  scannerWrapper: { position: "relative", width: "100%", maxWidth: "760px", margin: "0 auto", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(95, 224, 128, 0.14)", borderRadius: "18px", padding: "1rem", boxShadow: "0 12px 28px rgba(0, 0, 0, 0.22)" },
  qrReader: { width: "100%" },
  resultOverlay: { position: "absolute", top: 0, left: 0, right: 0, bottom: 0, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", zIndex: 10, padding: "2rem" },
  resultIcon: { fontSize: "4rem", marginBottom: "0.5rem" },
  resultTitle: { color: "#fff", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1rem", textAlign: "center" },
  attendeeBox: { background: "rgba(255,255,255,0.1)", borderRadius: "12px", padding: "1rem 2rem", marginBottom: "0.75rem", textAlign: "center" },
  attendeeName: { color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "0 0 0.25rem" },
  attendeeDetail: { color: "rgba(255,255,255,0.85)", fontSize: "1rem", margin: 0 },
  resultMessage: { color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", textAlign: "center" },
  controls: { display: "flex", justifyContent: "center", gap: "1rem", padding: "1rem 0" },
  controlBtn: { background: "rgba(255,255,255,0.04)", color: "#f4fff5", border: "1px solid rgba(95, 224, 128, 0.14)", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 },
  historySection: { padding: "0 1.25rem 1.25rem" },
  historyTitle: { color: "#cde7d4", fontSize: "0.85rem", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" },
  historyItem: { display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid rgba(95, 224, 128, 0.12)", color: "#f4fff5", fontSize: "0.9rem" }
};

export default CheckInPage;
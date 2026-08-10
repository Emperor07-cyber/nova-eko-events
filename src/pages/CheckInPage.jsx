import React, { useEffect, useRef, useState } from "react";
import { ref, get, update } from "firebase/database";
import { database } from "../firebase/firebaseConfig";
import { Html5Qrcode } from "html5-qrcode";

const CheckInPage = () => {
  const [step, setStep] = useState("login"); // login | scanning | result
  const [accessCode, setAccessCode] = useState("");
  const [codeError, setCodeError] = useState("");
  const [eventData, setEventData] = useState(null);
  const [eventId, setEventId] = useState(null);
  const [scanResult, setScanResult] = useState(null); // null | success | error
  const [scanMessage, setScanMessage] = useState("");
  const [attendeeInfo, setAttendeeInfo] = useState(null);
  const [checkedInCount, setCheckedInCount] = useState(0);
  const [totalTickets, setTotalTickets] = useState(0);
  const [torchOn, setTorchOn] = useState(false);
  const [scanHistory, setScanHistory] = useState([]);
  const [loading, setLoading] = useState(false);
  const scannerRef = useRef(null);
  const html5QrRef = useRef(null);
  const resultTimeoutRef = useRef(null);

  // Play sound
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

  // Vibrate
  const vibrate = (type) => {
    if (!navigator.vibrate) return;
    if (type === "success") navigator.vibrate([100, 50, 100]);
    else navigator.vibrate([300, 100, 300]);
  };

  // Validate access code
  const handleStartScanner = async () => {
    if (!accessCode.trim()) {
      setCodeError("Please enter an access code.");
      return;
    }
    setLoading(true);
    setCodeError("");
    try {
      const eventsRef = ref(database, "events");
      const snapshot = await get(eventsRef);
      if (!snapshot.exists()) {
        setCodeError("Invalid Access Code.");
        setLoading(false);
        return;
      }
      const events = snapshot.val();
      const match = Object.entries(events).find(
        ([, ev]) => ev.scannerCode?.toUpperCase() === accessCode.trim().toUpperCase()
      );
      if (!match) {
        setCodeError("Invalid Access Code.");
        setLoading(false);
        return;
      }
      const [id, ev] = match;
      setEventId(id);
      setEventData(ev);
      // Count tickets
      const ticketsSnap = await get(ref(database, "tickets"));
      if (ticketsSnap.exists()) {
        const allTickets = Object.entries(ticketsSnap.val())
          .map(([tid, t]) => ({ id: tid, ...t }))
          .filter((t) => t.eventId === id);
        const totalQty = allTickets.reduce((sum, t) => sum + (t.quantity || 1), 0);
        const checkedIn = allTickets.filter((t) => t.checkedIn).reduce((sum, t) => sum + (t.quantity || 1), 0);
        setTotalTickets(totalQty);
        setCheckedInCount(checkedIn);
      }
      setStep("scanning");
      setLoading(false);
    } catch (err) {
      setCodeError("Something went wrong. Try again.");
      setLoading(false);
    }
  };

  // Start QR scanner
  useEffect(() => {
    if (step !== "scanning") return;
    const startScanner = async () => {
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
    setTimeout(startScanner, 500);
    return () => {
      if (html5QrRef.current) {
        html5QrRef.current.stop().catch(() => {});
      }
    };
  }, [step]);

  // Handle QR scan result
  const handleScan = async (decodedText) => {
    if (scanResult) return; // prevent double scan
    // Stop scanner briefly
    if (html5QrRef.current) {
      await html5QrRef.current.pause();
    }

    try {
      // Find ticket by token
      const ticketsSnap = await get(ref(database, "tickets"));
      if (!ticketsSnap.exists()) {
        showResult("error", "Invalid Ticket", null);
        return;
      }

      const allTickets = Object.entries(ticketsSnap.val()).map(([id, t]) => ({ id, ...t }));
      const ticket = allTickets.find((t) => t.token === decodedText);

      if (!ticket) {
        showResult("error", "Invalid Ticket", null);
        return;
      }

      if (ticket.eventId !== eventId) {
        showResult("error", "Ticket is for a different event", null);
        return;
      }

      if (ticket.checkedIn) {
        showResult("already", `Already checked in at ${new Date(ticket.checkedInAt).toLocaleTimeString()}`, ticket);
        return;
      }

      // Mark as checked in
      await update(ref(database, `tickets/${ticket.id}`), {
        checkedIn: true,
        checkedInAt: Date.now(),
      });

      setCheckedInCount((c) => c + (ticket.quantity || 1));
      showResult("success", "Check-in Successful!", ticket);

      // Add to history
      setScanHistory((prev) => [
        { name: ticket.name, type: ticket.ticketType, time: new Date().toLocaleTimeString(), status: "success" },
        ...prev.slice(0, 19),
      ]);
    } catch (err) {
      showResult("error", "Error verifying ticket", null);
    }
  };

  const showResult = (type, message, ticket) => {
    setScanResult(type);
    setScanMessage(message);
    setAttendeeInfo(ticket);
    playSound(type === "success" ? "success" : "error");
    vibrate(type === "success" ? "success" : "error");

    // Auto-dismiss after 3 seconds and resume scanning
    resultTimeoutRef.current = setTimeout(async () => {
      setScanResult(null);
      setScanMessage("");
      setAttendeeInfo(null);
      if (html5QrRef.current) {
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
    if (html5QrRef.current) {
      await html5QrRef.current.stop().catch(() => {});
    }
    setStep("login");
    setEventData(null);
    setEventId(null);
    setScanResult(null);
    setAccessCode("");
    setScanHistory([]);
  };

  // ── LOGIN SCREEN ──
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

  // ── SCANNING SCREEN ──
  return (
    <div style={styles.scanPage}>
      {/* Header */}
      <div style={styles.scanHeader}>
        <div>
          <p style={styles.eventName}>{eventData?.title}</p>
          <p style={styles.scanCount}>✅ {checkedInCount} / {totalTickets} checked in</p>
        </div>
        <button style={styles.exitBtn} onClick={handleExit}>Exit</button>
      </div>

      {/* Scanner */}
      <div style={styles.scannerWrapper}>
        <div id="qr-reader" style={styles.qrReader} ref={scannerRef} />

        {/* Overlay result */}
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

      {/* Controls */}
      <div style={styles.controls}>
        <button style={styles.controlBtn} onClick={handleToggleTorch}>
          {torchOn ? "🔦 Torch Off" : "🔦 Torch On"}
        </button>
      </div>

      {/* Scan History */}
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
  page: {
    minHeight: "100vh",
    background:
      "radial-gradient(800px 220px at 50% 0%, rgba(16, 97, 43, 0.08), transparent 55%), linear-gradient(180deg, #f7fbf7 0%, #eff7ee 100%)",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    padding: "1rem",
  },
  loginCard: {
    background: "#ffffff",
    borderRadius: "18px",
    padding: "2rem",
    width: "100%",
    maxWidth: "430px",
    textAlign: "center",
    border: "1px solid #dcead8",
    boxShadow: "0 18px 40px rgba(16, 97, 43, 0.08)",
  },
  heroBadge: {
    display: "inline-flex",
    marginBottom: "0.65rem",
    padding: "5px 10px",
    borderRadius: "999px",
    background: "#e7f6eb",
    color: "#10612B",
    fontSize: "0.75rem",
    fontWeight: 700,
    letterSpacing: "0.04em",
    textTransform: "uppercase",
  },
  logo: { fontSize: "2.4rem", marginBottom: "0.25rem" },
  title: { color: "#111827", fontSize: "1.8rem", fontWeight: 800, margin: "0 0 0.4rem" },
  subtitle: { color: "#4f6b57", fontSize: "0.95rem", marginBottom: "1rem", lineHeight: 1.6 },
  badgeRow: { display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "8px", marginBottom: "1rem" },
  badge: {
    display: "inline-flex",
    alignItems: "center",
    padding: "5px 10px",
    borderRadius: "999px",
    border: "1px solid #d6eedb",
    background: "#fff",
    color: "#2b6b4d",
    fontSize: "0.78rem",
    fontWeight: 600,
  },
  input: {
    width: "100%",
    padding: "0.85rem 1rem",
    borderRadius: "12px",
    border: "1px solid #dbe2ee",
    background: "#fff",
    color: "#111827",
    fontSize: "1rem",
    textAlign: "center",
    letterSpacing: "0.12em",
    boxSizing: "border-box",
    marginBottom: "0.75rem",
    outline: "none",
    boxShadow: "inset 0 1px 0 rgba(255,255,255,0.7)",
  },
  errorText: { color: "#dc2626", fontSize: "0.9rem", marginBottom: "0.75rem" },
  btn: {
    width: "100%",
    padding: "0.9rem",
    background: "linear-gradient(135deg, #10612B, #1F7A47)",
    color: "#fff",
    border: "none",
    borderRadius: "12px",
    fontSize: "1rem",
    fontWeight: 700,
    cursor: "pointer",
    boxShadow: "0 10px 22px rgba(16, 97, 43, 0.24)",
  },
  scanPage: {
    minHeight: "100vh",
    background:
      "radial-gradient(800px 220px at 50% 0%, rgba(16, 97, 43, 0.08), transparent 55%), linear-gradient(180deg, #f7fbf7 0%, #eff7ee 100%)",
    color: "#111827",
    padding: "1rem",
  },
  scanHeader: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "1rem 1.25rem",
    background: "#ffffff",
    border: "1px solid #dcead8",
    borderRadius: "16px",
    boxShadow: "0 12px 28px rgba(16, 97, 43, 0.08)",
    marginBottom: "1rem",
  },
  eventName: { color: "#111827", fontWeight: 800, fontSize: "1.05rem", margin: 0 },
  scanCount: { color: "#10612B", fontSize: "0.85rem", margin: "4px 0 0", fontWeight: 600 },
  exitBtn: {
    background: "#fff",
    color: "#10612B",
    border: "1px solid #b7e0bf",
    borderRadius: "10px",
    padding: "8px 14px",
    cursor: "pointer",
    fontWeight: 700,
  },
  scannerWrapper: {
    position: "relative",
    width: "100%",
    maxWidth: "760px",
    margin: "0 auto",
    background: "#fff",
    border: "1px solid #d6eedb",
    borderRadius: "18px",
    padding: "1rem",
    boxShadow: "0 12px 28px rgba(16, 97, 43, 0.08)",
  },
  qrReader: { width: "100%" },
  resultOverlay: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    display: "flex",
    flexDirection: "column",
    alignItems: "center",
    justifyContent: "center",
    zIndex: 10,
    padding: "2rem",
  },
  resultIcon: { fontSize: "4rem", marginBottom: "0.5rem" },
  resultTitle: { color: "#fff", fontSize: "1.5rem", fontWeight: 800, margin: "0 0 1rem", textAlign: "center" },
  attendeeBox: { background: "rgba(255,255,255,0.15)", borderRadius: "12px", padding: "1rem 2rem", marginBottom: "0.75rem", textAlign: "center" },
  attendeeName: { color: "#fff", fontSize: "1.3rem", fontWeight: 700, margin: "0 0 0.25rem" },
  attendeeDetail: { color: "rgba(255,255,255,0.85)", fontSize: "1rem", margin: 0 },
  resultMessage: { color: "rgba(255,255,255,0.8)", fontSize: "0.9rem", textAlign: "center" },
  controls: { display: "flex", justifyContent: "center", gap: "1rem", padding: "1rem 0" },
  controlBtn: { background: "#fff", color: "#111827", border: "1px solid #dbe2ee", borderRadius: "10px", padding: "8px 16px", cursor: "pointer", fontSize: "0.9rem", fontWeight: 600 },
  historySection: { padding: "0 1.25rem 1.25rem" },
  historyTitle: { color: "#64748b", fontSize: "0.85rem", marginBottom: "0.5rem", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.04em" },
  historyItem: { display: "flex", justifyContent: "space-between", padding: "0.75rem 0", borderBottom: "1px solid #eef7f0", color: "#111827", fontSize: "0.9rem" },
};

export default CheckInPage;

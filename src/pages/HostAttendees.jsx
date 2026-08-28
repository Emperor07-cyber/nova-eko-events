import React, { useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { auth, database } from "../firebase/firebaseConfig";
import HostLayout from "../components/Layout/HostLayout";

const HostAttendees = () => {
  const [user] = useAuthState(auth);
  const [events, setEvents] = useState([]);
  const [tickets, setTickets] = useState([]);
  const [expandedEventId, setExpandedEventId] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const eventsRef = ref(database, "events");
    const ticketsRef = ref(database, "tickets");

    const unsubscribeEvents = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const userEvents = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .filter((event) => event.createdBy?.toLowerCase() === user.email?.toLowerCase());
      setEvents(userEvents);
    });

    const unsubscribeTickets = onValue(ticketsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const allTickets = Object.entries(data).map(([id, value]) => ({ id, ...value }));
      setTickets(allTickets);
    });

    return () => {
      unsubscribeEvents();
      unsubscribeTickets();
    };
  }, [user]);

  const attendanceSummary = useMemo(() => {
    return events.map((event) => {
      const eventTickets = tickets.filter((ticket) => ticket.eventId === event.id);
      const attendees = new Set(eventTickets.map((ticket) => ticket.email)).size;
      const totalTickets = eventTickets.reduce((sum, ticket) => sum + (ticket.quantity || 1), 0);
      const checkedInCount = eventTickets
        .filter((ticket) => ticket.checkedIn)
        .reduce((sum, ticket) => sum + (ticket.quantity || 1), 0);
      const revenue = eventTickets.reduce((sum, ticket) => sum + (ticket.totalPaid || 0), 0);

      return {
        event,
        attendees,
        totalTickets,
        checkedInCount,
        revenue,
      };
    });
  }, [events, tickets]);

  const totals = useMemo(() => {
    const totalEvents = events.length;
    const totalAttendees = attendanceSummary.reduce((sum, item) => sum + item.attendees, 0);
    const totalTicketCount = attendanceSummary.reduce((sum, item) => sum + item.totalTickets, 0);
    const totalCheckedIn = attendanceSummary.reduce((sum, item) => sum + item.checkedInCount, 0);
    return { totalEvents, totalAttendees, totalTicketCount, totalCheckedIn };
  }, [attendanceSummary, events.length]);

  return (
    <HostLayout>
      <div className="section-header">
        <div>
          <h2 className="section-title">Attendees</h2>
          <p className="section-subtitle">
            Review your event attendance and check-in performance in one place.
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/host/checkin")}>Start Check-In</button>
      </div>

      <div className="summary-cards host-kpis">
        <div className="summary-card">
          <p className="summary-value">{totals.totalEvents}</p>
          <p className="summary-label">Events with Attendees</p>
        </div>
        <div className="summary-card">
          <p className="summary-value">{totals.totalAttendees}</p>
          <p className="summary-label">Unique Attendees</p>
        </div>
        <div className="summary-card">
          <p className="summary-value">{totals.totalTicketCount}</p>
          <p className="summary-label">Tickets Sold</p>
        </div>
        <div className="summary-card">
          <p className="summary-value">{totals.totalCheckedIn}</p>
          <p className="summary-label">Checked In</p>
        </div>
      </div>

      <div className="section-header">
        <h3 className="section-title">Event Attendance</h3>
      </div>

      <div className="table-wrapper">
        <table className="host-table host-table-stacked">
          <thead>
            <tr>
              <th>Event</th>
              <th>Tickets Sold</th>
              <th>Unique Attendees</th>
              <th>Checked In</th>
              <th>Revenue</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {attendanceSummary.length === 0 ? (
              <tr>
                <td colSpan={6} className="table-empty">
                  No attendance data yet. Create an event and sell tickets to get started.
                </td>
              </tr>
            ) : (
              attendanceSummary.map(({ event, totalTickets, attendees, checkedInCount, revenue }) => {
                const isExpanded = expandedEventId === event.id;
                const eventTickets = tickets.filter((ticket) => ticket.eventId === event.id);
                return (
                  <React.Fragment key={event.id}>
                    <tr>
                      <td data-label="Event">{event.title}</td>
                      <td data-label="Tickets Sold">{totalTickets}</td>
                      <td data-label="Unique Attendees">{attendees}</td>
                      <td data-label="Checked In">{checkedInCount}</td>
                      <td data-label="Revenue">₦{revenue.toLocaleString()}</td>
                      <td data-label="Action">
                        <button
                          className="btn-copy-link"
                          onClick={() => setExpandedEventId(isExpanded ? null : event.id)}
                          style={{ marginRight: 8 }}
                        >
                          {isExpanded ? "Hide Buyers" : "View Buyers"}
                        </button>
                        <button className="btn-copy-link" onClick={() => navigate(`/event/edit/${event.id}`)}>
                          Manage
                        </button>
                      </td>
                    </tr>
                    {isExpanded ? (
                      <tr>
                        <td colSpan={6} style={{ padding: 0 }}>
                          <div className="table-wrapper" style={{ margin: "8px 0 16px" }}>
                            <table className="host-table host-table-stacked">
                              <thead>
                                <tr>
                                  <th>Name</th>
                                  <th>Email</th>
                                  <th>Ticket Type</th>
                                  <th>Quantity</th>
                                  <th>Amount Paid</th>
                                  <th>Checked In</th>
                                </tr>
                              </thead>
                              <tbody>
                                {eventTickets.length === 0 ? (
                                  <tr>
                                    <td colSpan={6} className="table-empty">No buyers yet for this event.</td>
                                  </tr>
                                ) : (
                                  eventTickets.map((ticket) => (
                                    <tr key={ticket.id}>
                                      <td data-label="Name">{ticket.name || "—"}</td>
                                      <td data-label="Email">{ticket.email || "—"}</td>
                                      <td data-label="Ticket Type">{ticket.ticketType || "—"}</td>
                                      <td data-label="Quantity">{ticket.quantity || 1}</td>
                                      <td data-label="Amount Paid">₦{Number(ticket.totalPaid || 0).toLocaleString()}</td>
                                      <td data-label="Checked In">{ticket.checkedIn ? "Yes" : "No"}</td>
                                    </tr>
                                  ))
                                )}
                              </tbody>
                            </table>
                          </div>
                        </td>
                      </tr>
                    ) : null}
                  </React.Fragment>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </HostLayout>
  );
};

export default HostAttendees;
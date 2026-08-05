import React, { useEffect, useMemo, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import { ref, onValue } from "firebase/database";
import { auth, database } from "../firebase/firebaseConfig";
import HostLayout from "../components/Layout/HostLayout";

const HostMerch = () => {
  const [user] = useAuthState(auth);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const eventsRef = ref(database, "events");
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const userEvents = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .filter((event) => event.createdBy?.toLowerCase() === user.email?.toLowerCase());
      setEvents(userEvents);
    });

    return () => unsubscribe();
  }, [user]);

  const merchItems = useMemo(() => {
    return events.flatMap((event) => {
      const items = Array.isArray(event.merch) ? event.merch : [];
      return items
        .filter((item) => item?.name?.trim())
        .map((item) => ({
          ...item,
          eventTitle: event.title,
          eventId: event.id,
        }));
    });
  }, [events]);

  const totalMerch = merchItems.length;
  const totalEventsWithMerch = new Set(merchItems.map((item) => item.eventId)).size;

  return (
    <HostLayout>
      <div className="section-header">
        <div>
          <h2 className="section-title">Merchandise</h2>
          <p className="section-subtitle">
            Keep track of merch items attached to your events and update stock as needed.
          </p>
        </div>
        <button className="btn-primary" onClick={() => navigate("/event/new")}>Add Merch</button>
      </div>

      <div className="summary-cards host-kpis">
        <div className="summary-card">
          <p className="summary-value">{totalMerch}</p>
          <p className="summary-label">Merch Items</p>
        </div>
        <div className="summary-card">
          <p className="summary-value">{totalEventsWithMerch}</p>
          <p className="summary-label">Events with Merch</p>
        </div>
      </div>

      <div className="section-header">
        <h3 className="section-title">Merch List</h3>
      </div>

      <div className="table-wrapper">
        <table className="host-table host-table-stacked">
          <thead>
            <tr>
              <th>Item</th>
              <th>Price</th>
              <th>Stock</th>
              <th>Event</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {merchItems.length === 0 ? (
              <tr>
                <td colSpan={5} className="table-empty">
                  No merchandise items found. Add merch when editing an event.
                </td>
              </tr>
            ) : (
              merchItems.map((item, index) => (
                <tr key={`${item.eventId}-${index}`}>
                  <td data-label="Item">{item.name}</td>
                  <td data-label="Price">₦{Number(item.price || 0).toLocaleString()}</td>
                  <td data-label="Stock">{item.stock || "Unlimited"}</td>
                  <td data-label="Event">{item.eventTitle}</td>
                  <td data-label="Action">
                    <button className="btn-copy-link" onClick={() => navigate(`/event/edit/${item.eventId}`)}>
                      Update
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </HostLayout>
  );
};

export default HostMerch;

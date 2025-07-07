import React, { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { ref, get, update } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, database } from "../../firebase/firebaseConfig";

const EditEvent = () => {
  const { eventId } = useParams();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [userRole, setUserRole] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      const userRef = ref(database, "users/" + user.uid);
      const userSnap = await get(userRef);
      const userInfo = userSnap.val();
      setUserRole(userInfo?.role || "user");

      const eventRef = ref(database, "events/" + eventId);
      const eventSnap = await get(eventRef);
      const event = eventSnap.val();

      if (!event) {
        setUnauthorized(true);
        return;
      }

      const isOwner = event.createdBy === user.email;
      const isAdmin = userInfo?.role === "admin";

      if (isOwner || isAdmin) {
        setEventData(event);
      } else {
        setUnauthorized(true);
      }

      setLoading(false);
    };

    fetchData();
  }, [user, eventId]);

  if (!user || loading) return <div>Loading...</div>;
  if (unauthorized) return <Navigate to="/unauthorized" replace />;

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleTogglePaid = () => {
    setEventData((prev) => ({ ...prev, isPaid: !prev.isPaid }));
  };

  const handleTicketChange = (index, field, value) => {
    const updated = [...eventData.tickets];
    updated[index][field] = value;
    setEventData({ ...eventData, tickets: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventRef = ref(database, "events/" + eventId);
      await update(eventRef, eventData);
      alert("✅ Event updated successfully!");
      navigate("/host/dashboard");
    } catch (error) {
      alert("❌ Failed to update event: " + error.message);
    }
  };

  return (
    <div className="event-form-container">
      <h2>Edit Event</h2>
      <form onSubmit={handleSubmit}>
        <label>
          <input
            type="checkbox"
            checked={!eventData.isPaid}
            onChange={handleTogglePaid}
          />
          This is a free event
        </label>

        <input
          name="title"
          placeholder="Event Title"
          value={eventData.title || ""}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={eventData.description || ""}
          onChange={handleChange}
          required
        />
        <input
          name="date"
          type="date"
          value={eventData.date || ""}
          onChange={handleChange}
          required
        />
        <input
          name="startTime"
          type="time"
          value={eventData.startTime || ""}
          onChange={handleChange}
          required
        />
        <input
          name="endTime"
          type="time"
          value={eventData.endTime || ""}
          onChange={handleChange}
          required
        />
        <input
          name="location"
          placeholder="Location"
          value={eventData.location || ""}
          onChange={handleChange}
          required
        />
        <input
          name="category"
          placeholder="Category"
          value={eventData.category || ""}
          onChange={handleChange}
        />
        <input
          name="maxPurchaseLimit"
          type="number"
          placeholder="Max tickets per person"
          value={eventData.maxPurchaseLimit || 1}
          onChange={handleChange}
        />

        <div className="ticket-types">
          <label>Ticket Types:</label>
          {eventData.tickets?.map((ticket, index) => (
            <div key={index} className="ticket-row">
              <input
                type="text"
                placeholder="Type"
                value={ticket.type || ""}
                onChange={(e) => handleTicketChange(index, "type", e.target.value)}
              />
              <input
                type="number"
                placeholder="Price"
                value={ticket.price || ""}
                onChange={(e) => handleTicketChange(index, "price", e.target.value)}
              />
              <input
                type="number"
                placeholder="Limit"
                value={ticket.limit || ""}
                onChange={(e) => handleTicketChange(index, "limit", e.target.value)}
              />
            </div>
          ))}
        </div>

        <button type="submit">Update Event</button>
      </form>
    </div>
  );
};

export default EditEvent;

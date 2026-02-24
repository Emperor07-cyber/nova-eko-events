import React, { useEffect, useState } from "react";
import { useParams, Navigate, useNavigate } from "react-router-dom";
import { ref, get, update } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, database } from "../../firebase/firebaseConfig";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { toast } from "react-toastify";

const EditEvent = () => {
  const { eventId } = useParams();
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [eventData, setEventData] = useState(null);
  const [unauthorized, setUnauthorized] = useState(false);
  const [loading, setLoading] = useState(true);
  const [imageUploading, setImageUploading] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const userSnap = await get(ref(database, "users/" + user.uid));
        const userInfo = userSnap.val();

        const eventSnap = await get(ref(database, "events/" + eventId));
        const event = eventSnap.val();

        if (!event) {
          setUnauthorized(true);
          setLoading(false);
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
      } catch (error) {
        console.error(error);
        setLoading(false);
      }
    };

    fetchData();
  }, [user, eventId]);

  if (!user || loading) return <div>Loading...</div>;
  if (unauthorized) return <Navigate to="/unauthorized" replace />;

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setImageUploading(true);

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", "nova-eko-events");

    try {
      const res = await fetch("https://api.cloudinary.com/v1_1/dkse7snw2/image/upload", {
        method: "POST",
        body: form,
      });
      const data = await res.json();

      if (data.secure_url) {
        setEventData((prev) => ({ ...prev, image: data.secure_url }));
        toast.success("Image uploaded successfully!");
      } else {
        toast.error("Image upload failed. Please try again.");
      }
    } catch (err) {
      console.error(err);
      toast.error("Image upload failed. Please try again.");
    } finally {
      setImageUploading(false);
    }
  };

  const handleTogglePaid = () => {
    setEventData((prev) => ({ ...prev, isPaid: !prev.isPaid }));
  };

  const handleTicketChange = (index, field, value) => {
    const updated = [...eventData.tickets];
    updated[index][field] = value;
    setEventData({ ...eventData, tickets: updated });
  };

  const handleAddTicket = () => {
    setEventData((prev) => ({
      ...prev,
      tickets: [...(prev.tickets || []), { type: "", price: "", limit: "" }],
    }));
  };

  const handleRemoveTicket = (index) => {
    const updated = eventData.tickets.filter((_, i) => i !== index);
    setEventData({ ...eventData, tickets: updated });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const eventRef = ref(database, "events/" + eventId);
      await update(eventRef, eventData);
      toast.success("✅ Event updated successfully!");
      navigate("/host/dashboard");
    } catch (error) {
      toast.error("❌ Failed to update event: " + error.message);
    }
  };

  return (
    <>
      <Header />
      <div className="event-form-container">
        <h2>Edit Event</h2>
        <form onSubmit={handleSubmit}>

          <label>
            <input
              type="checkbox"
              checked={!eventData.isPaid}
              onChange={handleTogglePaid}
            />
            {" "}This is a free event
          </label>

          <label>
            <h4>Event Title</h4>
            <input
              name="title"
              placeholder="Event Title"
              value={eventData.title || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <h4>Event Description</h4>
            <textarea
              name="description"
              placeholder="Description"
              value={eventData.description || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <h4>Event Date</h4>
            <input
              name="date"
              type="date"
              value={eventData.date || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <h4>Start Time</h4>
            <input
              name="startTime"
              type="time"
              value={eventData.startTime || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <h4>End Time</h4>
            <input
              name="endTime"
              type="time"
              value={eventData.endTime || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <h4>Location</h4>
            <input
              name="location"
              placeholder="Location"
              value={eventData.location || ""}
              onChange={handleChange}
              required
            />
          </label>

          <label>
            <h4>Event Category</h4>
            <select name="category" value={eventData.category || ""} onChange={handleChange}>
              <option value="">Select Category</option>
              <option value="Business">Business</option>
              <option value="Concert">Concert</option>
              <option value="Meetup">Meetup</option>
              <option value="Nightlife">Nightlife</option>
              <option value="Sports">Sports</option>
              <option value="Workshop">Workshop</option>
              <option value="Conference">Conference</option>
              <option value="Festival">Festival</option>
              <option value="Webinar">Webinar</option>
              <option value="Health">Health & Wellness</option>
              <option value="Education">Education</option>
              <option value="Charity">Charity</option>
              <option value="Other">Other</option>
            </select>
          </label>

          <label>
            <h4>Max Tickets Per User</h4>
            <input
              name="maxPurchaseLimit"
              type="number"
              placeholder="Max tickets per person"
              value={eventData.maxPurchaseLimit || 1}
              onChange={handleChange}
            />
          </label>

          {/* ── Image Upload ── */}
          <div className="image-upload-section">
            <h4>Event Image</h4>

            {/* Current image preview */}
            {eventData.image && (
              <div className="current-image-preview">
                <p style={{ fontSize: "0.85rem", color: "#64748b", marginBottom: "8px" }}>
                  Current image:
                </p>
                <img
                  src={eventData.image}
                  alt="Current event"
                  style={{
                    height: "200px",
                    width: "100%",
                    objectFit: "cover",
                    borderRadius: "8px",
                    marginBottom: "12px",
                    border: "1px solid #e5e7eb",
                  }}
                />
              </div>
            )}

            <label
              className="image-upload-label"
              style={{
                display: "block",
                padding: "12px",
                border: "2px dashed #d1d5db",
                borderRadius: "8px",
                textAlign: "center",
                cursor: "pointer",
                color: "#64748b",
                fontSize: "0.9rem",
                transition: "border-color 0.2s",
              }}
            >
              {imageUploading ? "⏳ Uploading image..." : "📷 Click to upload a new image"}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                disabled={imageUploading}
                style={{ display: "none" }}
              />
            </label>
          </div>

          {/* ── Ticket Types ── */}
          <div className="ticket-types">
            <h4>Ticket Types</h4>
            {eventData.tickets?.map((ticket, index) => (
              <div key={index} className="ticket-row">
                <input
                  type="text"
                  placeholder="Type (e.g. Regular)"
                  value={ticket.type || ""}
                  onChange={(e) => handleTicketChange(index, "type", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Price (₦)"
                  value={ticket.price || ""}
                  onChange={(e) => handleTicketChange(index, "price", e.target.value)}
                />
                <input
                  type="number"
                  placeholder="Limit"
                  value={ticket.limit || ""}
                  onChange={(e) => handleTicketChange(index, "limit", e.target.value)}
                />
                <button
                  type="button"
                  className="btn-delete"
                  onClick={() => handleRemoveTicket(index)}
                >
                  Remove
                </button>
              </div>
            ))}
            <button type="button" className="btn-edit" onClick={handleAddTicket}>
              + Add Ticket Type
            </button>
          </div>

          <button type="submit" disabled={imageUploading}>
            {imageUploading ? "Please wait..." : "Update Event"}
          </button>

        </form>
      </div>
      <Footer />
    </>
  );
};

export default EditEvent;
import React, { useState } from "react";
import { ref, push } from "firebase/database";
import { database, auth } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { ADMIN_EMAIL } from "../../constants";
import { useNavigate } from "react-router-dom";

function EventForm() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    price: "",
  });

  // Redirect non-admins
  if (user && user.email !== ADMIN_EMAIL) {
    navigate("/");
    return null;
  }

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await push(ref(database, "events"), {
        ...eventData,
        createdBy: user.email,
        timestamp: Date.now(),
      });
      alert("Event created successfully!");
      setEventData({
        title: "",
        description: "",
        date: "",
        location: "",
        price: "",
      });
    } catch (error) {
      alert("Failed to create event: " + error.message);
    }
  };

  return (
    <div className="event-form-container">
      <h2>Create New Event</h2>
      <form onSubmit={handleSubmit}>
        <input name="title" placeholder="Event Title" value={eventData.title} onChange={handleChange} required />
        <textarea name="description" placeholder="Description" value={eventData.description} onChange={handleChange} required />
        <input name="date" type="date" value={eventData.date} onChange={handleChange} required />
        <input name="location" placeholder="Location" value={eventData.location} onChange={handleChange} required />
        <input name="price" type="number" placeholder="Price (₦)" value={eventData.price} onChange={handleChange} required />
        <button type="submit">Create Event</button>
      </form>
    </div>
  );
}

export default EventForm;

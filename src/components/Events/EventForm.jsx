import React, { useState } from "react";
import { ref, push } from "firebase/database";
import { database, auth } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";
import Header from "../Layout/Header";
import Footer from "../Layout/Footer";
import { toast } from "react-toastify";

const EventForm = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    title: "",
    description: "",
    date: "",
    startTime: "",
    endTime: "",
    location: "",
    category: "",
    maxPerUser: 1,
    image: "",
    eventUrl: "", // ✅ added missing field
    tickets: [{ type: "Regular", price: "", perks: [] }],
  });

  const [error, setError] = useState("");
  const [showModal, setShowModal] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", "nova-eko-events");

    const res = await fetch("https://api.cloudinary.com/v1_1/dkse7snw2/image/upload", {
      method: "POST",
      body: form,
    });
    const data = await res.json();

    if (data.secure_url) {
      setFormData((prev) => ({ ...prev, image: data.secure_url }));
    } else {
      toast.error("Image upload failed. Please try again.");
    }
  };

  const handleTicketChange = (index, field, value) => {
    const updated = [...formData.tickets];
    updated[index][field] = value;
    setFormData((prev) => ({ ...prev, tickets: updated }));
  };

  const handleAddTicket = () => {
    setFormData((prev) => ({
      ...prev,
      tickets: [...prev.tickets, { type: "", price: "", perks: [] }],
    }));
  };

  const handleRemoveTicket = (index) => {
    const updated = formData.tickets.filter((_, i) => i !== index);
    setFormData((prev) => ({ ...prev, tickets: updated }));
  };

  const handlePerkChange = (ticketIndex, perkIndex, value) => {
    const updated = [...formData.tickets];
    updated[ticketIndex].perks[perkIndex] = value;
    setFormData((prev) => ({ ...prev, tickets: updated }));
  };

  const handleAddPerk = (ticketIndex) => {
    const updated = [...formData.tickets];
    updated[ticketIndex].perks.push("");
    setFormData((prev) => ({ ...prev, tickets: updated }));
  };

  const handleRemovePerk = (ticketIndex, perkIndex) => {
    const updated = [...formData.tickets];
    updated[ticketIndex].perks.splice(perkIndex, 1);
    setFormData((prev) => ({ ...prev, tickets: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const newEvent = {
        ...formData,
        createdBy: user?.email || "Unknown",
        timestamp: Date.now(),
      };

      await push(ref(database, "events"), newEvent);
      toast.success("Event created successfully!");

      if (user) {
        const snapshot = await (await import("firebase/database")).get(ref(database, "users/" + user.uid));
        const role = snapshot.val()?.role;

        if (role === "admin") navigate("/admin/dashboard");
        else navigate("/host/dashboard");
      }
    } catch (err) {
      console.error(err);
      setError("Something went wrong while saving your event.");
    }
  };

  return (
    <>
      <Header />
      <div className="event-form-container">
        <h2>Create New Event</h2>
        <form onSubmit={handleSubmit}>
          <label>
            Event Title
            <input name="title" value={formData.title} onChange={handleChange} required />
          </label>

          <label>
            Event Description
            <textarea name="description" value={formData.description} onChange={handleChange} />
          </label>

          <label>
            Event Date
            <input name="date" type="date" value={formData.date} onChange={handleChange} required />
          </label>

          <label>
            Start Time
            <input name="startTime" type="time" value={formData.startTime} onChange={handleChange} required />
          </label>

          <label>
            End Time
            <input name="endTime" type="time" value={formData.endTime} onChange={handleChange} required />
          </label>

          <label>
            Location
            <input name="location" value={formData.location} onChange={handleChange} required />
          </label>

          <label style={{ display: "flex", flexDirection: "column" }}>
            Event Category
            <select name="category" value={formData.category} onChange={handleChange}>
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
            Max tickets per user
            <input
              name="maxPerUser"
              type="number"
              value={formData.maxPerUser}
              min="1"
              onChange={handleChange}
            />
          </label>

          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {formData.image && <img src={formData.image} alt="Preview" style={{ height: "300px" }} />}

          <h3>Ticket Types</h3>
          {formData.tickets.map((ticket, i) => (
            <div key={i} className="ticket-type">
              <label>
                Type
                <input
                  value={ticket.type}
                  onChange={(e) => handleTicketChange(i, "type", e.target.value)}
                />
              </label>

              <label>
                Price
                <input
                  value={ticket.price}
                  onChange={(e) => handleTicketChange(i, "price", e.target.value)}
                />
              </label>

              <button type="button" onClick={() => handleRemoveTicket(i)}>
                Remove Ticket
              </button>

              <div className="perks">
                {ticket.perks.map((perk, j) => (
                  <div key={j}>
                    <label>
                      Perk
                      <input
                        value={perk}
                        onChange={(e) => handlePerkChange(i, j, e.target.value)}
                      />
                    </label>

                    <button
                      className="remove-perk"
                      type="button"
                      onClick={() => handleRemovePerk(i, j)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
                <button type="button" onClick={() => handleAddPerk(i)}>
                  Add Perk
                </button>
              </div>
            </div>
          ))}

          <button type="button" onClick={handleAddTicket}>
            Add Ticket Type
          </button>

          <label>
            Event Website (optional)
            <input
              name="eventUrl"
              style={{ width: "calc(100% - 100px)" }}
              value={(formData.eventUrl || "")
                .replace("https://www.ekotixx.com/", "")
                .replace("https://", "")}
              onChange={(e) => {
                const url = e.target.value;
                const newUrl = "https://www.ekotixx.com/" + url;
                setFormData({ ...formData, eventUrl: newUrl });
              }}
              placeholder="www.ekotixx.com/your-event"
            />
          </label>

          {formData.eventUrl && (
            <p style={{ fontSize: "0.9rem", color: "#555" }}>
              Final Link: <a href={formData.eventUrl} target="_blank" rel="noreferrer">{formData.eventUrl}</a>
            </p>
          )}

          <button type="button" onClick={() => setShowModal(true)}>
            Preview
          </button>

          {showModal && (
            <div
              className="modal"
              style={{
                position: "fixed",
                top: 0,
                left: 0,
                width: "100vw",
                height: "100vh",
                backgroundColor: "rgba(0,0,0,0.5)",
              }}
              onClick={() => setShowModal(false)}
            >
              <div
                className="modal-content"
                style={{
                  background: "white",
                  borderRadius: "8px",
                  padding: "20px",
                  position: "absolute",
                  top: "50%",
                  left: "50%",
                  transform: "translate(-50%, -50%)",
                  width: "90%",
                  maxWidth: "500px",
                }}
                onClick={(e) => e.stopPropagation()}
              >
                <h2>Preview</h2>
                <p>Title: {formData.title}</p>
                <p>Description: {formData.description}</p>
                <p>Date: {formData.date}</p>
                <p>Start Time: {formData.startTime}</p>
                <p>End Time: {formData.endTime}</p>
                <p>Location: {formData.location}</p>
                <p>Category: {formData.category}</p>
                <p>Max tickets per user: {formData.maxPerUser}</p>
                <p>Event Link: <a href={formData.eventUrl}>{formData.eventUrl}</a></p>
                <p>Tickets:</p>
                <ul>
                  {formData.tickets.map((ticket, i) => (
                    <li key={i}>
                      {ticket.type} - {ticket.price} (Perks: {ticket.perks.join(", ")})
                    </li>
                  ))}
                </ul>
                {formData.image && <img src={formData.image} alt="Preview" style={{ height: "200px" }} />}
                <button type="button" onClick={() => setShowModal(false)}>
                  Close
                </button>
              </div>
            </div>
          )}

          <p style={{ color: "red" }}>{error}</p>
          <button type="submit">Create Event</button>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default EventForm;

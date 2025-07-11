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
    tickets: [
      { type: "Regular", price: "", perks: [] }
    ],
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleImageUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const form = new FormData();
    form.append("file", file);
    form.append("upload_preset", "nova-eko-events"); // Replace
    const res = await fetch("https://api.cloudinary.com/v1_1/dkse7snw2/image/upload", {
      method: "POST",
      body: form,
    });
    const data = await res.json();
    setFormData(prev => ({ ...prev, image: data.secure_url }));
  };

  const handleTicketChange = (index, field, value) => {
    const updated = [...formData.tickets];
    updated[index][field] = value;
    setFormData(prev => ({ ...prev, tickets: updated }));
  };

  const handleAddTicket = () => {
    setFormData(prev => ({
      ...prev,
      tickets: [...prev.tickets, { type: "", price: "", perks: [] }],
    }));
  };

  const handleRemoveTicket = (index) => {
    const updated = formData.tickets.filter((_, i) => i !== index);
    setFormData(prev => ({ ...prev, tickets: updated }));
  };

  const handlePerkChange = (ticketIndex, perkIndex, value) => {
    const updated = [...formData.tickets];
    updated[ticketIndex].perks[perkIndex] = value;
    setFormData(prev => ({ ...prev, tickets: updated }));
  };

  const handleAddPerk = (ticketIndex) => {
    const updated = [...formData.tickets];
    updated[ticketIndex].perks.push("");
    setFormData(prev => ({ ...prev, tickets: updated }));
  };

  const handleRemovePerk = (ticketIndex, perkIndex) => {
    const updated = [...formData.tickets];
    updated[ticketIndex].perks.splice(perkIndex, 1);
    setFormData(prev => ({ ...prev, tickets: updated }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const newEvent = {
      ...formData,
      createdBy: user.email,
      timestamp: Date.now()
    };
    await push(ref(database, "events"), newEvent);
    toast.success("Event created successfully!");
    if (user) {
      const snapshot = await (await import("firebase/database")).get(ref(database, "users/" + user.uid));
      const role = snapshot.val()?.role;
      if (role === "admin") {
        navigate("/admin/dashboard");
      } else {
        navigate("/host/dashboard");
      }
    }
  };

  return (
    <>
      <Header />
      <div className="event-form-container">
        <h2>Create New Event</h2>
        <form onSubmit={handleSubmit}>
          <input name="title" placeholder="Event Title" value={formData.title} onChange={handleChange} required />
          <textarea name="description" placeholder="Description" value={formData.description} onChange={handleChange} />
          <input name="date" type="date" value={formData.date} onChange={handleChange} required />
          <input name="startTime" type="time" value={formData.startTime} onChange={handleChange} required />
          <input name="endTime" type="time" value={formData.endTime} onChange={handleChange} required />
          <input name="location" placeholder="Location" value={formData.location} onChange={handleChange} required />
          <select name="category" value={formData.category} onChange={handleChange}>
            <option value="">Select Category</option>
            <option value="Party">Party</option>
            <option value="Concert">Concert</option>
            <option value="Meetup">Meetup</option>
          </select>
          <input
            name="maxPerUser"
            type="number"
            value={formData.maxPerUser}
            min="1"
            onChange={handleChange}
            placeholder="Max tickets per user"
          />

          <input type="file" accept="image/*" onChange={handleImageUpload} />
          {formData.image && <img src={formData.image} alt="Preview" style={{ height: "100px" }} />}

          <h3>Ticket Types</h3>
          {formData.tickets.map((ticket, i) => (
            <div key={i} className="ticket-type">
              <input
                placeholder="Type"
                value={ticket.type}
                onChange={(e) => handleTicketChange(i, "type", e.target.value)}
              />
              <input
                placeholder="Price"
                type="number"
                value={ticket.price}
                onChange={(e) => handleTicketChange(i, "price", e.target.value)}
              />
              <button type="button" onClick={() => handleRemoveTicket(i)}>Remove Ticket</button>

              <div className="perks">
                {ticket.perks.map((perk, j) => (
                  <div key={j}>
                    <input
                      placeholder="Perk"
                      value={perk}
                      onChange={(e) => handlePerkChange(i, j, e.target.value)}
                    />
                    <button type="button" onClick={() => handleRemovePerk(i, j)}>Remove</button>
                  </div>
                ))}
                <button type="button" onClick={() => handleAddPerk(i)}>Add Perk</button>
              </div>
            </div>
          ))}

          <button type="button" onClick={handleAddTicket}>Add Ticket Type</button>
          <button type="submit">Create Event</button>
        </form>
      </div>
      <Footer />
    </>
  );
};

export default EventForm;

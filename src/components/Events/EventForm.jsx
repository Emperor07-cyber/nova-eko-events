import React, { useEffect, useState } from "react";
import { ref, push, get } from "firebase/database";
import { database, auth } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";

function EventForm() {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const [authorized, setAuthorized] = useState(null);

  const [eventData, setEventData] = useState({
    title: "",
    description: "",
    date: "",
    location: "",
    startTime: "",
    endTime: "",
    category: "",
    isPaid: true,
    maxPurchaseLimit: 1,
  });

  const [ticketTypes, setTicketTypes] = useState([
    { type: "Regular", price: "", limit: "", perks: [], newPerk: "" },
  ]);
  const [imageFile, setImageFile] = useState(null);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    const checkUserRole = async () => {
      if (!user) return;

      const userRef = ref(database, "users/" + user.uid);
      const snapshot = await get(userRef);
      const userData = snapshot.val();

      if (userData?.role === "host" || userData?.role === "admin") {
        setAuthorized(true);
      } else {
        navigate("/");
      }
    };

    checkUserRole();
  }, [user, navigate]);

  if (!user || authorized === null) {
    return <div>Loading...</div>;
  }

  const handleChange = (e) => {
    setEventData({ ...eventData, [e.target.name]: e.target.value });
  };

  const handlePerkChange = (index, value) => {
    const updatedTickets = [...ticketTypes];
    updatedTickets[index].newPerk = value;
    setTicketTypes(updatedTickets);
  };

  const handleAddPerk = (index) => {
    const updatedTickets = [...ticketTypes];
    if (updatedTickets[index].newPerk.trim()) {
      updatedTickets[index].perks.push(updatedTickets[index].newPerk.trim());
      updatedTickets[index].newPerk = "";
      setTicketTypes(updatedTickets);
    }
  };

  const handleRemovePerk = (index, perkIndex) => {
    const updatedTickets = [...ticketTypes];
    updatedTickets[index].perks.splice(perkIndex, 1);
    setTicketTypes(updatedTickets);
  };

  const handleTicketChange = (index, field, value) => {
    const updatedTickets = [...ticketTypes];
    updatedTickets[index][field] = value;
    setTicketTypes(updatedTickets);
  };

  const handleAddTicket = () => {
    setTicketTypes([
      ...ticketTypes,
      { type: "", price: "", limit: "", perks: [], newPerk: "" },
    ]);
  };

  const handleImageChange = (e) => {
    setImageFile(e.target.files[0]);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      setUploading(true);

      let imageUrl = "";
      if (imageFile) {
        const formData = new FormData();
        formData.append("file", imageFile);
        formData.append("upload_preset", "nova-eko-events");

        const response = await fetch(
          "https://api.cloudinary.com/v1_1/dkse7snw2/image/upload",
          {
            method: "POST",
            body: formData,
          }
        );

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error("Cloudinary upload failed: " + errorText);
        }

        const data = await response.json();
        imageUrl = data.secure_url;
      }

      if (!imageUrl) {
        imageUrl =
          "https://res.cloudinary.com/dkse7snw2/image/upload/v1234567890/default-event.jpg";
      }

      await push(ref(database, "events"), {
        ...eventData,
        image: imageUrl,
        tickets: ticketTypes,
        createdBy: user.email,
        timestamp: Date.now(),
      });

      alert("✅ Event created successfully!");
      setEventData({
        title: "",
        description: "",
        date: "",
        location: "",
        startTime: "",
        endTime: "",
        category: "",
        isPaid: true,
        maxPurchaseLimit: 1,
      });
      setTicketTypes([
        { type: "Regular", price: "", limit: "", perks: [], newPerk: "" },
      ]);
      setImageFile(null);

      setTimeout(() => {
        navigate("/");
      }, 1500);
    } catch (error) {
      alert("❌ Failed to create event: " + error.message);
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="event-form-container">
      <h2>Create New Event</h2>
      <form onSubmit={handleSubmit}>
        <label>
          <input
            type="checkbox"
            checked={!eventData.isPaid}
            onChange={() =>
              setEventData({ ...eventData, isPaid: !eventData.isPaid })
            }
          />
          This is a free event
        </label>

        <input
          name="title"
          placeholder="Event Title"
          value={eventData.title}
          onChange={handleChange}
          required
        />
        <textarea
          name="description"
          placeholder="Description"
          value={eventData.description}
          onChange={handleChange}
          required
        />
        <input
          name="date"
          type="date"
          value={eventData.date}
          onChange={handleChange}
          required
        />
        <input
          name="startTime"
          type="time"
          value={eventData.startTime}
          onChange={handleChange}
          required
          placeholder="Start Time"
        />
        <input
          name="endTime"
          type="time"
          value={eventData.endTime}
          onChange={handleChange}
          required
          placeholder="End Time"
        />
        <input
          name="location"
          placeholder="Location"
          value={eventData.location}
          onChange={handleChange}
          required
        />
        <input
          name="category"
          placeholder="Category (e.g. Music, Tech, Art)"
          value={eventData.category}
          onChange={handleChange}
        />
        <input
          name="maxPurchaseLimit"
          type="number"
          placeholder="Max tickets per person"
          value={eventData.maxPurchaseLimit}
          onChange={handleChange}
        />

        <label>Upload Image:</label>
        <input type="file" accept="image/*" onChange={handleImageChange} />

        <div className="ticket-types">
          <label>Ticket Types:</label>
          {ticketTypes.map((ticket, index) => (
            <div key={index} className="ticket-row">
              <input
                type="text"
                placeholder="Type (e.g. Regular, VIP)"
                value={ticket.type}
                onChange={(e) =>
                  handleTicketChange(index, "type", e.target.value)
                }
                required
              />
              <input
                type="number"
                placeholder="Price (₦)"
                value={ticket.price}
                onChange={(e) =>
                  handleTicketChange(index, "price", e.target.value)
                }
                required={eventData.isPaid}
              />
              <input
                type="number"
                placeholder="Limit"
                value={ticket.limit}
                onChange={(e) =>
                  handleTicketChange(index, "limit", e.target.value)
                }
                required
              />

              <div className="ticket-perks">
                <input
                  type="text"
                  placeholder="Add a perk"
                  value={ticket.newPerk}
                  onChange={(e) =>
                    handlePerkChange(index, e.target.value)
                  }
                />
                <button type="button" onClick={() => handleAddPerk(index)}>
                  Add Perk
                </button>
                <ul>
                  {ticket.perks.map((perk, perkIndex) => (
                    <li key={perkIndex}>
                      {perk}{" "}
                      <button
                        type="button"
                        onClick={() => handleRemovePerk(index, perkIndex)}
                      >
                        Remove
                      </button>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          ))}
          <button type="button" onClick={handleAddTicket}>
            Add New Ticket Type
          </button>
        </div>

        <button type="submit" disabled={uploading}>
          {uploading ? "Uploading..." : "Create Event"}
        </button>
      </form>
    </div>
  );
}

export default EventForm;

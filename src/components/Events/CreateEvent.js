import React, { useState } from "react";
import { ref, push } from "firebase/database";
import { database, auth } from "../../firebase/firebaseConfig";
import { useNavigate } from "react-router-dom";

function CreateEvent() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const navigate = useNavigate();

  const handleCreate = async (e) => {
    e.preventDefault();
    const user = auth.currentUser;

    if (!user) {
      alert("You must be logged in to create an event.");
      return;
    }

    try {
      const eventRef = ref(database, "events");
      await push(eventRef, {
        title,
        description,
        price: parseFloat(price),
        createdBy: user.uid,
        createdAt: Date.now(),
      });
      alert("Event created!");
      navigate("/");
    } catch (error) {
      console.error("Error creating event:", error);
      alert("Error: " + error.message);
    }
  };

  return (
    <div style={{ padding: "2rem" }}>
      <h2>Create Event</h2>
      <form onSubmit={handleCreate}>
        <input
          type="text"
          placeholder="Event title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          required
        /><br />
        <textarea
          placeholder="Event description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          required
        /><br />
        <input
          type="number"
          placeholder="Ticket price (₦)"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        /><br />
        <button type="submit">Create Event</button>
      </form>
    </div>
  );
}

export default CreateEvent;

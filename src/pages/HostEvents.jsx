import React, { useEffect, useState } from "react";
import HostLayout from "../components/Layout/HostLayout";
import { database, auth } from "../firebase/firebaseConfig";
import { ref, onValue, remove } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { useNavigate } from "react-router-dom";

const HostEvents = () => {
  const [user] = useAuthState(auth);
  const [events, setEvents] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) return;

    const eventsRef = ref(database, "events");

    onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};

      const filtered = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .filter((event) => event.createdBy === user.email);

      setEvents(filtered);
    });
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this event?")) {
      await remove(ref(database, `events/${id}`));
      alert("Event deleted");
    }
  };

  return (
    <HostLayout>
      <h2>My Events</h2>

      <button onClick={() => navigate("/event/new")}>
        + Create Event
      </button>

      <table>
        <thead>
          <tr>
            <th>Title</th>
            <th>Date</th>
            <th>Location</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {events.map((event) => (
            <tr key={event.id}>
              <td>{event.title}</td>
              <td>{event.date}</td>
              <td>{event.location}</td>
              <td>
                <button onClick={() => navigate(`/event/edit/${event.id}`)}>
                  Edit
                </button>
                <button onClick={() => handleDelete(event.id)}>
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </HostLayout>
  );
};

export default HostEvents;

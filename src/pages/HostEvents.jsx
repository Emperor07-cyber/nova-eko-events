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
    const unsubscribe = onValue(eventsRef, (snapshot) => {
      const data = snapshot.val() || {};
      const filtered = Object.entries(data)
        .map(([id, value]) => ({ id, ...value }))
        .filter((event) => event.createdBy === user.email);
      setEvents(filtered);
    });

    return () => unsubscribe();
  }, [user]);

  const handleDelete = async (id) => {
    if (window.confirm("Delete this event?")) {
      await remove(ref(database, `events/${id}`));
      alert("Event deleted.");
    }
  };

  return (
    <HostLayout>
      <div className="section-header">
        <h2 className="section-title">🎫 My Events</h2>
        <button className="btn-primary" onClick={() => navigate("/event/new")}>
          + Create Event
        </button>
      </div>

      <div className="table-wrapper">
        <table className="host-table">
          <thead>
            <tr>
              <th>Title</th>
              <th>Date</th>
              <th>Location</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {events.length === 0 ? (
              <tr>
                <td colSpan={4} className="table-empty">
                  No events found. Create your first event!
                </td>
              </tr>
            ) : (
              events.map((event) => (
                <tr key={event.id}>
                  <td>{event.title}</td>
                  <td>{event.date}</td>
                  <td>{event.location}</td>
                  <td className="action-btns">
                    <button
                      className="btn-edit"
                      onClick={() => navigate(`/event/edit/${event.id}`)}
                    >
                      Edit
                    </button>
                    <button
                      className="btn-delete"
                      onClick={() => handleDelete(event.id)}
                    >
                      Delete
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

export default HostEvents;

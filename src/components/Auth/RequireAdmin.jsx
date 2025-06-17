// src/components/Auth/RequireAdmin.jsx
import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate } from "react-router-dom";
import { auth } from "../../firebase/firebaseConfig";

const RequireAdmin = ({ EventList }) => {
  const [user, loading] = useAuthState(auth);

  const adminEmail = "admin@example.com"; // <-- your only admin email

  if (loading) return <p>Loading...</p>;

  if (!user || user.email !== adminEmail) {
    return <Navigate to="/" EventList />;
  }

  return EventList;
};

export default RequireAdmin;

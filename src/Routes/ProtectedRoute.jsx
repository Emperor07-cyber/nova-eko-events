import React from "react";
import { Navigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebaseConfig";

const adminEmail = "Ekotix234@gmail.com"; // 👈 Replace with your actual admin email

function ProtectedRoute({ Component, adminOnly = false }) {
  const [user, loading] = useAuthState(auth);

  if (loading) return <p>Loading...</p>;
  if (!user) return <Navigate to="/login" />;

  // If route is adminOnly and user is not the admin, redirect
  if (adminOnly && user.email !== adminEmail) {
    return <Navigate to="/" />;
  }

  return <Component />;
}

export default ProtectedRoute;

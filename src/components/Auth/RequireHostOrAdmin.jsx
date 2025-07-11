import React, { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate, useLocation } from "react-router-dom";
import { auth, database } from "../../firebase/firebaseConfig";
import { ref, get } from "firebase/database";

const RequireHostOrAdmin = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const location = useLocation();
  const [authorized, setAuthorized] = useState(null);

  useEffect(() => {
    const checkRole = async () => {
      if (user) {
        try {
          const userRef = ref(database, "users/" + user.uid);
          const snapshot = await get(userRef);
          const userData = snapshot.val();

          console.log("🧠 userData:", userData);

          if (!userData || !userData.role) {
            setAuthorized(false);
            return;
          }

          const role = userData.role;
          const isAuthorized = role === "host" || role === "admin";
          setAuthorized(isAuthorized);
        } catch (err) {
          console.error("🔥 Error checking role:", err);
          setAuthorized(false);
        }
      }
    };

    if (user) {
      checkRole();
    } else if (!loading) {
      // No user logged in and not loading → send to login
      setAuthorized(false);
    }
  }, [user, loading]);

  if (loading || authorized === null) {
    return (
      <div style={{ textAlign: "center", padding: "3rem" }}>
        <div className="spinner" />
        <p style={{ marginTop: "1rem" }}>Checking permissions...</p>
      </div>
    );
  }

  if (!user || !authorized) {
    console.warn("🔒 Not authorized, redirecting to login");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireHostOrAdmin;

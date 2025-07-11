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
      if (!user && !loading) {
        console.log("🚫 No user, setting authorized = false");
        setAuthorized(false);
        return;
      }

      if (user) {
        console.log("🔍 User found:", user.email);
        const userRef = ref(database, "users/" + user.uid);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        console.log("📦 User data from DB:", userData);

        const role = userData?.role;
        const isAuthorized = role === "host" || role === "admin";
        setAuthorized(isAuthorized);
        console.log("✅ Is authorized:", isAuthorized);
      }
    };

    checkRole();
  }, [user, loading]);

  if (loading || authorized === null) {
    console.log("⏳ Waiting for auth/role...");
    return (
  <div style={{ textAlign: "center", marginTop: "5rem" }}>
    <div className="loader"></div>
    <p>Checking permissions...</p>
  </div>
);
  }

  if (!user || !authorized) {
    console.log("⛔ Redirecting to login: unauthorized");
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  console.log("✅ Authorized access to protected route");
  return children;
};

export default RequireHostOrAdmin;

import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate, useLocation } from "react-router-dom";
import { auth, database } from "../../firebase/firebaseConfig";
import { ref, get } from "firebase/database";

const RequireHost = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const location = useLocation();
  const [isAuthorized, setIsAuthorized] = React.useState(null);

  React.useEffect(() => {
    if (loading) return;
    
    if (!user) {
      setIsAuthorized(false);
      return;
    }

    const checkRole = async () => {
      try {
        const userRef = ref(database, "users/" + user.uid);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        if (userData?.role === "host" || userData?.role === "admin") {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      } catch (err) {
        console.error("RequireHost role check failed:", err);
        setIsAuthorized(false);
      }
    };

    checkRole();
  }, [user, loading]);

  if (loading || isAuthorized === null) return <div>Loading...</div>;

  if (!user || !isAuthorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireHost;
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
    const checkRole = async () => {
      if (user) {
        const userRef = ref(database, "users/" + user.uid);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        if (userData?.role === "host") {
          setIsAuthorized(true);
        } else {
          setIsAuthorized(false);
        }
      }
    };

    checkRole();
  }, [user]);

  if (loading || isAuthorized === null) return <div>Loading...</div>;

  if (!user || !isAuthorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireHost;
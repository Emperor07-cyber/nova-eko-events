import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate, useLocation } from "react-router-dom";
import { auth, database } from "../../firebase/firebaseConfig";
import { ref, get } from "firebase/database";

const RequireHostOrAdmin = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const location = useLocation();
  const [authorized, setAuthorized] = React.useState(null);

  React.useEffect(() => {
    const checkRole = async () => {
      if (!user) {
        setAuthorized(false);
        return;
      }

      try {
        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        const role = userData?.role;

        if (role === "host" || role === "admin") {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      } catch (error) {
        console.error("Error checking user role:", error);
        setAuthorized(false);
      }
    };

    if (!loading) checkRole();
  }, [user, loading]);

  if (loading || authorized === null) return <div>Loading...</div>;

  if (!user || !authorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
};

export default RequireHostOrAdmin;

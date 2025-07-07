import React from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate, useLocation } from "react-router-dom";
import { auth, database } from "../../firebase/firebaseConfig";
import { ref, get } from "firebase/database";

const RequireHostOrAdmin = ({ Component }) => {
  const [user, loading] = useAuthState(auth);
  const location = useLocation();
  const [authorized, setAuthorized] = React.useState(null);

  React.useEffect(() => {
    const checkRole = async () => {
      if (user) {
        const userRef = ref(database, "users/" + user.uid);
        const snapshot = await get(userRef);
        const userData = snapshot.val();
        const role = userData?.role;
        if (role === "host" || role === "admin") {
          setAuthorized(true);
        } else {
          setAuthorized(false);
        }
      }
    };
    checkRole();
  }, [user]);

  if (loading || authorized === null) return <div>Loading...</div>;

  if (!user || !authorized) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Component />;
};

export default RequireHostOrAdmin;

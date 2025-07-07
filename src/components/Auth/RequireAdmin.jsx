import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { auth, database } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate, useLocation } from "react-router-dom";

const RequireAdmin = ({ Component }) => {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(null);
  const location = useLocation();

  useEffect(() => {
    if (user) {
      const userRef = ref(database, `users/${user.uid}`);
      get(userRef).then((snapshot) => {
        const data = snapshot.val();
        setIsAdmin(data?.role === "admin");
      });
    }
  }, [user]);

  if (loading || isAdmin === null) return <div>Loading...</div>;

  if (!user || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return <Component />;
};

export default RequireAdmin;

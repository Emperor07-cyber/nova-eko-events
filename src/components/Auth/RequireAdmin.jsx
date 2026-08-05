import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { auth, database } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../common/LoadingSpinner";

const RequireAdmin = ({ Component, children }) => {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(null);
  const [verificationError, setVerificationError] = useState("");
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;

    if (!user) {
      setIsAdmin(false);
      setVerificationError("");
      return;
    }

    const verifyAdmin = async () => {
      try {
        setVerificationError("");

        const tokenResult = await user.getIdTokenResult();
        if (tokenResult?.claims?.admin === true) {
          if (!cancelled) setIsAdmin(true);
          return;
        }

        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const data = snapshot.val();
        if (!cancelled) setIsAdmin(data?.role === "admin");
      } catch (error) {
        if (cancelled) return;
        setVerificationError(error?.message || "Unable to verify admin access right now.");
      }
    };

    verifyAdmin();

    return () => {
      cancelled = true;
    };
  }, [user]);

  if (loading || isAdmin === null) {
    if (verificationError) {
      return (
        <div className="admin-panel" style={{ padding: "2rem" }}>
          <h2 style={{ marginTop: 0 }}>Admin check failed</h2>
          <p>{verificationError}</p>
          <button className="button-primary" type="button" onClick={() => window.location.reload()}>
            Retry
          </button>
        </div>
      );
    }
    return <LoadingSpinner message="Checking admin access..." />;
  }

  if (!user || !isAdmin) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (children) {
    return children;
  }

  return <Component />;
};

export default RequireAdmin;

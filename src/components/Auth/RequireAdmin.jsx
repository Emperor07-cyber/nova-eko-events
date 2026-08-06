import { useEffect, useState } from "react";
import { ref, get } from "firebase/database";
import { auth, database } from "../../firebase/firebaseConfig";
import { useAuthState } from "react-firebase-hooks/auth";
import { Navigate, useLocation } from "react-router-dom";
import LoadingSpinner from "../common/LoadingSpinner";
import { hasAdminAccess, shouldRedirectFromAdmin } from "../../Utils/adminAccess";

const getAdminCacheKey = (uid) => `ekotix-admin-access:${uid}`;

const readCachedAdminAccess = (uid) => {
  if (!uid || typeof window === "undefined") return false;
  return window.sessionStorage.getItem(getAdminCacheKey(uid)) === "true";
};

const writeCachedAdminAccess = (uid, value) => {
  if (!uid || typeof window === "undefined") return;
  const key = getAdminCacheKey(uid);
  if (value) {
    window.sessionStorage.setItem(key, "true");
    return;
  }
  window.sessionStorage.removeItem(key);
};

const RequireAdmin = ({ Component, children }) => {
  const [user, loading] = useAuthState(auth);
  const [isAdmin, setIsAdmin] = useState(null);
  const [verificationError, setVerificationError] = useState("");
  const location = useLocation();

  useEffect(() => {
    let cancelled = false;
    const cachedAccess = readCachedAdminAccess(user?.uid);

    if (!user) {
      setIsAdmin(false);
      setVerificationError("");
      if (typeof window !== "undefined") {
        Object.keys(window.sessionStorage)
          .filter((key) => key.startsWith("ekotix-admin-access:"))
          .forEach((key) => window.sessionStorage.removeItem(key));
      }
      return;
    }

    if (cachedAccess) {
      setIsAdmin(true);
    } else {
      setIsAdmin(null);
    }

    const verifyAdmin = async () => {
      try {
        setVerificationError("");

        const tokenResult = await user.getIdTokenResult();
        if (hasAdminAccess({ tokenClaims: tokenResult?.claims })) {
          if (!cancelled) {
            setIsAdmin(true);
            writeCachedAdminAccess(user.uid, true);
          }
          return;
        }

        const userRef = ref(database, `users/${user.uid}`);
        const snapshot = await get(userRef);
        const data = snapshot.val();
        if (!cancelled) {
          const nextIsAdmin = hasAdminAccess({ tokenClaims: tokenResult?.claims, userRecord: data });
          setIsAdmin(nextIsAdmin);
          writeCachedAdminAccess(user.uid, nextIsAdmin);
        }
      } catch (error) {
        if (cancelled) return;
        if (cachedAccess) {
          setIsAdmin(true);
        } else {
          setVerificationError(error?.message || "Unable to verify admin access right now.");
        }
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

  if (shouldRedirectFromAdmin({ user, isAdmin })) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  if (children) {
    return children;
  }

  return <Component />;
};

export default RequireAdmin;

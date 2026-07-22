import React, { useEffect, useState } from "react";
import { Outlet } from "react-router-dom";
import { ref, get } from "firebase/database";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, database } from "../../firebase/firebaseConfig";
import LoadingSpinner from "../common/LoadingSpinner";
import HostLayout from "./HostLayout";
import AdminLayout from "./AdminLayout";

const EventEditorShell = () => {
  const [user] = useAuthState(auth);
  const [role, setRole] = useState(null);

  useEffect(() => {
    const loadRole = async () => {
      if (!user) {
        return;
      }

      try {
        const snapshot = await get(ref(database, `users/${user.uid}`));
        const userRole = snapshot.val()?.role;
        setRole(userRole || "host");
      } catch (error) {
        console.error("Failed to load event editor shell role:", error);
        setRole("host");
      }
    };

    loadRole();
  }, [user]);

  if (!user || role === null) {
    return <LoadingSpinner message="Preparing editor workspace..." />;
  }

  if (role === "admin") {
    return (
      <AdminLayout>
        <Outlet />
      </AdminLayout>
    );
  }

  return (
    <HostLayout>
      <Outlet />
    </HostLayout>
  );
};

export default EventEditorShell;

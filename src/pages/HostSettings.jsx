import React, { useState } from "react";
import HostLayout from "../components/Layout/HostLayout";
import { auth } from "../firebase/firebaseConfig";
import { updateProfile, updatePassword } from "firebase/auth";

const HostSettings = () => {
  const user = auth.currentUser;

  const [name, setName] = useState(user?.displayName || "");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleUpdateName = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      setLoading(true);
      await updateProfile(user, {
        displayName: name,
      });
      alert("Name updated successfully!");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  const handleUpdatePassword = async (e) => {
    e.preventDefault();
    if (!user || !password) return;

    try {
      setLoading(true);
      await updatePassword(user, password);
      alert("Password updated successfully!");
      setPassword("");
    } catch (error) {
      alert(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <HostLayout>
      <div className="host-settings">
        <h2>⚙ Host Settings</h2>

        {/* Update Name */}
        <form onSubmit={handleUpdateName} className="settings-card">
          <h3>Update Display Name</h3>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter new name"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Update Name"}
          </button>
        </form>

        {/* Update Password */}
        <form onSubmit={handleUpdatePassword} className="settings-card">
          <h3>Change Password</h3>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            placeholder="Enter new password"
            required
          />
          <button type="submit" disabled={loading}>
            {loading ? "Updating..." : "Change Password"}
          </button>
        </form>

        <div className="settings-card">
          <h3>Email</h3>
          <p>{user?.email}</p>
        </div>
      </div>
    </HostLayout>
  );
};

export default HostSettings;

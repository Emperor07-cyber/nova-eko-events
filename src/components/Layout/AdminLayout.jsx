import React, { useState } from "react";
import AdminSidebar from "./AdminSidebar";
import "./adminPortal.css";

const AdminLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <div className="admin-shell-layout">
      <AdminSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

      <main className="admin-shell-main">
        <button
          type="button"
          className="admin-sidebar-toggle-btn"
          onClick={() => setSidebarOpen(true)}
          aria-label="Open admin sidebar"
        >
          ☰
        </button>

        <div className="admin-shell-content">{children}</div>
      </main>
    </div>
  );
};

export default AdminLayout;

import React, { useState } from "react";
import Header from "./Header";
import HostSidebar from "./HostSidebar";
import './hostPortal.css';

const HostLayout = ({ children }) => {
  const [sidebarOpen, setSidebarOpen] = useState(false);

  return (
    <>
      <Header />
      <div className="host-layout">
        <HostSidebar sidebarOpen={sidebarOpen} setSidebarOpen={setSidebarOpen} />

        <main className="host-main">
          <button
            className="sidebar-toggle-btn"
            onClick={() => setSidebarOpen(true)}
            aria-label="Open sidebar"
          >
            ☰
          </button>

          <div className="host-content">
            {children}
          </div>
        </main>
      </div>
    </>
  );
};

export default HostLayout;

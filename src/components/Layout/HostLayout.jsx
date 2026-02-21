import React from "react";
import HostSidebar from "./HostSidebar";
import '../../main.css';

const HostLayout = ({ children }) => {
  return (
    <div className="host-container">
      <HostSidebar />
      <div className="host-content">
        {children}
      </div>
    </div>
  );
};

export default HostLayout;


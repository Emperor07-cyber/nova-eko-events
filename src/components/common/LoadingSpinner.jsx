import React from "react";


const LoadingSpinner = ({ message = "Loading your experience...", fullScreen = true }) => {
  return (
    <div className={`app-loader ${fullScreen ? "is-fullscreen" : ""}`} role="status" aria-live="polite">
      <div className="app-loader-card">
        <div className="app-loader-ring" />
        <div className="app-loader-copy">
          <strong>Please wait</strong>
          <p>{message}</p>
        </div>
      </div>
    </div>
  );
};

export default LoadingSpinner;

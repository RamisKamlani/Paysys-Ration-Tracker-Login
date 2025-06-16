import React from 'react';

export default function AboutModal({ show, onClose }) {
  if (!show) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-box" onClick={(e) => e.stopPropagation()}>
        <h2>📘 How to Use</h2>
        <ul>
          <li>🔐 Log in with your Google account.</li>
          <li>📝 Enter the name of the person/house you're visiting.</li>
          <li>📍 Tap "Capture Location" to save the GPS coordinates.</li>
          <li>🔄 Use "Transfer Data" to sync offline data to the server.</li>
          <li>🗺️ Use "Show Map" to view synced locations.</li>
          <li>🛡 Only Admins can filter and view data from all users.</li>
        </ul>
        <button className="close-btn" onClick={onClose}>Close</button>
      </div>
    </div>
  );
}

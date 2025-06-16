import ReactDOM from 'react-dom';

export default function AboutModal({ show, onClose }) {
  if (!show) return null;

  return ReactDOM.createPortal(
    <div className="modal-overlay">
      <div className="modal-box">
        <h2>📘 <strong>How to Use</strong></h2>
        <ul>
          <li>🔐 Log in with your Google account.</li>
          <li>📝 Enter the name of the person/house you're visiting.</li>
          <li>📍 Tap "Capture Location" to save the GPS coordinates.</li>
          <li>🔄 Use "Transfer Data" to sync offline data to the server.</li>
          <li>🗺️ Use "Show Map" to view synced locations.</li>
          <li>🛡️ Only Admins can filter and view data from all users.</li>
        </ul>
        <button onClick={onClose} className="close-btn">Close</button>
      </div>
    </div>,
    document.body // 🔁 Portal to body
  );
}

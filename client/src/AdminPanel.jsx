import { useEffect, useState } from 'react';

const SERVER_URL = 'https://paysys-ration-tracker-login-production.up.railway.app';

export default function AdminPanel() {
  const [emails, setEmails] = useState([]);
  const [selected, setSelected] = useState('');
  const [locations, setLocations] = useState([]);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${SERVER_URL}/api/users`);
        const data = await res.json();
        setEmails(data);
      } catch (err) {
        console.error('Failed to load users:', err);
      }
    };
    fetchUsers();
  }, []);

  const fetchLocations = async () => {
    try {
      const url = selected
        ? `${SERVER_URL}/api/locations?email=${encodeURIComponent(selected)}`
        : `${SERVER_URL}/api/locations`;
      const res = await fetch(url);
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations:', err);
    }
  };

  const deleteFromServer = async (index) => {
    const confirmDelete = window.confirm('Are you sure you want to delete this location from the server?');
    if (!confirmDelete) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/locations/${index}?email=${encodeURIComponent(selected)}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Delete failed');
      await fetchLocations(); // Refresh the list
    } catch (err) {
      console.error('Error deleting location:', err);
      alert('Failed to delete location.');
    }
  };

  return (
    <section className="card">
      <div className="card-header">🛡 Admin Panel</div>

      <label>Filter by User:</label>
      <select value={selected} onChange={(e) => setSelected(e.target.value)}>
        <option value="">All Users</option>
        {emails.map((email, i) => (
          <option key={i} value={email}>{email}</option>
        ))}
      </select>

      <button onClick={fetchLocations}>🔍 Fetch</button>

      <ul className="location-list">
        {locations.map((loc, idx) => (
          <li key={idx}>
            <strong>{loc.name}</strong><br />
            Lat: {loc.lat}, Lng: {loc.lng}<br />
            {loc.email}<br />
            <button
              onClick={() => deleteFromServer(idx)}
              style={{ marginTop: 6, backgroundColor: 'crimson', color: 'white' }}
            >
              🗑️ Delete
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}

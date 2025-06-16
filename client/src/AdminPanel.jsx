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
      const url = selected ? `${SERVER_URL}/api/locations?email=${encodeURIComponent(selected)}` : `${SERVER_URL}/api/locations`;
      const res = await fetch(url);
      const data = await res.json();
      setLocations(data);
    } catch (err) {
      console.error('Failed to load locations:', err);
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
            {loc.email}
          </li>
        ))}
      </ul>
    </section>
  );
}

import { useEffect, useState } from 'react';

export default function AdminPanel() {
  const [locations, setLocations] = useState([]);
  const [filter, setFilter] = useState('');
  const [filtered, setFiltered] = useState([]);

  useEffect(() => {
    fetch('http://localhost:5000/api/locations')
      .then(res => res.json())
      .then(data => {
        setLocations(data);
        setFiltered(data);
      });
  }, []);

  const uniqueEmails = [...new Set(locations.map(l => l.email))];

  const handleFilter = (email) => {
    setFilter(email);
    if (!email) {
      setFiltered(locations);
    } else {
      setFiltered(locations.filter(loc => loc.email === email));
    }
  };

  return (
    <section className="card">
      <div className="card-header">👁️ Admin Panel - All Synced Locations</div>
      <select value={filter} onChange={(e) => handleFilter(e.target.value)}>
        <option value="">All Users</option>
        {uniqueEmails.map((email, i) => (
          <option key={i} value={email}>{email}</option>
        ))}
      </select>

      <ul className="location-list">
        {filtered.map((loc, idx) => (
          <li key={idx}>
            <strong>{loc.name}</strong><br />
            Lat: {loc.lat?.toFixed(4)}<br />
            Lng: {loc.lng?.toFixed(4)}<br />
            Email: {loc.email}<br />
            Timestamp: {new Date(loc.timestamp).toLocaleString()}
          </li>
        ))}
      </ul>
    </section>
  );
}

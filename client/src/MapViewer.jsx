import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import { useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix Leaflet's default icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
  shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
});

const SERVER_URL = 'http://localhost:5000';

export default function MapViewer({ userEmail, isAdmin = false }) {
  const [locations, setLocations] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const endpoint = isAdmin
          ? `${SERVER_URL}/api/locations`
          : `${SERVER_URL}/api/locations?email=${encodeURIComponent(userEmail)}`;
        const res = await fetch(endpoint);
        const data = await res.json();
        setLocations(data);
      } catch (err) {
        console.error('Error fetching locations:', err);
        alert('Failed to load locations.');
      } finally {
        setLoading(false);
      }
    };

    if (userEmail || isAdmin) {
      fetchData();
    }
  }, [userEmail, isAdmin]);

  const deleteLocation = async (index) => {
    const confirm = window.confirm('Are you sure you want to delete this location from the server?');
    if (!confirm) return;

    try {
      const res = await fetch(`${SERVER_URL}/api/locations/${index}?email=${encodeURIComponent(userEmail)}`, {
        method: 'DELETE',
      });

      if (!res.ok) throw new Error('Failed to delete');

      const refreshed = await fetch(
        isAdmin
          ? `${SERVER_URL}/api/locations`
          : `${SERVER_URL}/api/locations?email=${encodeURIComponent(userEmail)}`
      );
      const data = await refreshed.json();
      setLocations(data);
      alert('Location deleted.');
    } catch (err) {
      console.error('Delete failed:', err);
      alert('Failed to delete location.');
    }
  };

  if (!userEmail && !isAdmin) {
    return <p style={{ textAlign: 'center' }}>🔒 Please sign in to view locations.</p>;
  }

  if (loading) {
    return <p style={{ textAlign: 'center' }}>⏳ Loading map...</p>;
  }

  if (locations.length === 0) {
    return <p style={{ textAlign: 'center' }}>📍 No locations to display.</p>;
  }

  const center = [locations[0].lat, locations[0].lng];

  return (
    <MapContainer center={center} zoom={15} scrollWheelZoom={true} style={{ height: '400px', width: '100%' }}>
      <TileLayer
        attribution="&copy; OpenStreetMap contributors"
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />

      {locations.map((loc, idx) => (
        <Marker
          key={idx}
          position={[loc.lat, loc.lng]}
          icon={L.divIcon({
            className: 'custom-dot-only',
            html: `<div class="dot"></div>`,
            iconSize: [10, 10],
            iconAnchor: [5, 5],
          })}
        >
          <Popup>
            <strong>{loc.name}</strong><br />
            <em>{loc.email}</em><br />
            <button onClick={() => deleteLocation(idx)}>🗑 Delete</button>
          </Popup>
        </Marker>
      ))}
    </MapContainer>
  );
}

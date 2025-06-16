import MapViewer from './MapViewer';
import { useEffect, useState } from 'react';
import { db } from './db';
import { GoogleOAuthProvider, GoogleLogin, googleLogout } from '@react-oauth/google';
import { jwtDecode } from 'jwt-decode';
import AdminPanel from './AdminPanel';
import AboutModal from './AboutModal';

const CLIENT_ID = '107243168159-fdc4iftnp66vieumrbjs6krc8ba9e45j.apps.googleusercontent.com';
const ADMIN_EMAIL = 'ramiskamlani04@gmail.com';
const SERVER_URL = 'https://paysys-ration-tracker-login-production.up.railway.app';

export default function App() {
  const [name, setName] = useState('');
  const [locations, setLocations] = useState([]);
  const [showMap, setShowMap] = useState(false);
  const [fullScreenMap, setFullScreenMap] = useState(false);
  const [user, setUser] = useState(null);
  const [showAbout, setShowAbout] = useState(false);
  const [showCaptured, setShowCaptured] = useState(true);

  useEffect(() => {
    const storedUser = localStorage.getItem('user');
    if (storedUser) setUser(JSON.parse(storedUser));

    (async () => {
      const all = await db.locations.toArray();
      setLocations(all);
    })();
  }, []);

  const handleLoginSuccess = (credentialResponse) => {
    const decoded = jwtDecode(credentialResponse.credential);
    const userData = {
      name: decoded.name,
      email: decoded.email,
      picture: decoded.picture,
    };
    setUser(userData);
    localStorage.setItem('user', JSON.stringify(userData));
  };

  const captureLocation = () => {
    if (!user) return alert('Please log in first.');
    if (!name.trim()) return alert('Please enter a name');
    if (!navigator.geolocation) return alert('Geolocation not supported');

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        try {
          const { latitude, longitude } = position.coords;
          const newRecord = {
            name,
            lat: latitude,
            lng: longitude,
            timestamp: new Date().toISOString(),
            synced: false,
          };
          const id = await db.locations.add(newRecord);
          setLocations((prev) => [...prev, { ...newRecord, id }]);
          alert(`Captured:\n${name}\nLat: ${latitude}\nLng: ${longitude}`);
          setName('');
        } catch (error) {
          console.error('Error capturing location:', error);
          alert('Failed to save location.');
        }
      },
      (err) => alert('Error getting location: ' + err.message)
    );
  };

  const syncToServer = async () => {
    if (!user) return alert('Please log in with Google first.');

    try {
      const all = await db.locations.toArray();
      const unsynced = all.filter((l) => !l.synced);
      if (!unsynced.length) return alert('All data already synced!');
      if (!window.confirm('Transfer data now?')) return;

      const response = await fetch(`${SERVER_URL}/api/locations/bulk`, {
        method: 'POST',
        credentials: 'include',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: user.email, locations: unsynced }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || 'Server error');
      }

      for (let rec of unsynced) {
        await db.locations.update(rec.id, { synced: true });
      }
      setLocations(await db.locations.toArray());
      alert(`${unsynced.length} location(s) synced!`);
    } catch (err) {
      console.error(err);
      alert('Sync failed.');
    }
  };

  const deleteLocation = async (id) => {
    const confirmed = window.confirm('Are you sure you want to delete this location from the local device?');
    if (!confirmed) return;

    try {
      await db.locations.delete(id);
      const updated = await db.locations.toArray();
      setLocations(updated);
      alert('Location deleted successfully.');
    } catch (error) {
      console.error('Failed to delete location:', error);
      alert('Something went wrong while deleting.');
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') captureLocation();
  };

  const isAdmin = user?.email === ADMIN_EMAIL;

  return (
    <div className="container">
      <div style={{ position: 'absolute', top: 10, right: 10 }}>
        <button onClick={() => setShowAbout(true)}>ℹ️ About</button>
      </div>
      <img src="/paysys.jpg" alt="Paysys Labs Logo" className="top-logo" />
      <h1 className="main-title">📍 Ration Location Tracker - Paysys</h1>

      <GoogleOAuthProvider clientId={CLIENT_ID}>
        {!user ? (
          <div style={{ marginBottom: 16 }}>
            <GoogleLogin onSuccess={handleLoginSuccess} onError={() => alert('Login failed')} />
          </div>
        ) : (
          <div className="user-info" style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 16 }}>
            <img src={user.picture} alt="User" style={{ width: 32, height: 32, borderRadius: '50%' }} />
            <span>Welcome, {user.name}</span>
            <button
              onClick={() => {
                googleLogout();
                setUser(null);
                localStorage.removeItem('user');
              }}
            >
              Logout
            </button>
          </div>
        )}
      </GoogleOAuthProvider>

      {/* Section 1: Capture */}
      <section className="card">
        <div className="card-header">1️⃣ Capture Location</div>
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Person / House Name"
        />
        <button onClick={captureLocation}>📌 Capture Location</button>
      </section>

      {/* Section 2: Sync */}
      <section className="card">
        <div className="card-header">2️⃣ Sync to Server</div>
        <button onClick={syncToServer}>🔄 Transfer Data</button>
      </section>

      {/* Section 3: Captured Data */}
      <section className="card">
        <div className="card-header" style={{ display: 'flex', justifyContent: 'space-between' }}>
          📋 Captured Data
          <button
            style={{ background: 'transparent', border: 'none', fontSize: '1.2rem', cursor: 'pointer' }}
            onClick={() => setShowCaptured(prev => !prev)}
            aria-label="Toggle Captured List"
          >
            {showCaptured ? '➖' : '➕'}
          </button>
        </div>
        {showCaptured && (
          locations.length === 0 ? (
            <p>No data captured yet.</p>
          ) : (
            <ul className="location-list">
              {locations.map((loc) => (
                <li key={loc.id}>
                  <strong>{loc.name}</strong><br />
                  Lat: {loc.lat?.toFixed(4) ?? 'N/A'}, Lng: {loc.lng?.toFixed(4) ?? 'N/A'}<br />
                  {loc.synced ? '✅ Synced' : '❌ Not Synced'}
                  <br />
                  <button
                    style={{ marginTop: 6, backgroundColor: 'crimson' }}
                    onClick={() => deleteLocation(loc.id)}
                  >
                    🗑️ Delete
                  </button>
                </li>
              ))}
            </ul>
          )
        )}
      </section>

      {/* Section 4: Map */}
      <section className="card">
        <div className="card-header">🗺️ View Synced Locations</div>
        <div style={{ display: 'flex', gap: 10 }}>
          <button onClick={() => setShowMap(!showMap)}>
            {showMap ? 'Hide Map' : 'Show Map'}
          </button>
          <button onClick={() => setFullScreenMap(true)}>🖥 Full Screen</button>
        </div>
        {showMap && (
          <div className="map-box">
            <MapViewer userEmail={user?.email} isAdmin={isAdmin} />
          </div>
        )}
      </section>

      {fullScreenMap && (
        <div className="fullscreen-map-overlay">
          <button onClick={() => setFullScreenMap(false)} className="fullscreen-close-btn">❌ Close</button>
          <div className="fullscreen-map-box">
            <MapViewer userEmail={user?.email} isAdmin={isAdmin} />
          </div>
        </div>
      )}

      {/* Section 5: Admin Panel */}
      {isAdmin && <AdminPanel />}

      {/* About Popup */}
      <AboutModal show={showAbout} onClose={() => setShowAbout(false)} />
    </div>
  );
}
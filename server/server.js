require('dotenv').config();
const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const { OAuth2Client } = require('google-auth-library');

const CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const ADMIN_EMAIL = process.env.ADMIN_EMAIL;
const PORT = process.env.PORT || 5000;

const client = new OAuth2Client(CLIENT_ID);
const app = express();

// ✅ Allow your frontend URLs
const allowedOrigins = [
  'http://localhost:5173', // local dev
  'https://your-vercel-app.vercel.app' // replace with your deployed frontend domain
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json());
app.use(cookieParser());

let LOCATIONS = []; // In-memory store for demo. Replace with DB in production

// ✅ Google Auth verification
app.post('/auth/google', async (req, res) => {
  const { idToken } = req.body;
  try {
    const ticket = await client.verifyIdToken({
      idToken,
      audience: CLIENT_ID,
    });
    const payload = ticket.getPayload();
    const role = payload.email === ADMIN_EMAIL ? 'admin' : 'user';

    res.cookie('session_role', role, { httpOnly: true });
    res.json({ role });
  } catch (err) {
    console.error('Token verification failed:', err);
    res.status(401).json({ error: 'Invalid token' });
  }
});

// ✅ Save bulk locations from user
app.post('/api/locations/bulk', (req, res) => {
  const { email, locations } = req.body;

  if (!email || !Array.isArray(locations)) {
    return res.status(400).json({ error: 'Invalid payload' });
  }

  const tagged = locations.map((loc) => ({ ...loc, email }));
  LOCATIONS.push(...tagged);
  console.log(`✅ Synced ${tagged.length} locations from ${email}`);
  res.status(200).json({ message: 'Locations saved' });
});

// ✅ Get all or filtered locations
app.get('/api/locations', (req, res) => {
  const { email } = req.query;
  console.log(`[GET] Fetching locations for ${email || 'admin (all)'}`);
  if (email) {
    return res.json(LOCATIONS.filter(loc => loc.email === email));
  }
  res.json(LOCATIONS); // Admin sees all
});

// ✅ Delete a location (by index)
app.delete('/api/locations/:index', (req, res) => {
  const { index } = req.params;
  const { email } = req.query;

  const idx = parseInt(index);
  if (isNaN(idx) || idx < 0 || idx >= LOCATIONS.length) {
    return res.status(400).json({ error: 'Invalid index' });
  }

  // ✅ Allow delete if user is owner OR admin
  if (email && LOCATIONS[idx].email !== email && email !== ADMIN_EMAIL) {
    return res.status(403).json({ error: 'Forbidden' });
  }

  LOCATIONS.splice(idx, 1);
  res.json({ message: 'Location deleted' });
});

// ✅ Secure route test (optional)
app.get('/api/secure-data', (req, res) => {
  const role = req.cookies.session_role;
  if (!role) return res.status(401).send('Unauthorized');
  res.json({ message: `Hello ${role}`, role });
});

app.listen(PORT, () => console.log(`🚀 Server running at http://localhost:${PORT}`));

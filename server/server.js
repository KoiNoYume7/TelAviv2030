import express from 'express';
import session from 'express-session';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import db from './db/db.js';

// Load environment variables
dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 4300;

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'change-me-in-env',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  }
}));

// API Routes — MUST come before static/SPA fallback
app.use('/api/auth', (await import('./routes/auth.js')).default);
app.use('/api/members', (await import('./routes/members.js')).default);
app.use('/api/contributions', (await import('./routes/contributions.js')).default);
app.use('/api/cashouts', (await import('./routes/cashouts.js')).default);
app.use('/api/discord', (await import('./routes/discord.js')).default);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// Serve static files — built client is deployed alongside server.js
// (deploy copies dist/* into the same directory as server.js)
app.use(express.static(path.join(__dirname, '.')));

// SPA fallback for hash-based routing (belt-and-suspenders — hash routes
// never actually reach the server, but this handles direct path nav too)
app.get(/^(?!\/api\/).*$/, (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

// Error handling
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Start server
app.listen(PORT, () => {
  console.log(`TelAviv server running on port ${PORT}`);
});

/**
 * PawFund — Dog Adoption System
 * Main server entry point
 */
require('dotenv').config({ path: require('path').join(__dirname, '.env') });
const express      = require('express');
const session      = require('express-session');
const cors         = require('cors');
const path         = require('path');
const fs           = require('fs');

const app = express();
app.set('trust proxy', 1);
const PORT = process.env.PORT || 3000;

/* ── Ensure upload directories exist ── */
['img', 'banners', 'followups'].forEach(dir => {
  const p = path.join(__dirname, '../frontend', dir);
  if (!fs.existsSync(p)) fs.mkdirSync(p, { recursive: true });
});

/* ── Middleware ── */
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Allow external image sources (for internet image URLs stored in DB)
app.use((req, res, next) => {
  res.setHeader(
    'Content-Security-Policy',
    "default-src 'self'; img-src 'self' data: https: http:; script-src 'self' 'unsafe-inline' https://fonts.googleapis.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://fonts.gstatic.com; font-src 'self' https://fonts.gstatic.com; connect-src 'self'"
  );
  next();
});
app.use(session({
  secret: process.env.SESSION_SECRET || 'pawfund_dev_secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true,
    secure: true,          // 🔥 บังคับใช้ https
    sameSite: 'none',      // 🔥 สำคัญมาก
    maxAge: 24 * 60 * 60 * 1000,
  },
}));

/* ── Serve static frontend ── */
app.use(express.static(path.join(__dirname, '../frontend')));

/* ── Root redirect → pages/index.html ── */
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

/* ── API Routes ── */
app.use('/api/auth',       require('./routes/auth'));
app.use('/api/dogs',       require('./routes/dogs'));
app.use('/api/favourites', require('./routes/favourites'));
app.use('/api/adoptions',  require('./routes/adoptions'));
app.use('/api/appointments', require('./routes/appointments'));
app.use('/api/checkups',   require('./routes/checkups'));
app.use('/api/verify',     require('./routes/verify'));
app.use('/api/sponsors',   require('./routes/sponsors'));
app.use('/api/reports',    require('./routes/reports'));
app.use('/api/notifications', require('./routes/notifications'));

/* ── Health check ── */
app.get('/api/health', (req, res) => res.json({ status: 'ok', timestamp: new Date() }));

/* ── SPA fallback — serve pages/index.html for non-API routes ── */
app.get('*', (req, res) => {
  if (req.path.startsWith('/api')) {
    return res.status(404).json({ message: 'API endpoint not found' });
  }
  res.sendFile(path.join(__dirname, '../frontend/pages/index.html'));
});

/* ── Start server ── */
app.listen(PORT, () => {
  console.log(`\n🐾 PawFund server running at http://localhost:${PORT}`);
  console.log(`   Environment : ${process.env.NODE_ENV || 'development'}`);
  console.log(`   Database    : ${process.env.DB_NAME || 'dog_adoption_db'} @ ${process.env.DB_HOST || 'localhost'}\n`);
});

module.exports = app;

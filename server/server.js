require('dotenv').config();
require('express-async-errors');
const express      = require('express');
const mongoose     = require('mongoose');
const cors         = require('cors');
const path         = require('path');
const compression  = require('compression');
const session      = require('express-session');
const MongoStore   = require('connect-mongo');

const app = express();
const { startEmailWorker } = require('./utils/emailWorker');

/* ── Performance: gzip compression for all responses ── */
app.use(compression({ level: 6, threshold: 1024 }));

const allowedOrigins = [
  process.env.CLIENT_URL || 'http://localhost:3000',
  'https://arab-fertilizer.vercel.app',
].filter(Boolean);

app.use(cors({
  origin: (origin, cb) => {
    if (!origin || allowedOrigins.includes(origin)) return cb(null, true);
    cb(new Error('Not allowed by CORS'));
  },
  credentials: true,
}));

/* ── Fix Cross-Origin-Opener-Policy for Google Identity Services popup ── */
app.use((req, res, next) => {
  res.setHeader('Cross-Origin-Opener-Policy', 'same-origin-allow-popups');
  res.setHeader('Cross-Origin-Embedder-Policy', 'unsafe-none');
  next();
});

app.use(express.json({ limit: '5mb' }));
app.use(express.urlencoded({ extended: true, limit: '5mb' }));
app.use('/uploads', express.static(path.join(__dirname, 'uploads'), { maxAge: '7d' }));

/* ── Session middleware (MongoDB-backed, HTTP-only cookie) ── */
app.use(session({
  secret: process.env.SESSION_SECRET || 'af_session_secret_change_in_production',
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: process.env.MONGODB_URI || 'mongodb://localhost:27017/arab-fertilizer',
    collectionName: 'sessions',
    ttl: 30 * 24 * 60 * 60,
    autoRemove: 'native',
  }),
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax',
    maxAge: 30 * 24 * 60 * 60 * 1000,
  },
  name: 'af.sid',
}));

/* ── TEMPORARY DEBUG ROUTE — place BEFORE all other routes ── */
/* ── Remove this after confirming email works              ── */
app.get("/debug-email", async (req, res) => {
  try {
    const nodemailer = require("nodemailer");

    // Step 1: check env vars exist
    if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
      return res.json({
        success: false,
        error: "EMAIL_USER or EMAIL_PASS is not set in Render environment variables",
        EMAIL_USER: process.env.EMAIL_USER || "NOT SET",
        EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
      });
    }

    // Step 2: try to send
    const transporter = nodemailer.createTransport({
      service: "gmail",
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
      },
    });

    const info = await transporter.sendMail({
      from: `"Arab Fertilizers" <${process.env.EMAIL_USER}>`,
      to: "ayeshajavid310@gmail.com",
      subject: "Debug Test — Arab Fertilizers",
      html: "<p>If you see this, Nodemailer is working correctly!</p>",
    });

    res.json({
      success: true,
      messageId: info.messageId,
      EMAIL_USER: process.env.EMAIL_USER,
      EMAIL_PASS_LENGTH: process.env.EMAIL_PASS.length,
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message,
      EMAIL_USER: process.env.EMAIL_USER || "NOT SET",
      EMAIL_PASS_SET: !!process.env.EMAIL_PASS,
      EMAIL_PASS_LENGTH: (process.env.EMAIL_PASS || "").length,
    });
  }
});

/* ── Routes ── */
app.use('/api/auth',          require('./routes/auth'));
app.use('/api/products',      require('./routes/products'));
app.use('/api/orders',        require('./routes/orders'));
app.use('/api/vendors',       require('./routes/vendor'));
app.use('/api/admin',         require('./routes/admin'));
app.use('/api/employees',     require('./routes/employee'));
app.use('/api/notifications', require('./routes/notifications'));
app.use('/api/expenses',      require('./routes/expenses'));
app.use('/api/fuel',          require('./routes/fuel'));
app.use('/api/dealers',       require('./routes/dealers'));

/* ── Health check ── */
app.get('/api/health', (req, res) => {
  res.json({
    success: true,
    mongodb: mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Disconnected',
    adminSecret: !!process.env.ADMIN_SECRET,
    emailUser: process.env.EMAIL_USER || 'NOT SET',
    emailPassSet: !!process.env.EMAIL_PASS,
  });
});

/* ── Global error handler ── */
app.use((err, req, res, next) => {
  console.error('❌', err.message);
  res.status(err.status || 500).json({ success: false, message: err.message });
});

/* ── MongoDB connect ── */
const PORT = process.env.PORT || 5000;
let uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/arab-fertilizer';

/* Auto-convert old multi-shard Atlas URI to +srv format */
if (uri.includes('shard-00-00') && !uri.startsWith('mongodb+srv')) {
  const credMatch    = uri.match(/mongodb:\/\/([^@]+)@/);
  const hostMatch    = uri.match(/\.([a-z0-9]+\.mongodb\.net)/);
  const clusterMatch = uri.match(/(ac-[a-z0-9]+)\./);
  const dbMatch      = uri.match(/\/([^?]+)\?/);
  if (credMatch && hostMatch && clusterMatch) {
    uri = `mongodb+srv://${credMatch[1]}@${clusterMatch[1]}.${hostMatch[1]}/${dbMatch?.[1] || 'arab_fertilizer'}?retryWrites=true&w=majority`;
    console.log('🔄 Auto-converted URI to SRV format');
  }
}

mongoose.connect(uri, {
  serverSelectionTimeoutMS: 10000,
  socketTimeoutMS: 30000,
  maxPoolSize: 10,
  minPoolSize: 2,
  maxIdleTimeMS: 30000,
})
  .then(() => {
    console.log('✅ MongoDB Connected');
    startEmailWorker();
    app.listen(PORT, () => console.log(`🚀 Server on http://localhost:${PORT}`));
  })
  .catch(err => {
    console.error('❌ MongoDB connection FAILED:', err.message);
    console.error('\n👉 Most likely fix: In Atlas → Network Access → Add IP → Allow From Anywhere (0.0.0.0/0)\n');
    console.error('🛑 Server will NOT start without a database connection.\n');
    process.exit(1);
  });

module.exports = app;
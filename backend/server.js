require('dotenv').config();

const dns = require('dns');
dns.setServers(['8.8.8.8']);

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const session = require('express-session');
const MongoStore = require('connect-mongo').default;

const app = express();
const PORT = process.env.PORT || 5000;
const MONGO_URI = process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/financeDB';
const SESSION_SECRET = process.env.SESSION_SECRET || 'dev-session-secret-change-me';

if (!process.env.SESSION_SECRET) {
  console.warn('⚠️ SESSION_SECRET was not set, using a development fallback.');
}

app.use(cors({
  origin: ['http://localhost:5173', 'http://127.0.0.1:5173'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: MongoStore.create({
    mongoUrl: MONGO_URI,
    collectionName: 'sessions',
    ttl: 14 * 24 * 60 * 60
  }),
  cookie: {
    maxAge: 1000 * 60 * 60 * 24 * 7,
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax'
  }
}));

app.use((req, res, next) => {
  const authStatus = req.session && req.session.userId ? 'Authenticated' : 'Guest';
  console.log(`📡 [${req.method}] ${req.url} | Status: ${authStatus}`);
  next();
});

mongoose.connect(MONGO_URI)
  .then(() => console.log('✅ MongoDB Connected'))
  .catch(err => console.error('❌ MongoDB Connection Error:', err));

app.use('/api/auth', require('./routes/auth'));
app.use('/api/transactions', require('./routes/transactions'));
app.use('/api/budgets', require('./routes/budgets'));
app.use('/api/investments', require('./routes/investments'));
app.use('/api/goals', require('./routes/goals'));
app.use('/api/export', require('./routes/export'));
app.use('/api/analytics', require('./routes/analytics'));
app.use('/api/predictions', require('./routes/predictions'));

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});

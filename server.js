require('dotenv').config();
const express = require('express');
const session = require('express-session');
const methodOverride = require('method-override');
const path = require('path');
const connectDB = require('./config/db');
const logger = require('./middleware/logger');

// Connect to MongoDB
connectDB();

const app = express();

// View engine
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Body parser
app.use(express.urlencoded({ extended: false }));
app.use(express.json());

// Method override (allows PUT/DELETE from forms via ?_method=)
app.use(methodOverride('_method'));

// Static files
app.use(express.static(path.join(__dirname, 'public')));

// Session middleware
app.use(session({
  secret: process.env.SESSION_SECRET || 'smarthome_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 1000 * 60 * 60 * 24 } // 1 day
}));

// Accountability: log every request/response to MongoDB
app.use(logger);

// Make session user available in all EJS templates
app.use((req, res, next) => {
  res.locals.user = req.session.user || null;
  next();
});

// Routes
app.use('/', require('./routes/authRoutes'));
app.use('/items', require('./routes/itemRoutes'));
app.use('/api', require('./routes/apiRoutes'));
app.use('/admin', require('./routes/adminRoutes'));

// 404 handler
app.use((req, res) => {
  res.status(404).render('error', { message: 'Page not found (404)' });
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

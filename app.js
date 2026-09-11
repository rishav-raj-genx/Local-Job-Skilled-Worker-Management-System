const express = require('express');
const path = require('path');
const cookieParser = require('cookie-parser');
const morgan = require('morgan');
const helmet = require('helmet');
require('dotenv').config();

const { resolveUser, flashMiddleware } = require('./middleware/auth');
const { notFoundHandler, errorHandler } = require('./middleware/errorHandler');

// Route imports
const authRoutes = require('./routes/authRoutes');
const customerRoutes = require('./routes/customerRoutes');
const workerRoutes = require('./routes/workerRoutes');
const adminRoutes = require('./routes/adminRoutes');
const publicRoutes = require('./routes/publicRoutes');

const app = express();

// View engine setup
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));

// Static assets
app.use('/public', express.static(path.join(__dirname, 'public')));

// Security & logging
app.use(
  helmet({
    contentSecurityPolicy: false // Allows CDN fonts, styles & inline interaction scripts
  })
);
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Request parsers
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

// Auth & Flash middleware
app.use(flashMiddleware);
app.use(resolveUser);

// Make app details available in templates
app.use((req, res, next) => {
  res.locals.appName = 'Skilled Worker Hub';
  res.locals.appYear = new Date().getFullYear();
  next();
});

// Mount routes
app.use('/auth', authRoutes);
app.use('/customer', customerRoutes);
app.use('/worker', workerRoutes);
app.use('/admin', adminRoutes);
app.use('/', publicRoutes);

// Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;

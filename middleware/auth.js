const jwt = require('jsonwebtoken');
const User = require('../models/User');

const JWT_SECRET = process.env.JWT_SECRET || 'hackathon_super_secret_jwt_key_ps7_skilled_workers_2026';

// Middleware to resolve user from JWT cookie and make available in views
const resolveUser = async (req, res, next) => {
  try {
    const token = req.cookies?.token || (req.headers.authorization?.startsWith('Bearer ') ? req.headers.authorization.split(' ')[1] : null);

    if (!token) {
      req.user = null;
      res.locals.currentUser = null;
      return next();
    }

    const decoded = jwt.verify(token, JWT_SECRET);
    const user = await User.findById(decoded.id).select('-password');

    if (!user || !user.isActive) {
      res.clearCookie('token');
      req.user = null;
      res.locals.currentUser = null;
      return next();
    }

    req.user = user;
    res.locals.currentUser = user;
    next();
  } catch (err) {
    res.clearCookie('token');
    req.user = null;
    res.locals.currentUser = null;
    next();
  }
};

// Middleware requiring authenticated session
const requireAuth = (req, res, next) => {
  if (!req.user) {
    // If request accepts HTML, redirect to login
    if (req.accepts('html')) {
      const returnUrl = encodeURIComponent(req.originalUrl);
      return res.redirect(`/auth/login?error=Please+log+in+to+continue&redirect=${returnUrl}`);
    }
    return res.status(401).json({ success: false, message: 'Authentication required' });
  }
  next();
};

// Helper to generate and set JWT token cookie
const setAuthCookie = (res, user) => {
  const token = jwt.sign(
    { id: user._id, role: user.role, email: user.email },
    JWT_SECRET,
    { expiresIn: '7d' }
  );

  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });

  return token;
};

// Flash messages cookie helper (lightweight, zero-session requirement for Vercel)
const flashMiddleware = (req, res, next) => {
  const flashCookie = req.cookies?.flash_message;
  if (flashCookie) {
    try {
      res.locals.flash = JSON.parse(flashCookie);
    } catch {
      res.locals.flash = null;
    }
    res.clearCookie('flash_message');
  } else {
    res.locals.flash = null;
  }

  // Helper method on res
  res.setFlash = (type, message) => {
    res.cookie('flash_message', JSON.stringify({ type, message }), {
      httpOnly: false,
      maxAge: 15000,
      sameSite: 'lax'
    });
  };

  res.locals.currentPath = req.path;
  next();
};

module.exports = {
  resolveUser,
  requireAuth,
  setAuthCookie,
  flashMiddleware
};

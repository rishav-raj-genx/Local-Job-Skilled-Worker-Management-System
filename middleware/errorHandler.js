// Not Found Handler
const notFoundHandler = (req, res, next) => {
  res.status(404);
  if (req.accepts('html')) {
    return res.render('errors/404', {
      title: '404 - Page Not Found',
      url: req.originalUrl,
      user: req.user || null
    });
  }
  res.json({ success: false, message: 'Resource not found' });
};

// Global Server Error Handler
const errorHandler = (err, req, res, next) => {
  console.error(`[Error] ${req.method} ${req.url}:`, err.stack || err.message);

  const statusCode = res.statusCode >= 400 ? res.statusCode : 500;
  res.status(statusCode);

  if (req.accepts('html')) {
    return res.render('errors/500', {
      title: '500 - Server Error',
      message: process.env.NODE_ENV === 'production'
        ? 'An unexpected error occurred on the server. Please try again later.'
        : err.message,
      stack: process.env.NODE_ENV === 'production' ? null : err.stack,
      user: req.user || null
    });
  }

  res.json({
    success: false,
    message: err.message || 'Internal server error',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
};

module.exports = {
  notFoundHandler,
  errorHandler
};

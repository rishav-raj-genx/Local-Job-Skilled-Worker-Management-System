// Middleware to enforce specific user roles
const requireRole = (...roles) => {
  return (req, res, next) => {
    if (!req.user) {
      if (req.accepts('html')) {
        return res.redirect('/auth/login?error=Please+log+in+to+continue');
      }
      return res.status(401).json({ success: false, message: 'Authentication required' });
    }

    if (!roles.includes(req.user.role)) {
      if (req.accepts('html')) {
        return res.status(403).render('errors/403', {
          title: '403 - Access Forbidden',
          message: `Access denied. Your account role (${req.user.role}) is not authorized to access this resource.`,
          user: req.user
        });
      }
      return res.status(403).json({ success: false, message: 'Forbidden: Insufficient permissions' });
    }

    next();
  };
};

// Redirect users already authenticated away from login/register
const redirectIfAuthenticated = (req, res, next) => {
  if (req.user) {
    if (req.user.role === 'admin') return res.redirect('/admin/dashboard');
    if (req.user.role === 'worker') return res.redirect('/worker/dashboard');
    return res.redirect('/customer/dashboard');
  }
  next();
};

module.exports = {
  requireRole,
  redirectIfAuthenticated
};

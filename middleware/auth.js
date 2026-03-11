// middleware/auth.js
// Authentication and Authorization middleware

// Check if the user is logged in
exports.isAuthenticated = (req, res, next) => {
  if (req.session && req.session.user) return next();
  res.redirect('/login');
};

// Check if the logged-in user has one of the required roles
// Usage: hasRole('admin', 'member')
exports.hasRole = (...roles) => (req, res, next) => {
  if (!req.session || !req.session.user) {
    return res.redirect('/login');
  }
  if (roles.includes(req.session.user.role)) {
    return next();
  }
  res.status(403).render('error', {
    message: `Access Denied: Your role (${req.session.user.role}) does not have permission to view this page.`
  });
};

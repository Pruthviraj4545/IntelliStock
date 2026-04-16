const csrf = require('csurf');

// CSRF middleware with cookie-based token
const csrfMiddleware = csrf({
  cookie: {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 24 * 60 * 60 * 1000 // 1 day
  }
});

// Get CSRF token endpoint (must be GET to read cookie)
const getCsrfToken = (req, res, next) => {
  res.json({ csrfToken: req.csrfToken() });
};

// Skip CSRF for public routes
const skipCSRF = (req, res, next) => {
  // For development/testing, skip CSRF entirely
  // TODO: Re-enable proper CSRF for production
  console.log(`[CSRF SKIPPED] ${req.method} ${req.path}`);
  return next();
};

module.exports = {
  csrfMiddleware,
  getCsrfToken,
  skipCSRF
};

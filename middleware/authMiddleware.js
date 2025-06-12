// arogya-mcvk/backend/middleware/authMiddleware.js
const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Assuming your User model is in ../models/User
// Load .env variables. Ensure this path is correct relative to where the script is run from (usually project root for server.js)
// For middleware, it's safer if server.js (which calls this) has already loaded dotenv.
// However, explicitly loading here can be a fallback.
require('dotenv').config({ path: __dirname + '/../.env' });

const JWT_SECRET = process.env.JWT_SECRET;

/**
 * Protect routes by verifying JWT.
 * Attaches user object (without password) to req.user if token is valid.
 */
exports.protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Get token from header (e.g., "Bearer <token>")
      token = req.headers.authorization.split(' ')[1];

      if (!JWT_SECRET) {
        console.error('JWT_SECRET is not defined. Please check your .env file.');
        return res.status(500).json({ msg: 'Server configuration error.' });
      }

      // Verify token
      const decoded = jwt.verify(token, JWT_SECRET);

      // Get user from the token's ID and attach to request object
      // Exclude password from being attached to req.user
      req.user = await User.findById(decoded.id).select('-password');

      if (!req.user) {
        return res.status(401).json({ msg: 'Not authorized, user not found for this token.' });
      }
      next(); // Proceed to the next middleware or route handler
    } catch (error) {
      console.error('Token verification failed:', error.message);
      // Handle specific JWT errors
      if (error.name === 'JsonWebTokenError') {
        return res.status(401).json({ msg: 'Not authorized, invalid token.' });
      }
      if (error.name === 'TokenExpiredError') {
        return res.status(401).json({ msg: 'Not authorized, token expired.' });
      }
      return res.status(401).json({ msg: 'Not authorized, token failed.' });
    }
  }

  if (!token) {
    return res.status(401).json({ msg: 'Not authorized, no token provided.' });
  }
};

/**
 * Grant access to specific roles.
 * This middleware should be used AFTER the `protect` middleware.
 * @param {...string} roles - Allowed roles.
 */
exports.authorize = (...roles) => {
  return (req, res, next) => {
    if (!req.user) { // Should be set by 'protect' middleware
        return res.status(401).json({ msg: 'Not authorized, user data missing.' });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ // 403 Forbidden
        msg: `User role '${req.user.role}' is not authorized to access this resource. Required roles: ${roles.join(', ')}.`,
      });
    }
    next();
  };
};
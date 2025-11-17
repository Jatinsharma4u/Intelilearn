// backend/middleware/rate-limiter.js (temporary fix)
const rateLimit = require('express-rate-limit');

// Simple rate limiter without IPv6 issues
const createBasicLimiter = (windowMs, max, message) => {
  return rateLimit({
    windowMs,
    max,
    message: { success: false, message },
    standardHeaders: true,
    legacyHeaders: false,
    keyGenerator: (req) => {
      // Use user ID if available, else use IP (simplified)
      return req.user?.uid || req.ip || 'anonymous';
    }
  });
};

// General API rate limiter
const generalLimiter = createBasicLimiter(
  15 * 60 * 1000, // 15 minutes
  100, // 100 requests
  'Too many requests from this IP, please try again after 15 minutes.'
);

// AI Service rate limiter
const aiServiceLimiter = createBasicLimiter(
  60 * 1000, // 1 minute
  5, // 5 requests per minute
  'Too many AI requests. Please wait a moment.'
);

// File upload rate limiter
const uploadLimiter = createBasicLimiter(
  60 * 60 * 1000, // 1 hour
  3, // 3 uploads per hour
  'Too many file uploads. Please try again in an hour.'
);

// Authentication rate limiter
const authLimiter = createBasicLimiter(
  15 * 60 * 1000, // 15 minutes
  5, // 5 attempts
  'Too many authentication attempts. Please try again after 15 minutes.'
);

module.exports = {
  generalLimiter,
  aiServiceLimiter,
  uploadLimiter,
  authLimiter
};
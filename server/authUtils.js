const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('./db'); // Required for database access

const SALT_ROUNDS = 10;
const JWT_SECRET = process.env.JWT_SECRET; // Use a strong, environment-specific secret

if (!JWT_SECRET) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Please set this environment variable.');
  process.exit(1);
}

/**
 * Hashes a plain-text password.
 * @param {string} password - The plain-text password.
 * @returns {Promise<string>} - The hashed password.
 */
async function hashPassword(password) {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain-text password with a hashed password.
 * @param {string} plainPassword - The plain-text password.
 * @param {string} hashedPassword - The hashed password.
 * @returns {Promise<boolean>} - True if passwords match, false otherwise.
 */
async function comparePasswords(plainPassword, hashedPassword) {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generates a JSON Web Token.
 * @param {object} payload - The payload to encode in the token (e.g., user ID, role).
 * @returns {string} - The generated JWT.
 */
function generateToken(payload) {
  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' }); // Token expires in 1 hour
}

/**
 * Verifies a JSON Web Token.
 * @param {string} token - The JWT to verify.
 * @returns {object | null} - The decoded payload if valid, null otherwise.
 */
function verifyToken(token) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (error) {
    return null; // Token is invalid or expired
  }
}

/**
 * Middleware to authenticate JWT token.
 * @param {object} req - Express request object.
 * @param {object} res - Express response object.
 * @param {function} next - Express next middleware function.
 */
function authenticateToken(req, res, next) {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (token == null) {
    return res.status(401).json({ error: 'Authentication token required' });
  }

  const user = verifyToken(token);
  if (!user) {
    return res.status(403).json({ error: 'Invalid or expired token' });
  }

  req.user = user; // Attach user payload to the request
  next();
}

/**
 * Middleware to check if the authenticated user is an administrator.
 * Assumes authenticateToken has already run and req.user is populated.
 */
function checkAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: 'Access denied: Admin role required' });
  }
  next();
}

/**
 * Middleware to protect the registration endpoint.
 * Allows registration only if no admin user exists (initial setup)
 * or if the request is made by an authenticated admin.
 */
async function protectRegisterEndpoint(req, res, next) {
  try {
    const { rows } = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    const adminCount = parseInt(rows[0].count, 10);

    if (adminCount === 0) {
      // No admin exists, allow initial admin registration to proceed.
      return next();
    }

    // An admin exists, so registration requires admin privileges.
    // We chain the authentication and admin check middleware.
    authenticateToken(req, res, () => {
      checkAdmin(req, res, next);
    });
  } catch (err) {
    console.error('Error in protectRegisterEndpoint middleware:', err.stack);
    res.status(500).json({ error: 'Internal server error' });
  }
}

module.exports = {
  hashPassword,
  comparePasswords,
  generateToken,
  verifyToken,
  authenticateToken,
  checkAdmin,
  protectRegisterEndpoint,
};
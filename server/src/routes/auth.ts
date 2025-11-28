/**
 * Authentication routes
 * Handles user registration, login, and setup status
 */

import express, { Response } from 'express';
import crypto from 'crypto';
import { query, pool } from '../db';
import * as authUtils from '../utils/authUtils';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateUser } from '../middleware/validation';
import { AuthRequest } from '../types/express';
import { User, UserResponse, LoginRequest } from '../types/user';
import config from '../config';

const router = express.Router();

// Check if initial admin setup has been completed
router.get('/setup-status', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { rows } = await query<{ count: string }>(
    "SELECT COUNT(*) FROM users WHERE role = 'admin'"
  );
  const adminCount = parseInt(rows[0].count, 10);
  res.json({ isSetupNeeded: adminCount === 0 });
}));

// Register a new user
router.post('/register',
  authUtils.protectRegisterEndpoint,
  validateUser,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { username, password, role } = req.body;

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const hashedPassword = await authUtils.hashPassword(password);
      const userResult = await client.query<UserResponse>(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3) RETURNING id, username, role',
        [username, hashedPassword, role || 'member']
      );
      const newUser = userResult.rows[0];

      // Also create a corresponding member entry
      await client.query(
        'INSERT INTO members (name, email) VALUES ($1, $2)',
        [newUser.username, `${newUser.username}@library.app`]
      );

      await client.query('COMMIT');
      res.status(201).json({
        message: 'User and member registered successfully',
        user: newUser
      });

    } catch (err: any) {
      await client.query('ROLLBACK');
      if (err.code === '23505') { // Unique violation
        res.status(409).json({ error: 'Username or email already exists' });
        return;
      }
      throw err; // Let error middleware handle it
    } finally {
      client.release();
    }
  })
);

// Login user
router.post('/login', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username, password } = req.body as LoginRequest;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  const { rows } = await query<User>('SELECT * FROM users WHERE username = $1', [username]);
  const user = rows[0];

  if (!user) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  const isPasswordValid = await authUtils.comparePasswords(password, user.password_hash);

  if (!isPasswordValid) {
    res.status(401).json({ error: 'Invalid credentials' });
    return;
  }

  // Generate token with user information
  const token = authUtils.generateToken({
    userId: user.id,
    username: user.username,
    role: user.role
  });

  res.json({
    message: 'Logged in successfully',
    token,
    user: { id: user.id, username: user.username, role: user.role },
  });
}));

// Request password reset
router.post('/forgot-password', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { username } = req.body;

  if (!username) {
    throw new AppError('Username is required', 400);
  }

  const { rows } = await query<Pick<User, 'id' | 'username'>>(
    'SELECT id, username FROM users WHERE username = $1',
    [username]
  );
  const user = rows[0];

  // Always return success to prevent username enumeration
  if (!user) {
    res.json({
      message: 'If a user with that username exists, a password reset link has been generated.'
    });
    return;
  }

  // Generate reset token (32 random bytes as hex string)
  const resetToken = crypto.randomBytes(32).toString('hex');

  // Set token expiry to 1 hour from now
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  // Store hashed token in database
  const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');

  await query(
    'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
    [hashedToken, expiresAt, user.id]
  );

  // NOTE: In production, you would send an email here with the reset link
  // For development, we'll return the token in the response
  // Example reset URL: http://localhost:3000/reset-password?token=RESET_TOKEN

  res.json({
    message: 'If a user with that username exists, a password reset link has been generated.',
    // Only include this in development mode
    ...(config.nodeEnv === 'development' && { resetToken, username: user.username })
  });
}));

// Reset password with token
router.post('/reset-password', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { token, newPassword } = req.body;

  if (!token || !newPassword) {
    throw new AppError('Token and new password are required', 400);
  }

  if (newPassword.length < 6) {
    throw new AppError('Password must be at least 6 characters', 400);
  }

  // Hash the provided token to compare with stored hash
  const hashedToken = crypto.createHash('sha256').update(token).digest('hex');

  // Find user with valid token
  const { rows } = await query<Pick<User, 'id' | 'username'>>(
    'SELECT id, username FROM users WHERE reset_token = $1 AND reset_token_expires > NOW()',
    [hashedToken]
  );

  const user = rows[0];

  if (!user) {
    throw new AppError('Invalid or expired reset token', 400);
  }

  // Hash new password and update user
  const hashedPassword = await authUtils.hashPassword(newPassword);

  await query(
    'UPDATE users SET password_hash = $1, reset_token = NULL, reset_token_expires = NULL WHERE id = $2',
    [hashedPassword, user.id]
  );

  res.json({
    message: 'Password reset successfully. You can now log in with your new password.',
    username: user.username
  });
}));

export default router;

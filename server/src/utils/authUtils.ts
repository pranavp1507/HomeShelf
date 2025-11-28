/**
 * Authentication utilities - password hashing, JWT generation and validation
 */

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import { JwtPayload } from '../types/user';
import { query } from '../db';
import config from '../config';

const SALT_ROUNDS = 10;

if (!config.jwtSecret) {
  console.error('FATAL ERROR: JWT_SECRET is not defined. Please set this environment variable.');
  process.exit(1);
}

/**
 * Hashes a plain-text password.
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * Compares a plain-text password with a hashed password.
 */
export async function comparePasswords(
  plainPassword: string,
  hashedPassword: string
): Promise<boolean> {
  return bcrypt.compare(plainPassword, hashedPassword);
}

/**
 * Generates a JSON Web Token.
 */
export function generateToken(payload: Omit<JwtPayload, 'iat' | 'exp'>): string {
  return jwt.sign(payload, config.jwtSecret, { expiresIn: '1h' });
}

/**
 * Verifies a JSON Web Token.
 * Returns the decoded payload if valid, null otherwise.
 */
export function verifyToken(token: string): JwtPayload | null {
  try {
    return jwt.verify(token, config.jwtSecret) as JwtPayload;
  } catch (error) {
    return null;
  }
}

/**
 * Middleware to authenticate JWT token.
 */
export function authenticateToken(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

  if (!token) {
    res.status(401).json({ error: 'Authentication token required' });
    return;
  }

  const user = verifyToken(token);
  if (!user) {
    res.status(403).json({ error: 'Invalid or expired token' });
    return;
  }

  req.user = user;
  next();
}

/**
 * Middleware to check if the authenticated user is an administrator.
 * Assumes authenticateToken has already run and req.user is populated.
 */
export function checkAdmin(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void {
  if (!req.user || req.user.role !== 'admin') {
    res.status(403).json({ error: 'Access denied: Admin role required' });
    return;
  }
  next();
}

/**
 * Middleware to protect the registration endpoint.
 * Allows registration only if no admin user exists (initial setup)
 * or if the request is made by an authenticated admin.
 */
export async function protectRegisterEndpoint(
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const { rows } = await query<{ count: string }>(
      "SELECT COUNT(*) FROM users WHERE role = 'admin'"
    );
    const adminCount = parseInt(rows[0].count, 10);

    if (adminCount === 0) {
      // No admin exists, allow initial admin registration to proceed.
      next();
      return;
    }

    // An admin exists, so registration requires admin privileges.
    authenticateToken(req, res, () => {
      checkAdmin(req, res, next);
    });
  } catch (err) {
    console.error('Error in protectRegisterEndpoint middleware:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
}

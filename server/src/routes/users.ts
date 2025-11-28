/**
 * Users routes
 * Handles user management operations (admin-only)
 */

import express, { Response } from 'express';
import { query } from '../db';
import * as authUtils from '../utils/authUtils';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateUser } from '../middleware/validation';
import { AuthRequest } from '../types/express';
import { UserResponse } from '../types/user';

const router = express.Router();

interface CountResult {
  count: string;
}

interface RoleResult {
  role: 'admin' | 'member';
}

// Get all users (admin-only)
router.get('/',
  authUtils.authenticateToken,
  authUtils.checkAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { rows } = await query<UserResponse>(
      'SELECT id, username, role, created_at FROM users ORDER BY id ASC'
    );
    res.json(rows);
  })
);

// Update a user (admin-only)
router.put('/:id',
  authUtils.authenticateToken,
  authUtils.checkAdmin,
  validateUser,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { username, role } = req.body;
    const currentUserId = req.user?.userId;

    if (!username || !role) {
      throw new AppError('Username and role are required', 400);
    }

    // Prevent the last admin from removing their own admin role
    if (String(currentUserId) === id && role !== 'admin') {
      const { rows } = await query<CountResult>(
        "SELECT COUNT(*) FROM users WHERE role = 'admin'"
      );
      const adminCount = parseInt(rows[0].count, 10);
      if (adminCount <= 1) {
        throw new AppError('Cannot remove the last administrator role', 403);
      }
    }

    const { rows } = await query<UserResponse>(
      'UPDATE users SET username = $1, role = $2 WHERE id = $3 RETURNING id, username, role',
      [username, role, id]
    );

    if (rows.length === 0) {
      throw new AppError('User not found', 404);
    }

    res.json(rows[0]);
  })
);

// Delete a user (admin-only)
router.delete('/:id',
  authUtils.authenticateToken,
  authUtils.checkAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const currentUserId = req.user?.userId;

    if (String(currentUserId) === id) {
      throw new AppError('You cannot delete yourself', 403);
    }

    // Check if the user is the last admin
    const { rows } = await query<RoleResult>("SELECT role FROM users WHERE id = $1", [id]);
    if (rows.length > 0 && rows[0].role === 'admin') {
      const adminCountRes = await query<CountResult>(
        "SELECT COUNT(*) FROM users WHERE role = 'admin'"
      );
      if (parseInt(adminCountRes.rows[0].count, 10) <= 1) {
        throw new AppError('Cannot delete the last administrator', 403);
      }
    }

    const { rowCount } = await query('DELETE FROM users WHERE id = $1', [id]);
    if (!rowCount || rowCount === 0) {
      throw new AppError('User not found', 404);
    }

    res.status(204).send();
  })
);

// Change a user's password (admin-only)
router.put('/:id/password',
  authUtils.authenticateToken,
  authUtils.checkAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { password } = req.body;

    if (!password || password.length < 6) {
      throw new AppError('Password is required and must be at least 6 characters', 400);
    }

    const hashedPassword = await authUtils.hashPassword(password);
    const { rowCount } = await query(
      'UPDATE users SET password_hash = $1 WHERE id = $2',
      [hashedPassword, id]
    );

    if (!rowCount || rowCount === 0) {
      throw new AppError('User not found', 404);
    }

    res.status(200).json({ message: 'Password updated successfully' });
  })
);

export default router;

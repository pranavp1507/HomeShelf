/**
 * Categories routes
 * Handles category CRUD operations (admin-only for CUD)
 */

import express, { Response } from 'express';
import { query } from '../db';
import * as authUtils from '../utils/authUtils';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateCategory } from '../middleware/validation';
import { AuthRequest } from '../types/express';
import { Category } from '../types/category';

const router = express.Router();

// Get all categories
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { rows } = await query<Category>('SELECT * FROM categories ORDER BY name ASC');
  res.json(rows);
}));

// Create a new category (admin-only)
router.post('/',
  authUtils.authenticateToken,
  authUtils.checkAdmin,
  validateCategory,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name } = req.body;

    const { rows } = await query<Category>(
      'INSERT INTO categories (name) VALUES ($1) RETURNING *',
      [name]
    );

    res.status(201).json(rows[0]);
  })
);

// Update a category (admin-only)
router.put('/:id',
  authUtils.authenticateToken,
  authUtils.checkAdmin,
  validateCategory,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name } = req.body;

    const { rows } = await query<Category>(
      'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
      [name, id]
    );

    if (rows.length === 0) {
      throw new AppError('Category not found', 404);
    }

    res.json(rows[0]);
  })
);

// Delete a category (admin-only)
router.delete('/:id',
  authUtils.authenticateToken,
  authUtils.checkAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const { rowCount } = await query('DELETE FROM categories WHERE id = $1', [id]);

    if (!rowCount || rowCount === 0) {
      throw new AppError('Category not found', 404);
    }

    res.status(204).send();
  })
);

export default router;

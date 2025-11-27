/**
 * Categories routes
 * Handles category CRUD operations (admin-only for CUD)
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const authUtils = require('../authUtils');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validateCategory } = require('../middleware/validation');

// Get all categories
router.get('/', asyncHandler(async (req, res) => {
  const { rows } = await db.query('SELECT * FROM categories ORDER BY name ASC');
  res.json(rows);
}));

// Create a new category (admin-only)
router.post('/', authUtils.authenticateToken, authUtils.checkAdmin, validateCategory, asyncHandler(async (req, res) => {
  const { name } = req.body;

  const { rows } = await db.query(
    'INSERT INTO categories (name) VALUES ($1) RETURNING *',
    [name]
  );

  res.status(201).json(rows[0]);
}));

// Update a category (admin-only)
router.put('/:id', authUtils.authenticateToken, authUtils.checkAdmin, validateCategory, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name } = req.body;

  const { rows } = await db.query(
    'UPDATE categories SET name = $1 WHERE id = $2 RETURNING *',
    [name, id]
  );

  if (rows.length === 0) {
    throw new AppError('Category not found', 404);
  }

  res.json(rows[0]);
}));

// Delete a category (admin-only)
router.delete('/:id', authUtils.authenticateToken, authUtils.checkAdmin, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rowCount } = await db.query('DELETE FROM categories WHERE id = $1', [id]);

  if (rowCount === 0) {
    throw new AppError('Category not found', 404);
  }

  res.status(204).send();
}));

module.exports = router;

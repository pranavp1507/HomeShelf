/**
 * Members routes
 * Handles member CRUD operations
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const authUtils = require('../authUtils');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validateMember, validatePagination } = require('../middleware/validation');
const { csvUpload } = require('../utils/upload');
const { parse } = require('csv-parse/sync');

// Get all members with pagination and search
router.get('/', validatePagination, asyncHandler(async (req, res) => {
  const { sortBy, sortOrder, page, limit, search } = req.query;

  // Pagination parameters
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 25;
  const offset = (pageNum - 1) * limitNum;

  let query = 'SELECT * FROM members';
  const params = [];
  const conditions = [];
  let paramIndex = 1;

  // Search filter
  if (search) {
    conditions.push(`(LOWER(name) LIKE $${paramIndex} OR LOWER(email) LIKE $${paramIndex} OR LOWER(phone) LIKE $${paramIndex})`);
    params.push(`%${String(search).toLowerCase()}%`);
    paramIndex++;
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  // Get total count before pagination
  const countQuery = `SELECT COUNT(*) FROM members${conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''}`;
  const { rows: countRows } = await db.query(countQuery, params.slice(0, paramIndex - 1));
  const totalCount = parseInt(countRows[0].count, 10);

  const validSortColumns = ['name', 'email', 'id', 'created_at'];
  const finalSortBy = validSortColumns.includes(String(sortBy).toLowerCase()) ? String(sortBy) : 'id';
  const finalSortOrder = String(sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  query += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;

  // Add pagination
  query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limitNum, offset);

  const { rows } = await db.query(query, params);

  res.json({
    data: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      totalCount,
      totalPages: Math.ceil(totalCount / limitNum)
    }
  });
}));

// Get a specific member by ID
router.get('/:id', asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rows } = await db.query('SELECT * FROM members WHERE id = $1', [id]);

  if (rows.length === 0) {
    throw new AppError('Member not found', 404);
  }

  res.json(rows[0]);
}));

// Create a new member
router.post('/', authUtils.authenticateToken, validateMember, asyncHandler(async (req, res) => {
  const { name, email, phone } = req.body;

  const { rows } = await db.query(
    'INSERT INTO members (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
    [name, email, phone || null]
  );

  res.status(201).json(rows[0]);
}));

// Update a member
router.put('/:id', authUtils.authenticateToken, validateMember, asyncHandler(async (req, res) => {
  const { id } = req.params;
  const { name, email, phone } = req.body;

  const { rows } = await db.query(
    'UPDATE members SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
    [name, email, phone || null, id]
  );

  if (rows.length === 0) {
    throw new AppError('Member not found', 404);
  }

  res.json(rows[0]);
}));

// Delete a member
router.delete('/:id', authUtils.authenticateToken, asyncHandler(async (req, res) => {
  const { id } = req.params;

  const { rowCount } = await db.query('DELETE FROM members WHERE id = $1', [id]);

  if (rowCount === 0) {
    throw new AppError('Member not found', 404);
  }

  res.status(204).send();
}));

// Bulk import members from CSV
router.post('/bulk-import', authUtils.authenticateToken, csvUpload.single('file'), asyncHandler(async (req, res) => {
  if (!req.file) {
    throw new AppError('CSV file is required', 400);
  }

  let records;
  try {
    records = parse(req.file.buffer, {
      columns: true,
      skip_empty_lines: true,
      trim: true,
    });
  } catch {
    throw new AppError('Invalid CSV file format', 400);
  }

  const importedMembers = [];
  const errors = [];
  const client = await db.pool.connect();

  try {
    await client.query('BEGIN');

    for (const [index, record] of records.entries()) {
      const { name, email, phone } = record;

      if (!name || !email) {
        errors.push(`Row ${index + 2}: Missing required field (name/email)`);
        continue;
      }

      // Validate email format
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`Row ${index + 2}: Invalid email format: ${email}`);
        continue;
      }

      // Check for duplicate email
      const { rows: existingMembers } = await client.query(
        'SELECT id FROM members WHERE LOWER(email) = LOWER($1)',
        [email]
      );

      if (existingMembers.length > 0) {
        errors.push(`Row ${index + 2}: Member with email ${email} already exists`);
        continue;
      }

      // Insert member
      const { rows } = await client.query(
        'INSERT INTO members (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
        [name, email, phone || null]
      );

      importedMembers.push(rows[0]);
    }

    await client.query('COMMIT');

    const message = `Successfully imported ${importedMembers.length} member(s)${
      errors.length > 0 ? ` with ${errors.length} error(s)` : ''
    }`;

    res.json({
      message,
      imported: importedMembers.length,
      errors: errors.length > 0 ? errors : undefined,
    });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

module.exports = router;

/**
 * Members routes
 * Handles member CRUD operations
 */

import express, { Response } from 'express';
import { parse } from 'csv-parse/sync';
import { query, pool } from '../db';
import * as authUtils from '../utils/authUtils';
import { asyncHandler, AppError } from '../middleware/errorHandler';
import { validateMember, validatePagination } from '../middleware/validation';
import { csvUpload } from '../utils/fileUpload';
import { AuthRequest } from '../types/express';
import { Member, MemberQueryParams } from '../types/member';

const router = express.Router();

interface CountResult {
  count: string;
}

// Get all members with pagination and search
router.get('/', validatePagination, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { sortBy, sortOrder, page, limit, search } = req.query as MemberQueryParams;

  // Pagination parameters
  const pageNum = parseInt(page || '1', 10);
  const limitNum = parseInt(limit || '25', 10);
  const offset = (pageNum - 1) * limitNum;

  let queryText = 'SELECT * FROM members';
  const params: any[] = [];
  const conditions: string[] = [];
  let paramIndex = 1;

  // Search filter
  if (search) {
    conditions.push(`(LOWER(name) LIKE $${paramIndex} OR LOWER(email) LIKE $${paramIndex} OR LOWER(phone) LIKE $${paramIndex})`);
    params.push(`%${String(search).toLowerCase()}%`);
    paramIndex++;
  }

  if (conditions.length > 0) {
    queryText += ` WHERE ${conditions.join(' AND ')}`;
  }

  // Get total count before pagination
  const countQuery = `SELECT COUNT(*) FROM members${conditions.length > 0 ? ` WHERE ${conditions.join(' AND ')}` : ''}`;
  const { rows: countRows } = await query<CountResult>(countQuery, params.slice(0, paramIndex - 1));
  const totalCount = parseInt(countRows[0].count, 10);

  const validSortColumns = ['name', 'email', 'id', 'created_at'];
  const finalSortBy = validSortColumns.includes(String(sortBy).toLowerCase()) ? String(sortBy) : 'id';
  const finalSortOrder = String(sortOrder).toLowerCase() === 'desc' ? 'DESC' : 'ASC';

  queryText += ` ORDER BY ${finalSortBy} ${finalSortOrder}`;

  // Add pagination
  queryText += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
  params.push(limitNum, offset);

  const { rows } = await query<Member>(queryText, params);

  res.json({
    data: rows,
    pagination: {
      page: pageNum,
      limit: limitNum,
      total: totalCount,
      totalPages: Math.ceil(totalCount / limitNum)
    }
  });
}));

// Get a specific member by ID
router.get('/:id', asyncHandler(async (req: AuthRequest, res: Response) => {
  const { id } = req.params;

  const { rows } = await query<Member>('SELECT * FROM members WHERE id = $1', [id]);

  if (rows.length === 0) {
    throw new AppError('Member not found', 404);
  }

  res.json(rows[0]);
}));

// Create a new member
router.post('/',
  authUtils.authenticateToken,
  validateMember,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { name, email, phone } = req.body;

    const { rows } = await query<Member>(
      'INSERT INTO members (name, email, phone) VALUES ($1, $2, $3) RETURNING *',
      [name, email, phone || null]
    );

    res.status(201).json(rows[0]);
  })
);

// Update a member
router.put('/:id',
  authUtils.authenticateToken,
  validateMember,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { name, email, phone } = req.body;

    const { rows } = await query<Member>(
      'UPDATE members SET name = $1, email = $2, phone = $3 WHERE id = $4 RETURNING *',
      [name, email, phone || null, id]
    );

    if (rows.length === 0) {
      throw new AppError('Member not found', 404);
    }

    res.json(rows[0]);
  })
);

// Delete a member
router.delete('/:id',
  authUtils.authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const { rowCount } = await query('DELETE FROM members WHERE id = $1', [id]);

    if (!rowCount || rowCount === 0) {
      throw new AppError('Member not found', 404);
    }

    res.status(204).send();
  })
);

// Bulk import members from CSV
router.post('/bulk-import',
  authUtils.authenticateToken,
  csvUpload.single('file'),
  asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      throw new AppError('CSV file is required', 400);
    }

    // Log file details for debugging
    console.log('CSV Upload Details:', {
      filename: req.file.originalname,
      mimetype: req.file.mimetype,
      size: req.file.size,
      bufferLength: req.file.buffer?.length,
    });

    let records: any[];
    try {
      records = parse(req.file.buffer, {
        columns: true,
        skip_empty_lines: true,
        trim: true,
        bom: true, // Handle UTF-8 BOM (Byte Order Mark) from Excel
        relax_column_count: true, // Allow rows with different column counts
        skip_records_with_error: true, // Skip malformed rows instead of failing
      });
      console.log(`Parsed ${records.length} records from CSV`);
    } catch (error) {
      console.error('CSV Parse Error:', error);
      throw new AppError(`Invalid CSV file format: ${error instanceof Error ? error.message : 'Unknown error'}`, 400);
    }

    if (!records || records.length === 0) {
      throw new AppError('CSV file is empty or contains no valid data rows', 400);
    }

    const importedMembers: Member[] = [];
    const errors: string[] = [];
    const client = await pool.connect();

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
        const { rows: existingMembers } = await client.query<{ id: number }>(
          'SELECT id FROM members WHERE LOWER(email) = LOWER($1)',
          [email]
        );

        if (existingMembers.length > 0) {
          errors.push(`Row ${index + 2}: Member with email ${email} already exists`);
          continue;
        }

        // Insert member
        const { rows } = await client.query<Member>(
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
  })
);

export default router;

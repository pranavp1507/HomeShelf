/**
 * Loans routes
 * Handles book borrowing, returning, and loan history
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const authUtils = require('../authUtils');
const { asyncHandler, AppError } = require('../middleware/errorHandler');
const { validateLoan, validatePagination } = require('../middleware/validation');

// Borrow a book
router.post('/borrow', authUtils.authenticateToken, validateLoan, asyncHandler(async (req, res) => {
  const { book_id, member_id } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Check if book is available
    const bookResult = await client.query('SELECT available FROM books WHERE id = $1', [book_id]);
    if (bookResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new AppError('Book not found', 404);
    }
    if (!bookResult.rows[0].available) {
      await client.query('ROLLBACK');
      throw new AppError('Book is currently not available', 409);
    }

    // Record the loan with a due date 14 days from now
    const loanResult = await client.query(
      'INSERT INTO loans (book_id, member_id, due_date) VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL \'14 days\') RETURNING *',
      [book_id, member_id]
    );

    // Update book availability
    await client.query('UPDATE books SET available = FALSE WHERE id = $1', [book_id]);

    await client.query('COMMIT');
    res.status(201).json(loanResult.rows[0]);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// Return a book
router.post('/return', authUtils.authenticateToken, validateLoan, asyncHandler(async (req, res) => {
  const { book_id } = req.body;

  const client = await db.pool.connect();
  try {
    await client.query('BEGIN');

    // Find the active loan for the book
    const loanResult = await client.query(
      'SELECT * FROM loans WHERE book_id = $1 AND return_date IS NULL ORDER BY borrow_date DESC LIMIT 1',
      [book_id]
    );

    if (loanResult.rows.length === 0) {
      await client.query('ROLLBACK');
      throw new AppError('No active loan found for this book', 404);
    }

    const loan_id = loanResult.rows[0].id;

    // Update the loan with return date
    await client.query('UPDATE loans SET return_date = CURRENT_TIMESTAMP WHERE id = $1', [loan_id]);

    // Update book availability
    await client.query('UPDATE books SET available = TRUE WHERE id = $1', [book_id]);

    await client.query('COMMIT');
    res.status(200).json({ message: 'Book returned successfully' });
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// Get loan history with pagination, filtering, and search
router.get('/', validatePagination, asyncHandler(async (req, res) => {
  const { page, limit, status, search } = req.query;

  // Pagination parameters
  const pageNum = parseInt(page, 10) || 1;
  const limitNum = parseInt(limit, 10) || 25;
  const offset = (pageNum - 1) * limitNum;

  let query = `
    SELECT
      loans.id,
      loans.borrow_date,
      loans.due_date,
      loans.return_date,
      books.title AS book_title,
      members.name AS member_name
    FROM loans
    JOIN books ON loans.book_id = books.id
    JOIN members ON loans.member_id = members.id
  `;
  const params = [];
  const conditions = [];
  let paramIndex = 1;

  // Status filter (active, returned, overdue)
  if (status === 'active') {
    conditions.push('loans.return_date IS NULL');
  } else if (status === 'returned') {
    conditions.push('loans.return_date IS NOT NULL');
  } else if (status === 'overdue') {
    conditions.push('loans.return_date IS NULL AND loans.due_date < CURRENT_TIMESTAMP');
  }

  // Search filter (book title or member name)
  if (search) {
    conditions.push(`(LOWER(books.title) LIKE $${paramIndex} OR LOWER(members.name) LIKE $${paramIndex})`);
    params.push(`%${String(search).toLowerCase()}%`);
    paramIndex++;
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  // Get total count before pagination
  const countQuery = `SELECT COUNT(*) FROM loans
    JOIN books ON loans.book_id = books.id
    JOIN members ON loans.member_id = members.id
    ${conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : ''}`;
  const { rows: countRows } = await db.query(countQuery, params.slice(0, paramIndex - 1));
  const totalCount = parseInt(countRows[0].count, 10);

  query += ' ORDER BY loans.borrow_date DESC';

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

module.exports = router;

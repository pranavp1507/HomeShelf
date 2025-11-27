/**
 * Data export routes
 * Handles CSV export for books, members, and loans
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const authUtils = require('../authUtils');
const { asyncHandler } = require('../middleware/errorHandler');

// Helper function to convert array of objects to CSV
const convertToCSV = (data, headers) => {
  if (!data || data.length === 0) {
    return headers.join(',') + '\n';
  }

  const csvRows = [];

  // Add headers
  csvRows.push(headers.join(','));

  // Add data rows
  for (const row of data) {
    const values = headers.map(header => {
      const value = row[header.toLowerCase().replace(/ /g, '_')];

      // Handle null/undefined
      if (value === null || value === undefined) {
        return '';
      }

      // Handle dates
      if (value instanceof Date) {
        return value.toISOString().split('T')[0];
      }

      // Escape quotes and wrap in quotes if contains comma, quote, or newline
      const escaped = String(value).replace(/"/g, '""');
      if (escaped.includes(',') || escaped.includes('"') || escaped.includes('\n')) {
        return `"${escaped}"`;
      }

      return escaped;
    });

    csvRows.push(values.join(','));
  }

  return csvRows.join('\n');
};

// Export books to CSV
router.get('/books', authUtils.authenticateToken, authUtils.checkAdmin, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let query = `
    SELECT
      b.id,
      b.title,
      b.author,
      b.isbn,
      b.available,
      b.cover_image_path,
      b.created_at,
      STRING_AGG(c.name, '; ') as categories
    FROM books b
    LEFT JOIN book_categories bc ON b.id = bc.book_id
    LEFT JOIN categories c ON bc.category_id = c.id
  `;

  const params = [];
  const conditions = [];
  let paramIndex = 1;

  if (startDate) {
    conditions.push(`b.created_at >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`b.created_at <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ` GROUP BY b.id ORDER BY b.id`;

  const { rows } = await db.query(query, params);

  const headers = ['id', 'title', 'author', 'isbn', 'available', 'cover_image_path', 'categories', 'created_at'];
  const csv = convertToCSV(rows, headers);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=books_export.csv');
  res.send(csv);
}));

// Export members to CSV
router.get('/members', authUtils.authenticateToken, authUtils.checkAdmin, asyncHandler(async (req, res) => {
  const { startDate, endDate } = req.query;

  let query = 'SELECT id, name, email, phone, created_at FROM members';
  const params = [];
  const conditions = [];
  let paramIndex = 1;

  if (startDate) {
    conditions.push(`created_at >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`created_at <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY id';

  const { rows } = await db.query(query, params);

  const headers = ['id', 'name', 'email', 'phone', 'created_at'];
  const csv = convertToCSV(rows, headers);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=members_export.csv');
  res.send(csv);
}));

// Export loans to CSV
router.get('/loans', authUtils.authenticateToken, authUtils.checkAdmin, asyncHandler(async (req, res) => {
  const { startDate, endDate, status } = req.query;

  let query = `
    SELECT
      l.id,
      b.title as book_title,
      b.author as book_author,
      b.isbn as book_isbn,
      m.name as member_name,
      m.email as member_email,
      l.borrow_date,
      l.due_date,
      l.return_date,
      CASE
        WHEN l.return_date IS NOT NULL THEN 'returned'
        WHEN l.due_date < CURRENT_DATE THEN 'overdue'
        ELSE 'active'
      END as status
    FROM loans l
    JOIN books b ON l.book_id = b.id
    JOIN members m ON l.member_id = m.id
  `;

  const params = [];
  const conditions = [];
  let paramIndex = 1;

  if (startDate) {
    conditions.push(`l.borrow_date >= $${paramIndex}`);
    params.push(startDate);
    paramIndex++;
  }

  if (endDate) {
    conditions.push(`l.borrow_date <= $${paramIndex}`);
    params.push(endDate);
    paramIndex++;
  }

  if (status) {
    if (status === 'active') {
      conditions.push('l.return_date IS NULL AND l.due_date >= CURRENT_DATE');
    } else if (status === 'overdue') {
      conditions.push('l.return_date IS NULL AND l.due_date < CURRENT_DATE');
    } else if (status === 'returned') {
      conditions.push('l.return_date IS NOT NULL');
    }
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  query += ' ORDER BY l.borrow_date DESC';

  const { rows } = await db.query(query, params);

  const headers = ['id', 'book_title', 'book_author', 'book_isbn', 'member_name', 'member_email', 'borrow_date', 'due_date', 'return_date', 'status'];
  const csv = convertToCSV(rows, headers);

  res.setHeader('Content-Type', 'text/csv');
  res.setHeader('Content-Disposition', 'attachment; filename=loans_export.csv');
  res.send(csv);
}));

module.exports = router;

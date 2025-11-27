/**
 * Dashboard routes
 * Provides statistics for the dashboard view
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const { asyncHandler } = require('../middleware/errorHandler');

// Get dashboard statistics
router.get('/', asyncHandler(async (req, res) => {
  const totalBooksRes = await db.query('SELECT COUNT(*) FROM books');
  const totalMembersRes = await db.query('SELECT COUNT(*) FROM members');
  const activeLoansRes = await db.query('SELECT COUNT(*) FROM loans WHERE return_date IS NULL');
  const overdueLoansRes = await db.query('SELECT COUNT(*) FROM loans WHERE return_date IS NULL AND due_date < CURRENT_TIMESTAMP');

  const stats = {
    total_books: parseInt(totalBooksRes.rows[0].count, 10),
    total_members: parseInt(totalMembersRes.rows[0].count, 10),
    active_loans: parseInt(activeLoansRes.rows[0].count, 10),
    overdue_loans: parseInt(overdueLoansRes.rows[0].count, 10),
  };

  res.json(stats);
}));

module.exports = router;

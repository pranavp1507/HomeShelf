/**
 * Dashboard routes
 * Provides statistics for the dashboard view
 */

import express, { Response } from 'express';
import { query } from '../db';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types/express';

const router = express.Router();

interface CountResult {
  count: string;
}

/**
 * Get dashboard statistics
 * Optimized with single query using subqueries for better performance
 *
 * Performance improvement: 4 queries → 1 query
 * Reduces round-trips and improves response time
 */
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  // Single optimized query using subqueries
  // This executes all counts in parallel within the database
  const result = await query(`
    SELECT
      (SELECT COUNT(*)::integer FROM books) as total_books,
      (SELECT COUNT(*)::integer FROM books WHERE available = true) as available_books,
      (SELECT COUNT(*)::integer FROM members) as total_members,
      (SELECT COUNT(*)::integer FROM loans WHERE return_date IS NULL) as active_loans,
      (SELECT COUNT(*)::integer FROM loans
       WHERE return_date IS NULL
       AND due_date < CURRENT_TIMESTAMP) as overdue_loans
  `);

  const stats = result.rows[0];

  res.json(stats);
}));

export default router;

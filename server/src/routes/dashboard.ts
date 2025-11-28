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

// Get dashboard statistics
router.get('/', asyncHandler(async (req: AuthRequest, res: Response) => {
  const totalBooksRes = await query<CountResult>('SELECT COUNT(*) FROM books');
  const totalMembersRes = await query<CountResult>('SELECT COUNT(*) FROM members');
  const activeLoansRes = await query<CountResult>('SELECT COUNT(*) FROM loans WHERE return_date IS NULL');
  const overdueLoansRes = await query<CountResult>('SELECT COUNT(*) FROM loans WHERE return_date IS NULL AND due_date < CURRENT_TIMESTAMP');

  const stats = {
    total_books: parseInt(totalBooksRes.rows[0].count, 10),
    total_members: parseInt(totalMembersRes.rows[0].count, 10),
    active_loans: parseInt(activeLoansRes.rows[0].count, 10),
    overdue_loans: parseInt(overdueLoansRes.rows[0].count, 10),
  };

  res.json(stats);
}));

export default router;

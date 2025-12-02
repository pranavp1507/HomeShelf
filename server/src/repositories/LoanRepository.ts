/**
 * Loan Repository - Database operations for loans
 */

import { PoolClient } from 'pg';
import { BaseRepository, PaginatedResult, PaginationOptions } from './BaseRepository';

export interface Loan {
  id: number;
  book_id: number;
  member_id: number;
  borrow_date: Date;
  due_date: Date;
  return_date?: Date;
  created_at: Date;
}

export interface LoanSearchOptions extends PaginationOptions {
  search?: string;
  status?: 'active' | 'returned' | 'overdue';
}

export interface LoanWithDetails extends Loan {
  book_title: string;
  book_author: string;
  member_name: string;
  member_email: string;
}

export class LoanRepository extends BaseRepository<Loan> {
  protected tableName = 'loans';

  /**
   * Search loans with filters and pagination
   */
  async search(options: LoanSearchOptions, client?: PoolClient): Promise<PaginatedResult<LoanWithDetails>> {
    const executor = client || this.pool;
    const { page, limit, search, status } = options;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      conditions.push(`(b.title ILIKE $${paramCount} OR m.name ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    // Status filter
    if (status === 'active') {
      conditions.push('l.return_date IS NULL');
    } else if (status === 'returned') {
      conditions.push('l.return_date IS NOT NULL');
    } else if (status === 'overdue') {
      conditions.push('l.return_date IS NULL AND l.due_date < CURRENT_TIMESTAMP');
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countResult = await executor.query<{ count: string }>(
      `SELECT COUNT(*)::integer as count
       FROM loans l
       JOIN books b ON l.book_id = b.id
       JOIN members m ON l.member_id = m.id
       ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const offset = (page - 1) * limit;
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const { rows } = await executor.query<LoanWithDetails>(
      `SELECT l.*,
        b.title as book_title,
        b.author as book_author,
        m.name as member_name,
        m.email as member_email
       FROM loans l
       JOIN books b ON l.book_id = b.id
       JOIN members m ON l.member_id = m.id
       ${whereClause}
       ORDER BY l.borrow_date DESC
       LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
      params
    );

    return {
      data: rows,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit)
      }
    };
  }

  /**
   * Find active loan for a book
   */
  async findActiveLoanByBookId(bookId: number, client?: PoolClient): Promise<Loan | null> {
    const executor = client || this.pool;
    const { rows } = await executor.query<Loan>(
      'SELECT * FROM loans WHERE book_id = $1 AND return_date IS NULL',
      [bookId]
    );
    return rows[0] || null;
  }

  /**
   * Get all overdue loans
   */
  async findOverdueLoans(client?: PoolClient): Promise<LoanWithDetails[]> {
    const executor = client || this.pool;
    const { rows } = await executor.query<LoanWithDetails>(
      `SELECT l.*,
        b.title as book_title,
        b.author as book_author,
        m.name as member_name,
        m.email as member_email
       FROM loans l
       JOIN books b ON l.book_id = b.id
       JOIN members m ON l.member_id = m.id
       WHERE l.return_date IS NULL
       AND l.due_date < CURRENT_TIMESTAMP
       ORDER BY l.due_date ASC`
    );
    return rows;
  }
}

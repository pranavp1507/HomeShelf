/**
 * Book Repository - Database operations for books
 */

import { PoolClient } from 'pg';
import { BaseRepository, PaginatedResult, PaginationOptions } from './BaseRepository';

export interface Book {
  id: number;
  title: string;
  author: string;
  isbn?: string;
  available: boolean;
  cover_image_path?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface BookSearchOptions extends PaginationOptions {
  search?: string;
  availableStatus?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  categoryId?: number;
}

export class BookRepository extends BaseRepository<Book> {
  protected tableName = 'books';

  /**
   * Search books with filters and pagination
   */
  async search(options: BookSearchOptions, client?: PoolClient): Promise<PaginatedResult<Book>> {
    const executor = client || this.pool;
    const { page, limit, search, availableStatus, sortBy = 'title', sortOrder = 'asc', categoryId } = options;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      conditions.push(`(title ILIKE $${paramCount} OR author ILIKE $${paramCount} OR isbn ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    // Availability filter
    if (availableStatus === 'available') {
      conditions.push('available = true');
    } else if (availableStatus === 'unavailable') {
      conditions.push('available = false');
    }

    // Category filter
    if (categoryId) {
      paramCount++;
      conditions.push(`id IN (SELECT book_id FROM book_categories WHERE category_id = $${paramCount})`);
      params.push(categoryId);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countResult = await executor.query<{ count: string }>(
      `SELECT COUNT(*)::integer as count FROM books ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const validSortColumns = ['title', 'author', 'created_at'];
    const column = validSortColumns.includes(sortBy) ? sortBy : 'title';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const offset = (page - 1) * limit;
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const { rows } = await executor.query<Book>(
      `SELECT * FROM books ${whereClause} ORDER BY ${column} ${order} LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
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
   * Find book by ISBN
   */
  async findByIsbn(isbn: string, client?: PoolClient): Promise<Book | null> {
    const executor = client || this.pool;
    const { rows } = await executor.query<Book>(
      'SELECT * FROM books WHERE isbn = $1',
      [isbn]
    );
    return rows[0] || null;
  }

  /**
   * Update book availability
   */
  async updateAvailability(id: number, available: boolean, client?: PoolClient): Promise<Book | null> {
    const executor = client || this.pool;
    const { rows } = await executor.query<Book>(
      'UPDATE books SET available = $2 WHERE id = $1 RETURNING *',
      [id, available]
    );
    return rows[0] || null;
  }

  /**
   * Get books with their categories
   */
  async findByIdWithCategories(id: number, client?: PoolClient): Promise<(Book & { categories: any[] }) | null> {
    const executor = client || this.pool;
    const { rows } = await executor.query<Book & { categories: any[] }>(
      `SELECT b.*,
        COALESCE(
          json_agg(
            json_build_object('id', c.id, 'name', c.name)
          ) FILTER (WHERE c.id IS NOT NULL),
          '[]'
        ) as categories
       FROM books b
       LEFT JOIN book_categories bc ON b.id = bc.book_id
       LEFT JOIN categories c ON bc.category_id = c.id
       WHERE b.id = $1
       GROUP BY b.id`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Bulk create books
   */
  async bulkCreate(books: Partial<Book>[], client?: PoolClient): Promise<Book[]> {
    if (books.length === 0) return [];

    const executor = client || this.pool;
    const columns = Object.keys(books[0]);
    const values: any[] = [];
    const placeholders: string[] = [];

    books.forEach((book, index) => {
      const bookValues = columns.map(col => (book as any)[col]);
      values.push(...bookValues);

      const bookPlaceholders = columns.map((_, colIndex) => {
        return `$${index * columns.length + colIndex + 1}`;
      });
      placeholders.push(`(${bookPlaceholders.join(', ')})`);
    });

    const { rows } = await executor.query<Book>(
      `INSERT INTO books (${columns.join(', ')})
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
      values
    );

    return rows;
  }
}

/**
 * Member Repository - Database operations for members
 */

import { PoolClient } from 'pg';
import { BaseRepository, PaginatedResult, PaginationOptions } from './BaseRepository';

export interface Member {
  id: number;
  name: string;
  email: string;
  phone?: string;
  created_at: Date;
  updated_at?: Date;
}

export interface MemberSearchOptions extends PaginationOptions {
  search?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export class MemberRepository extends BaseRepository<Member> {
  protected tableName = 'members';

  /**
   * Search members with filters and pagination
   */
  async search(options: MemberSearchOptions, client?: PoolClient): Promise<PaginatedResult<Member>> {
    const executor = client || this.pool;
    const { page, limit, search, sortBy = 'name', sortOrder = 'asc' } = options;

    const conditions: string[] = [];
    const params: any[] = [];
    let paramCount = 0;

    // Search filter
    if (search) {
      paramCount++;
      conditions.push(`(name ILIKE $${paramCount} OR email ILIKE $${paramCount} OR phone ILIKE $${paramCount})`);
      params.push(`%${search}%`);
    }

    const whereClause = conditions.length > 0 ? `WHERE ${conditions.join(' AND ')}` : '';

    // Count total
    const countResult = await executor.query<{ count: string }>(
      `SELECT COUNT(*)::integer as count FROM members ${whereClause}`,
      params
    );
    const total = parseInt(countResult.rows[0].count, 10);

    // Get paginated results
    const validSortColumns = ['name', 'email', 'created_at'];
    const column = validSortColumns.includes(sortBy) ? sortBy : 'name';
    const order = sortOrder === 'desc' ? 'DESC' : 'ASC';

    const offset = (page - 1) * limit;
    paramCount++;
    params.push(limit);
    paramCount++;
    params.push(offset);

    const { rows } = await executor.query<Member>(
      `SELECT * FROM members ${whereClause} ORDER BY ${column} ${order} LIMIT $${paramCount - 1} OFFSET $${paramCount}`,
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
   * Find member by email
   */
  async findByEmail(email: string, client?: PoolClient): Promise<Member | null> {
    const executor = client || this.pool;
    const { rows } = await executor.query<Member>(
      'SELECT * FROM members WHERE email = $1',
      [email]
    );
    return rows[0] || null;
  }

  /**
   * Bulk create members
   */
  async bulkCreate(members: Partial<Member>[], client?: PoolClient): Promise<Member[]> {
    if (members.length === 0) return [];

    const executor = client || this.pool;
    const columns = Object.keys(members[0]);
    const values: any[] = [];
    const placeholders: string[] = [];

    members.forEach((member, index) => {
      const memberValues = columns.map(col => (member as any)[col]);
      values.push(...memberValues);

      const memberPlaceholders = columns.map((_, colIndex) => {
        return `$${index * columns.length + colIndex + 1}`;
      });
      placeholders.push(`(${memberPlaceholders.join(', ')})`);
    });

    const { rows} = await executor.query<Member>(
      `INSERT INTO members (${columns.join(', ')})
       VALUES ${placeholders.join(', ')}
       RETURNING *`,
      values
    );

    return rows;
  }
}

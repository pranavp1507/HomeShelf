/**
 * Base Repository - Abstract class for database operations
 *
 * Provides common CRUD operations and transaction support for all repositories.
 * Implements the Repository pattern for clean separation of data access logic.
 */

import { Pool, PoolClient, QueryResultRow } from 'pg';
import { pool } from '../db';

export interface PaginationOptions {
  page: number;
  limit: number;
}

export interface PaginatedResult<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Base Repository - Provides common database operations
 *
 * @template T - The entity type this repository manages
 */
export abstract class BaseRepository<T extends QueryResultRow> {
  protected pool: Pool;
  protected abstract tableName: string;

  constructor() {
    this.pool = pool;
  }

  /**
   * Find entity by ID
   */
  async findById(id: number, client?: PoolClient): Promise<T | null> {
    const executor = client || this.pool;
    const { rows } = await executor.query<T>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find all entities with optional pagination
   */
  async findAll(options?: PaginationOptions, client?: PoolClient): Promise<T[]> {
    const executor = client || this.pool;

    let query = `SELECT * FROM ${this.tableName}`;
    const params: any[] = [];

    if (options) {
      const offset = (options.page - 1) * options.limit;
      query += ` LIMIT $1 OFFSET $2`;
      params.push(options.limit, offset);
    }

    const { rows } = await executor.query<T>(query, params);
    return rows;
  }

  /**
   * Count total entities
   */
  async count(client?: PoolClient): Promise<number> {
    const executor = client || this.pool;
    const { rows } = await executor.query<{ count: string }>(
      `SELECT COUNT(*)::integer as count FROM ${this.tableName}`
    );
    return parseInt(rows[0].count, 10);
  }

  /**
   * Create new entity
   */
  async create(data: Partial<T>, client?: PoolClient): Promise<T> {
    const executor = client || this.pool;

    const columns = Object.keys(data).join(', ');
    const values = Object.values(data);
    const placeholders = values.map((_, i) => `$${i + 1}`).join(', ');

    const { rows } = await executor.query<T>(
      `INSERT INTO ${this.tableName} (${columns}) VALUES (${placeholders}) RETURNING *`,
      values
    );

    return rows[0];
  }

  /**
   * Update entity by ID
   */
  async update(id: number, data: Partial<T>, client?: PoolClient): Promise<T | null> {
    const executor = client || this.pool;

    const entries = Object.entries(data);
    if (entries.length === 0) {
      return this.findById(id, client);
    }

    const setClause = entries
      .map(([key], i) => `${key} = $${i + 2}`)
      .join(', ');
    const values = [id, ...entries.map(([, value]) => value)];

    const { rows } = await executor.query<T>(
      `UPDATE ${this.tableName} SET ${setClause} WHERE id = $1 RETURNING *`,
      values
    );

    return rows[0] || null;
  }

  /**
   * Delete entity by ID
   */
  async delete(id: number, client?: PoolClient): Promise<boolean> {
    const executor = client || this.pool;
    const { rowCount } = await executor.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return (rowCount || 0) > 0;
  }

  /**
   * Execute a transaction
   */
  async transaction<R>(callback: (client: PoolClient) => Promise<R>): Promise<R> {
    const client = await this.pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (error) {
      await client.query('ROLLBACK');
      throw error;
    } finally {
      client.release();
    }
  }
}

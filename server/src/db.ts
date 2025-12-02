/**
 * Database connection pool
 */

import { Pool, QueryResult, QueryResultRow } from 'pg';
import config from './config';

/**
 * Connection pool configuration optimized for production:
 * - max: 20 connections (increased from default 10)
 * - idleTimeoutMillis: 30s (close idle connections to save resources)
 * - connectionTimeoutMillis: 2s (fail fast if DB unavailable)
 * - allowExitOnIdle: false (keep pool alive in production)
 */
const pool = new Pool({
  connectionString: config.databaseUrl,
  max: 20,
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  allowExitOnIdle: false,
});

// Test database connection on startup
pool.on('connect', () => {
  console.log('Database connected successfully');
});

pool.on('error', (err) => {
  console.error('Unexpected error on idle client', err);
  process.exit(-1);
});

/**
 * Execute a query with parameters
 */
export const query = <T extends QueryResultRow = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  return pool.query<T>(text, params);
};

/**
 * Get the pool instance directly for transactions
 */
export { pool };

export default {
  query,
  pool
};

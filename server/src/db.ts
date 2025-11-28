/**
 * Database connection pool
 */

import { Pool, QueryResult, QueryResultRow } from 'pg';
import config from './config';

const pool = new Pool({
  connectionString: config.databaseUrl,
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

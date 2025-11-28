/**
 * Test database helpers
 * Provides utilities for setting up, seeding, and cleaning test database
 */

import { newDb, IMemoryDb } from 'pg-mem';
import { Pool, QueryResult } from 'pg';
import fs from 'fs';
import path from 'path';

let testDb: IMemoryDb;
let testPool: Pool;

/**
 * Initialize in-memory test database with migrations
 */
export const setupTestDatabase = async (): Promise<Pool> => {
  // Create in-memory database
  testDb = newDb();

  // Enable extensions
  testDb.public.registerFunction({
    name: 'now',
    returns: 'timestamp',
    implementation: () => new Date(),
  });

  testDb.public.registerFunction({
    name: 'current_timestamp',
    returns: 'timestamp',
    implementation: () => new Date(),
  });

  // Get migrations directory
  const migrationsDir = path.join(__dirname, '../../migrations');

  // Read and sort migration files
  const migrationFiles = fs
    .readdirSync(migrationsDir)
    .filter(file => file.endsWith('.js'))
    .sort();

  // Execute migrations in order
  for (const file of migrationFiles) {
    const migrationPath = path.join(migrationsDir, file);
    const migration = require(migrationPath);

    // Get the SQL from the up migration
    if (migration.up) {
      const pgm = createPgmMock();
      migration.up(pgm);
    }
  }

  // Create pool from in-memory database
  testPool = testDb.adapters.createPg().Pool as any;

  return testPool;
};

/**
 * Clear all data from test database
 */
export const clearDatabase = async (): Promise<void> => {
  if (!testPool) {
    throw new Error('Test database not initialized. Call setupTestDatabase first.');
  }

  const tables = ['book_categories', 'loans', 'books', 'members', 'categories', 'users'];

  for (const table of tables) {
    await testPool.query(`DELETE FROM ${table}`);
  }
};

/**
 * Close test database connection
 */
export const closeDatabase = async (): Promise<void> => {
  if (testPool) {
    await testPool.end();
  }
};

/**
 * Execute a query on the test database
 */
export const query = async <T = any>(
  text: string,
  params?: any[]
): Promise<QueryResult<T>> => {
  if (!testPool) {
    throw new Error('Test database not initialized. Call setupTestDatabase first.');
  }

  return testPool.query<T>(text, params);
};

/**
 * Create a mock pgm object for migrations
 * This is a simplified implementation - you may need to extend it based on your migrations
 */
function createPgmMock() {
  const sql: string[] = [];

  return {
    sql: sql,
    createTable: (tableName: string, columns: any) => {
      // This is a simplified implementation
      // For real use, you'd need to parse the columns object and generate proper SQL
      console.log(`Creating table: ${tableName}`);
    },
    addColumns: (tableName: string, columns: any) => {
      console.log(`Adding columns to: ${tableName}`);
    },
    addConstraint: (tableName: string, constraintName: string, constraint: any) => {
      console.log(`Adding constraint ${constraintName} to: ${tableName}`);
    },
    sql: (sqlString: string) => {
      sql.push(sqlString);
    },
  };
}

/**
 * Alternative: Use real PostgreSQL connection for tests
 * This requires a separate test database instance
 */
export const setupRealTestDatabase = async (): Promise<Pool> => {
  const testDatabaseUrl = process.env.DATABASE_URL || 'postgresql://test:test@localhost:5432/library_test';

  const pool = new Pool({
    connectionString: testDatabaseUrl,
  });

  return pool;
};

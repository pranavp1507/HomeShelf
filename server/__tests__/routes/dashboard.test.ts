/**
 * Dashboard Routes Integration Tests
 *
 * Tests for dashboard statistics endpoint
 */

import request from 'supertest';
import express from 'express';
import dashboardRoutes from '../../src/routes/dashboard';
import { errorHandler } from '../../src/middleware/errorHandler';

// Mock database query function
let queryFn: (text: string, params?: any[]) => Promise<any>;

// Mock the db module
jest.mock('../../src/db', () => {
  return {
    query: async (text: string, params?: any[]) => {
      return queryFn(text, params);
    },
  };
});

// Create a test app instance
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/dashboard', dashboardRoutes);
  app.use(errorHandler);
  return app;
};

describe('Dashboard Routes', () => {
  let app: express.Application;
  let mockQuery: jest.Mock;

  beforeAll(async () => {
    // Create mock query function
    // Updated to match optimized single-query dashboard implementation
    mockQuery = jest.fn(async (text: string, params?: any[]) => {
      // Return all stats in a single row (optimized query)
      return {
        rows: [{
          total_books: 150,
          available_books: 120,
          total_members: 75,
          active_loans: 20,
          overdue_loans: 5
        }]
      };
    });

    queryFn = mockQuery;

    app = createTestApp();
  });

  beforeEach(() => {
    mockQuery.mockClear();
  });

  describe('GET /api/dashboard', () => {
    it('should return dashboard statistics', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .expect(200);

      expect(response.body).toMatchObject({
        total_books: 150,
        available_books: 120,
        total_members: 75,
        active_loans: 20,
        overdue_loans: 5
      });
    });

    it('should make only one optimized database query', async () => {
      await request(app)
        .get('/api/dashboard')
        .expect(200);

      // Verify only 1 query is made (optimized with subqueries)
      expect(mockQuery).toHaveBeenCalledTimes(1);

      const queryText = mockQuery.mock.calls[0][0];
      // Verify it includes all the necessary subqueries
      expect(queryText).toContain('SELECT');
      expect(queryText).toContain('FROM books');
      expect(queryText).toContain('FROM members');
      expect(queryText).toContain('FROM loans');
    });

    it('should return zero counts when no data', async () => {
      mockQuery.mockImplementation(async () => {
        return {
          rows: [{
            total_books: 0,
            available_books: 0,
            total_members: 0,
            active_loans: 0,
            overdue_loans: 0
          }]
        };
      });

      const response = await request(app)
        .get('/api/dashboard')
        .expect(200);

      expect(response.body).toMatchObject({
        total_books: 0,
        available_books: 0,
        total_members: 0,
        active_loans: 0,
        overdue_loans: 0
      });
    });

    it('should return integer counts', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .expect(200);

      expect(typeof response.body.total_books).toBe('number');
      expect(typeof response.body.available_books).toBe('number');
      expect(typeof response.body.total_members).toBe('number');
      expect(typeof response.body.active_loans).toBe('number');
      expect(typeof response.body.overdue_loans).toBe('number');
    });
  });
});

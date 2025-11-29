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
    mockQuery = jest.fn(async (text: string, params?: any[]) => {
      // Return different counts based on the query
      if (text.includes('FROM books')) {
        return { rows: [{ count: '150' }] };
      }
      if (text.includes('FROM members')) {
        return { rows: [{ count: '75' }] };
      }
      if (text.includes('FROM loans WHERE return_date IS NULL AND due_date')) {
        // Overdue loans
        return { rows: [{ count: '5' }] };
      }
      if (text.includes('FROM loans WHERE return_date IS NULL')) {
        // Active loans
        return { rows: [{ count: '20' }] };
      }
      return { rows: [{ count: '0' }] };
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
        total_members: 75,
        active_loans: 20,
        overdue_loans: 5
      });
    });

    it('should make all required database queries', async () => {
      await request(app)
        .get('/api/dashboard')
        .expect(200);

      // Verify all 4 stat queries were made
      expect(mockQuery).toHaveBeenCalledTimes(4);

      const calls = mockQuery.mock.calls.map((call: any) => call[0]);
      expect(calls.some((q: string) => q.includes('FROM books'))).toBe(true);
      expect(calls.some((q: string) => q.includes('FROM members'))).toBe(true);
      expect(calls.some((q: string) => q.includes('active_loans') || q.includes('return_date IS NULL'))).toBe(true);
    });

    it('should return zero counts when no data', async () => {
      mockQuery.mockImplementation(async () => {
        return { rows: [{ count: '0' }] };
      });

      const response = await request(app)
        .get('/api/dashboard')
        .expect(200);

      expect(response.body).toMatchObject({
        total_books: 0,
        total_members: 0,
        active_loans: 0,
        overdue_loans: 0
      });
    });

    it('should parse count strings to integers', async () => {
      const response = await request(app)
        .get('/api/dashboard')
        .expect(200);

      expect(typeof response.body.total_books).toBe('number');
      expect(typeof response.body.total_members).toBe('number');
      expect(typeof response.body.active_loans).toBe('number');
      expect(typeof response.body.overdue_loans).toBe('number');
    });
  });
});

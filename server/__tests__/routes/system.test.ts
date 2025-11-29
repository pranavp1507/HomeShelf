/**
 * System Routes Integration Tests
 *
 * Tests for system information endpoint (admin-only)
 */

import request from 'supertest';
import express from 'express';
import systemRoutes from '../../src/routes/system';
import { errorHandler } from '../../src/middleware/errorHandler';
import { generateToken } from '../../src/utils/authUtils';

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
  app.use('/api/system', systemRoutes);
  app.use(errorHandler);
  return app;
};

describe('System Routes', () => {
  let app: express.Application;
  let adminToken: string;
  let memberToken: string;
  let mockQuery: jest.Mock;

  beforeAll(async () => {
    // Create mock query function
    mockQuery = jest.fn(async (text: string, params?: any[]) => {
      // Database connection check
      if (text === 'SELECT 1') {
        return { rows: [{ '?column?': 1 }] };
      }
      return { rows: [] };
    });

    queryFn = mockQuery;

    // Generate tokens
    adminToken = generateToken({ userId: 1, username: 'admin', role: 'admin' });
    memberToken = generateToken({ userId: 2, username: 'member', role: 'member' });

    app = createTestApp();
  });

  beforeEach(() => {
    mockQuery.mockClear();
  });

  describe('GET /api/system/info', () => {
    it('should return system information with admin token', async () => {
      const response = await request(app)
        .get('/api/system/info')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toMatchObject({
        version: '1.0.0',
        nodeEnv: 'test',
        databaseConnected: true
      });
      expect(response.body.overdueChecksEnabled).toBeDefined();
      expect(response.body.emailEnabled).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/system/info')
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/system/info')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.error).toContain('Admin');
    });

    it('should check database connection', async () => {
      await request(app)
        .get('/api/system/info')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Check that query was called with SELECT 1 (params may be undefined)
      const calls = mockQuery.mock.calls;
      const hasSelectOne = calls.some((call: any) => call[0] === 'SELECT 1');
      expect(hasSelectOne).toBe(true);
    });

    it('should handle database connection failure gracefully', async () => {
      mockQuery.mockImplementationOnce(() => {
        throw new Error('Database connection failed');
      });

      const response = await request(app)
        .get('/api/system/info')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body.databaseConnected).toBe(false);
    });

    it('should include email configuration status', async () => {
      const response = await request(app)
        .get('/api/system/info')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.body).toHaveProperty('emailEnabled');
    });
  });
});

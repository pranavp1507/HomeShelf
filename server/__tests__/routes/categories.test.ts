/**
 * Categories Routes Integration Tests
 *
 * Tests for all categories endpoints including:
 * - List categories (public)
 * - Create, update, delete categories (admin-only)
 */

import request from 'supertest';
import express from 'express';
import categoriesRoutes from '../../src/routes/categories';
import { errorHandler } from '../../src/middleware/errorHandler';
import { generateToken } from '../../src/utils/authUtils';

// Test data
const testCategories = [
  { id: 1, name: 'Fiction', created_at: new Date('2024-01-01') },
  { id: 2, name: 'Non-Fiction', created_at: new Date('2024-01-02') },
  { id: 3, name: 'Science', created_at: new Date('2024-01-03') },
];

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
  app.use('/api/categories', categoriesRoutes);
  app.use(errorHandler);
  return app;
};

describe('Categories Routes', () => {
  let app: express.Application;
  let adminToken: string;
  let memberToken: string;
  let mockQuery: jest.Mock;

  beforeAll(async () => {
    // Create mock query function
    mockQuery = jest.fn(async (text: string, params?: any[]) => {
      // Handle SELECT all categories
      if (text.includes('SELECT * FROM categories')) {
        return { rows: [...testCategories] };
      }

      // Handle INSERT category
      if (text.includes('INSERT INTO categories')) {
        return {
          rows: [{
            id: 4,
            name: params![0],
            created_at: new Date()
          }]
        };
      }

      // Handle UPDATE category
      if (text.includes('UPDATE categories')) {
        const id = parseInt(params![1]);
        const category = testCategories.find(c => c.id === id);
        if (category) {
          return {
            rows: [{
              ...category,
              name: params![0]
            }]
          };
        }
        return { rows: [] };
      }

      // Handle DELETE category
      if (text.includes('DELETE FROM categories')) {
        return { rows: [], rowCount: 1 };
      }

      // Default empty result
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

  describe('GET /api/categories', () => {
    it('should get all categories without authentication', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toMatchObject({
        id: 1,
        name: 'Fiction'
      });
    });

    it('should return categories sorted by name', async () => {
      const response = await request(app)
        .get('/api/categories')
        .expect(200);

      expect(response.body).toBeDefined();
      expect(mockQuery).toHaveBeenCalledWith(
        expect.stringContaining('ORDER BY name ASC'),
        undefined
      );
    });
  });

  describe('POST /api/categories', () => {
    it('should create a new category with admin token', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Category'
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'New Category'
      });
      expect(response.body.id).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/categories')
        .send({
          name: 'New Category'
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'New Category'
        })
        .expect(403);

      expect(response.body.error).toContain('Admin');
    });

    it('should reject missing name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('name');
    });

    it('should reject empty name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '   '
        })
        .expect(400);

      expect(response.body.error).toContain('name');
    });

    it('should sanitize category name', async () => {
      const response = await request(app)
        .post('/api/categories')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '<script>alert("xss")</script>Clean Category'
        })
        .expect(201);

      expect(response.body.name).not.toContain('<script>');
      expect(response.body.name).toContain('Clean Category');
    });
  });

  describe('PUT /api/categories/:id', () => {
    it('should update a category with admin token', async () => {
      const response = await request(app)
        .put('/api/categories/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Fiction'
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Fiction');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/categories/1')
        .send({
          name: 'Updated Fiction'
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .put('/api/categories/1')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Updated Fiction'
        })
        .expect(403);

      expect(response.body.error).toContain('Admin');
    });

    it('should return 404 for nonexistent category', async () => {
      mockQuery.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

      const response = await request(app)
        .put('/api/categories/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Category'
        })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should reject empty name', async () => {
      const response = await request(app)
        .put('/api/categories/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: ''
        })
        .expect(400);

      expect(response.body.error).toContain('name');
    });

    it('should sanitize updated name', async () => {
      const response = await request(app)
        .put('/api/categories/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '<b>Bold</b>Updated'
        })
        .expect(200);

      expect(response.body.name).not.toContain('<b>');
      expect(response.body.name).toContain('Updated');
    });
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete a category with admin token', async () => {
      await request(app)
        .delete('/api/categories/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/categories/1')
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .delete('/api/categories/1')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.error).toContain('Admin');
    });

    it('should return 404 for nonexistent category', async () => {
      mockQuery.mockImplementationOnce(() => Promise.resolve({ rows: [], rowCount: 0 }));

      const response = await request(app)
        .delete('/api/categories/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });
});

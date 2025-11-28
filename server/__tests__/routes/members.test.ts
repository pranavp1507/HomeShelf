/**
 * Members Routes Integration Tests
 *
 * Tests for all members endpoints including:
 * - List members with pagination and search
 * - Get, create, update, delete members
 * - CSV bulk import
 */

import request from 'supertest';
import express from 'express';
import membersRoutes from '../../src/routes/members';
import { errorHandler } from '../../src/middleware/errorHandler';
import { generateToken } from '../../src/utils/authUtils';

// Test data
const testMembers = [
  { id: 1, name: 'John Doe', email: 'john@example.com', phone: '555-0101', created_at: new Date('2024-01-01') },
  { id: 2, name: 'Jane Smith', email: 'jane@example.com', phone: '555-0102', created_at: new Date('2024-01-02') },
  { id: 3, name: 'Bob Johnson', email: 'bob@example.com', phone: null, created_at: new Date('2024-01-03') },
];

// Mock database query function
let queryFn: (text: string, params?: any[]) => Promise<any>;

// Mock the db module
jest.mock('../../src/db', () => {
  return {
    get pool() {
      return {
        connect: async () => {
          const client = {
            query: (text: string, params?: any[]) => queryFn(text, params),
            release: () => {},
          };
          return client;
        },
        end: async () => {},
      };
    },
    query: async (text: string, params?: any[]) => {
      return queryFn(text, params);
    },
  };
});

// Mock file upload utilities
jest.mock('../../src/utils/fileUpload', () => ({
  csvUpload: {
    single: () => (req: any, res: any, next: any) => {
      // Simulate file upload
      req.file = req.body.file || null;
      next();
    }
  }
}));

// Create a test app instance
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/members', membersRoutes);
  app.use(errorHandler);
  return app;
};

describe('Members Routes', () => {
  let app: express.Application;
  let adminToken: string;
  let memberToken: string;
  let mockQuery: jest.Mock;

  beforeAll(async () => {
    // Create mock query function
    mockQuery = jest.fn(async (text: string, params?: any[]) => {
      // Handle count queries
      if (text.includes('COUNT(*)')) {
        return { rows: [{ count: '3' }] };
      }

      // Handle SELECT queries for members list
      if (text.includes('SELECT * FROM members')) {
        let members = [...testMembers];

        // Apply search filter
        if (params && params.length > 0 && text.includes('LOWER(name)')) {
          const searchTerm = String(params[0]).replace(/%/g, '').toLowerCase();
          members = members.filter(m =>
            m.name.toLowerCase().includes(searchTerm) ||
            m.email.toLowerCase().includes(searchTerm) ||
            (m.phone && m.phone.includes(searchTerm))
          );
        }

        // Apply pagination
        const limit = params?.[params.length - 2] || 25;
        const offset = params?.[params.length - 1] || 0;
        members = members.slice(offset, offset + limit);

        return { rows: members };
      }

      // Handle SELECT by ID
      if (text.includes('SELECT * FROM members WHERE id')) {
        const id = params![0];
        const member = testMembers.find(m => m.id === parseInt(id));
        return { rows: member ? [member] : [] };
      }

      // Handle INSERT queries
      if (text.includes('INSERT INTO members')) {
        return {
          rows: [{
            id: 4,
            name: params![0],
            email: params![1],
            phone: params![2],
            created_at: new Date()
          }]
        };
      }

      // Handle UPDATE queries
      if (text.includes('UPDATE members')) {
        const id = params![params!.length - 1];
        const member = testMembers.find(m => m.id === parseInt(id));
        if (member) {
          return {
            rows: [{
              ...member,
              name: params![0],
              email: params![1],
              phone: params![2],
            }]
          };
        }
        return { rows: [] };
      }

      // Handle DELETE queries
      if (text.includes('DELETE FROM members')) {
        return { rows: [], rowCount: 1 };
      }

      // Handle duplicate email check (for bulk import)
      if (text.includes('SELECT id FROM members WHERE LOWER(email)')) {
        // Return empty to allow import
        return { rows: [] };
      }

      // Handle BEGIN/COMMIT for transactions
      if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') {
        return { rows: [] };
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

  describe('GET /api/members', () => {
    it('should get all members with default pagination', async () => {
      const response = await request(app)
        .get('/api/members')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 25,
        total: 3,
        totalPages: 1
      });
    });

    it('should paginate members correctly', async () => {
      const response = await request(app)
        .get('/api/members?page=1&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2
      });
    });

    it('should search members by name', async () => {
      const response = await request(app)
        .get('/api/members?search=john')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data.some((m: any) =>
        m.name.toLowerCase().includes('john')
      )).toBe(true);
    });

    it('should search members by email', async () => {
      const response = await request(app)
        .get('/api/members?search=jane')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should search members by phone', async () => {
      const response = await request(app)
        .get('/api/members?search=555')
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should sort members by name ascending', async () => {
      const response = await request(app)
        .get('/api/members?sortBy=name&sortOrder=asc')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should sort members by name descending', async () => {
      const response = await request(app)
        .get('/api/members?sortBy=name&sortOrder=desc')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should return empty array when no members match search', async () => {
      const response = await request(app)
        .get('/api/members?search=nonexistentmember')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('GET /api/members/:id', () => {
    it('should get a specific member by ID', async () => {
      const response = await request(app)
        .get('/api/members/1')
        .expect(200);

      expect(response.body).toMatchObject({
        id: 1,
        name: 'John Doe',
        email: 'john@example.com'
      });
    });

    it('should return 404 for nonexistent member', async () => {
      const response = await request(app)
        .get('/api/members/999')
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should return member with null phone', async () => {
      const response = await request(app)
        .get('/api/members/3')
        .expect(200);

      expect(response.body.phone).toBeNull();
    });
  });

  describe('POST /api/members', () => {
    it('should create a new member with authentication', async () => {
      const response = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'New Member',
          email: 'newmember@example.com',
          phone: '555-0199'
        })
        .expect(201);

      expect(response.body).toMatchObject({
        name: 'New Member',
        email: 'newmember@example.com',
        phone: '555-0199'
      });
      expect(response.body.id).toBeDefined();
    });

    it('should create member without phone', async () => {
      const response = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'No Phone Member',
          email: 'nophone@example.com'
        })
        .expect(201);

      expect(response.body.name).toBe('No Phone Member');
      expect(response.body.phone).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/members')
        .send({
          name: 'Test Member',
          email: 'test@example.com'
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should reject missing name', async () => {
      const response = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          email: 'test@example.com'
        })
        .expect(400);

      expect(response.body.error).toContain('Name');
    });

    it('should reject missing email', async () => {
      const response = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Member'
        })
        .expect(400);

      expect(response.body.error).toContain('Email');
    });

    it('should reject invalid email format', async () => {
      const response = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Test Member',
          email: 'invalid-email'
        })
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    it('should sanitize name input', async () => {
      const response = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '<script>alert("xss")</script>Clean Name',
          email: 'clean@example.com'
        })
        .expect(201);

      expect(response.body.name).not.toContain('<script>');
      expect(response.body.name).toContain('Clean Name');
    });

    it('should work with member token', async () => {
      const response = await request(app)
        .post('/api/members')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          name: 'Member Created',
          email: 'membercreated@example.com'
        })
        .expect(201);

      expect(response.body.name).toBe('Member Created');
    });
  });

  describe('PUT /api/members/:id', () => {
    it('should update a member', async () => {
      const response = await request(app)
        .put('/api/members/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com',
          phone: '555-9999'
        })
        .expect(200);

      expect(response.body.name).toBe('Updated Name');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/members/1')
        .send({
          name: 'Updated Name',
          email: 'updated@example.com'
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should return 404 for nonexistent member', async () => {
      mockQuery.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

      const response = await request(app)
        .put('/api/members/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          email: 'updated@example.com'
        })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should validate email format', async () => {
      const response = await request(app)
        .put('/api/members/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: 'Updated Name',
          email: 'invalid'
        })
        .expect(400);

      expect(response.body.error).toContain('email');
    });

    it('should sanitize updated name', async () => {
      const response = await request(app)
        .put('/api/members/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          name: '<b>Bold Name</b>Clean',
          email: 'test@example.com'
        })
        .expect(200);

      expect(response.body.name).not.toContain('<b>');
      expect(response.body.name).toContain('Clean');
    });
  });

  describe('DELETE /api/members/:id', () => {
    it('should delete a member', async () => {
      await request(app)
        .delete('/api/members/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/members/1')
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should return 404 for nonexistent member', async () => {
      mockQuery.mockImplementationOnce(() => Promise.resolve({ rows: [], rowCount: 0 }));

      const response = await request(app)
        .delete('/api/members/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should allow member to delete members', async () => {
      await request(app)
        .delete('/api/members/2')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(204);
    });
  });

  describe('POST /api/members/bulk-import', () => {
    it('should import members from CSV', async () => {
      const csvData = {
        buffer: Buffer.from('name,email,phone\nTest User,test@example.com,555-0100'),
        originalname: 'members.csv',
        mimetype: 'text/csv'
      };

      const response = await request(app)
        .post('/api/members/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ file: csvData })
        .expect(200);

      expect(response.body.message).toContain('imported');
      expect(response.body.imported).toBeGreaterThanOrEqual(0);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/members/bulk-import')
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should require CSV file', async () => {
      const response = await request(app)
        .post('/api/members/bulk-import')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('file');
    });
  });
});

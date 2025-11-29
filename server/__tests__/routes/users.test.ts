/**
 * Users Routes Integration Tests
 *
 * Tests for all users endpoints (admin-only):
 * - List users
 * - Update user (with last admin protection)
 * - Delete user (with self-deletion and last admin protection)
 * - Change user password
 */

import request from 'supertest';
import express from 'express';
import usersRoutes from '../../src/routes/users';
import { errorHandler } from '../../src/middleware/errorHandler';
import { generateToken } from '../../src/utils/authUtils';

// Test data
const testUsers = [
  { id: 1, username: 'admin1', role: 'admin', created_at: new Date('2024-01-01') },
  { id: 2, username: 'admin2', role: 'admin', created_at: new Date('2024-01-02') },
  { id: 3, username: 'member1', role: 'member', created_at: new Date('2024-01-03') },
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
  app.use('/api/users', usersRoutes);
  app.use(errorHandler);
  return app;
};

describe('Users Routes', () => {
  let app: express.Application;
  let admin1Token: string; // userId: 1
  let admin2Token: string; // userId: 2
  let memberToken: string; // userId: 3
  let mockQuery: jest.Mock;

  beforeAll(async () => {
    // Create mock query function
    mockQuery = jest.fn(async (text: string, params?: any[]) => {
      // Handle SELECT all users
      if (text.includes('SELECT id, username, role, created_at FROM users')) {
        return { rows: [...testUsers] };
      }

      // Handle SELECT role for delete protection
      if (text.includes('SELECT role FROM users WHERE id')) {
        const id = parseInt(params![0]);
        const user = testUsers.find(u => u.id === id);
        return { rows: user ? [{ role: user.role }] : [] };
      }

      // Handle COUNT admin users
      if (text.includes("COUNT(*) FROM users WHERE role = 'admin'")) {
        const adminCount = testUsers.filter(u => u.role === 'admin').length;
        return { rows: [{ count: String(adminCount) }] };
      }

      // Handle UPDATE user
      if (text.includes('UPDATE users SET username')) {
        const id = parseInt(params![2]);
        const user = testUsers.find(u => u.id === id);
        if (user) {
          return {
            rows: [{
              id: user.id,
              username: params![0],
              role: params![1]
            }]
          };
        }
        return { rows: [] };
      }

      // Handle DELETE user
      if (text.includes('DELETE FROM users')) {
        return { rows: [], rowCount: 1 };
      }

      // Handle UPDATE password
      if (text.includes('UPDATE users SET password_hash')) {
        return { rows: [], rowCount: 1 };
      }

      // Default empty result
      return { rows: [] };
    });

    queryFn = mockQuery;

    // Generate tokens
    admin1Token = generateToken({ userId: 1, username: 'admin1', role: 'admin' });
    admin2Token = generateToken({ userId: 2, username: 'admin2', role: 'admin' });
    memberToken = generateToken({ userId: 3, username: 'member1', role: 'member' });

    app = createTestApp();
  });

  beforeEach(() => {
    mockQuery.mockClear();
  });

  describe('GET /api/users', () => {
    it('should get all users with admin token', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${admin1Token}`)
        .expect(200);

      expect(response.body).toHaveLength(3);
      expect(response.body[0]).toMatchObject({
        id: 1,
        username: 'admin1',
        role: 'admin'
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/users')
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.error).toContain('Admin');
    });

    it('should not include password hashes', async () => {
      const response = await request(app)
        .get('/api/users')
        .set('Authorization', `Bearer ${admin1Token}`)
        .expect(200);

      response.body.forEach((user: any) => {
        expect(user).not.toHaveProperty('password_hash');
        expect(user).not.toHaveProperty('password');
      });
    });
  });

  describe('PUT /api/users/:id', () => {
    it('should update a user with admin token', async () => {
      const response = await request(app)
        .put('/api/users/3')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          username: 'updated_member',
          role: 'member'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        id: 3,
        username: 'updated_member',
        role: 'member'
      });
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/users/3')
        .send({
          username: 'updated',
          role: 'member'
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          username: 'updated',
          role: 'admin'
        })
        .expect(403);

      expect(response.body.error).toContain('Admin');
    });

    it('should reject missing username', async () => {
      const response = await request(app)
        .put('/api/users/3')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          role: 'member'
        })
        .expect(400);

      expect(response.body.error).toContain('Username');
    });

    it('should reject missing role', async () => {
      const response = await request(app)
        .put('/api/users/3')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          username: 'updated'
        })
        .expect(400);

      expect(response.body.error).toContain('role');
    });

    it('should return 404 for nonexistent user', async () => {
      mockQuery.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

      const response = await request(app)
        .put('/api/users/999')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          username: 'updated',
          role: 'member'
        })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should prevent last admin from removing their own admin role', async () => {
      // Mock only 1 admin
      mockQuery.mockImplementationOnce(async (text: string) => {
        if (text.includes("COUNT(*) FROM users WHERE role = 'admin'")) {
          return { rows: [{ count: '1' }] };
        }
        return { rows: [] };
      });

      const response = await request(app)
        .put('/api/users/1')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          username: 'admin1',
          role: 'member'
        })
        .expect(403);

      expect(response.body.error).toContain('last administrator');
    });

    it('should allow admin to change own role if not last admin', async () => {
      const response = await request(app)
        .put('/api/users/1')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          username: 'admin1',
          role: 'member'
        })
        .expect(200);

      expect(response.body.username).toBe('admin1');
    });

    it('should sanitize username input', async () => {
      const response = await request(app)
        .put('/api/users/3')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          username: '<script>alert("xss")</script>clean',
          role: 'member'
        })
        .expect(200);

      expect(response.body.username).not.toContain('<script>');
      expect(response.body.username).toContain('clean');
    });
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete a user with admin token', async () => {
      await request(app)
        .delete('/api/users/3')
        .set('Authorization', `Bearer ${admin1Token}`)
        .expect(204);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/users/3')
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .delete('/api/users/1')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.error).toContain('Admin');
    });

    it('should prevent admin from deleting themselves', async () => {
      const response = await request(app)
        .delete('/api/users/1')
        .set('Authorization', `Bearer ${admin1Token}`)
        .expect(403);

      expect(response.body.error).toContain('cannot delete yourself');
    });

    it('should prevent deleting the last admin', async () => {
      // Mock only 1 admin
      mockQuery.mockImplementation(async (text: string, params?: any[]) => {
        if (text.includes('SELECT role FROM users WHERE id')) {
          return { rows: [{ role: 'admin' }] };
        }
        if (text.includes("COUNT(*) FROM users WHERE role = 'admin'")) {
          return { rows: [{ count: '1' }] };
        }
        return { rows: [] };
      });

      const response = await request(app)
        .delete('/api/users/2')
        .set('Authorization', `Bearer ${admin1Token}`)
        .expect(403);

      expect(response.body.error).toContain('last administrator');
    });

    it('should allow deleting admin if not the last one', async () => {
      await request(app)
        .delete('/api/users/2')
        .set('Authorization', `Bearer ${admin1Token}`)
        .expect(204);
    });

    it('should return 404 for nonexistent user', async () => {
      mockQuery.mockImplementation(async (text: string) => {
        if (text.includes('SELECT role FROM users WHERE id')) {
          return { rows: [] };
        }
        if (text.includes('DELETE FROM users')) {
          return { rows: [], rowCount: 0 };
        }
        return { rows: [] };
      });

      const response = await request(app)
        .delete('/api/users/999')
        .set('Authorization', `Bearer ${admin1Token}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });
  });

  describe('PUT /api/users/:id/password', () => {
    it('should change user password with admin token', async () => {
      const response = await request(app)
        .put('/api/users/3/password')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          password: 'NewPassword123!'
        })
        .expect(200);

      expect(response.body.message).toContain('Password updated successfully');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/users/3/password')
        .send({
          password: 'NewPassword123!'
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .put('/api/users/1/password')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          password: 'NewPassword123!'
        })
        .expect(403);

      expect(response.body.error).toContain('Admin');
    });

    it('should reject missing password', async () => {
      const response = await request(app)
        .put('/api/users/3/password')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Password');
    });

    it('should reject password shorter than 6 characters', async () => {
      const response = await request(app)
        .put('/api/users/3/password')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          password: '12345'
        })
        .expect(400);

      expect(response.body.error).toContain('at least 6 characters');
    });

    it('should return 404 for nonexistent user', async () => {
      mockQuery.mockImplementationOnce(() => Promise.resolve({ rows: [], rowCount: 0 }));

      const response = await request(app)
        .put('/api/users/999/password')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          password: 'NewPassword123!'
        })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should allow admin to change own password', async () => {
      const response = await request(app)
        .put('/api/users/1/password')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          password: 'NewAdminPassword123!'
        })
        .expect(200);

      expect(response.body.message).toContain('Password updated successfully');
    });

    it('should hash the password before storing', async () => {
      await request(app)
        .put('/api/users/3/password')
        .set('Authorization', `Bearer ${admin1Token}`)
        .send({
          password: 'PlainPassword123!'
        })
        .expect(200);

      // Verify that mockQuery was called with UPDATE password_hash
      const calls = mockQuery.mock.calls;
      const updateCall = calls.find((call: any) =>
        String(call[0]).includes('UPDATE users SET password_hash')
      );
      expect(updateCall).toBeDefined();
      // The hashed password should not be the plain password
      if (updateCall) {
        const hashedPassword = updateCall[1][0];
        expect(hashedPassword).not.toBe('PlainPassword123!');
        expect(hashedPassword).toContain('$2'); // bcrypt hash starts with $2
      }
    });
  });
});

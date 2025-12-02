/**
 * Authentication Routes Integration Tests
 *
 * Tests for all authentication endpoints including:
 * - Setup status check
 * - User registration
 * - Login flow
 * - Password reset flow
 */

import request from 'supertest';
import express from 'express';
import { newDb, IMemoryDb } from 'pg-mem';
import authRoutes from '../../src/routes/auth';
import { errorHandler } from '../../src/middleware/errorHandler';
import { hashPassword } from '../../src/utils/authUtils';

// Create in-memory database for testing
let memDb: IMemoryDb;
let testDb: any;
let queryFn: (text: string, params?: any[]) => Promise<any>;

// Mock the db module to use our test database
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

// Create a test app instance
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/auth', authRoutes);
  app.use(errorHandler);
  return app;
};

describe('Authentication Routes', () => {
  let app: express.Application;
  let query: (text: string, params?: any[]) => Promise<any>;

  beforeAll(async () => {
    // Create in-memory PostgreSQL database
    memDb = newDb();

    // Get the public schema for queries
    const db = memDb.public;

    // Initialize the query function to handle parameterized queries
    query = async (text: string, params?: any[]) => {
      // For parameterized queries, we need to replace $1, $2, etc. with actual values
      let queryText = text;
      if (params && params.length > 0) {
        // Replace in reverse order to avoid issues with numbered placeholders
        for (let i = params.length - 1; i >= 0; i--) {
          const param = params[i];
          const placeholder = `\\$${i + 1}(?!\\d)`; // Match $N not followed by another digit
          let value: string;
          if (param === null) {
            value = 'NULL';
          } else if (typeof param === 'string') {
            // Escape single quotes for SQL, and escape $ for regex replacement
            value = `'${param.replace(/'/g, "''").replace(/\$/g, '$$$$')}'`;
          } else if (typeof param === 'number') {
            value = String(param);
          } else if (param instanceof Date) {
            value = `'${param.toISOString()}'`;
          } else {
            value = `'${JSON.stringify(param)}'`;
          }
          // Use regex to replace only the placeholder, not substrings in values
          queryText = queryText.replace(new RegExp(placeholder, 'g'), value);
        }
      }
      return db.query(queryText);
    };
    queryFn = query;

    // Create tables
    await query(`
      CREATE TABLE users (
        id SERIAL PRIMARY KEY,
        username VARCHAR(255) UNIQUE NOT NULL,
        password_hash VARCHAR(255) NOT NULL,
        role VARCHAR(50) NOT NULL DEFAULT 'member',
        reset_token VARCHAR(255),
        reset_token_expires TIMESTAMPTZ,
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    await query(`
      CREATE TABLE members (
        id SERIAL PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        email VARCHAR(255) UNIQUE NOT NULL,
        phone VARCHAR(20),
        created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
      )
    `);

    app = createTestApp();
  });

  beforeEach(async () => {
    // Clean up test data before each test
    await query('DELETE FROM users');
    await query('DELETE FROM members');
  });

  afterAll(async () => {
    // No cleanup needed for in-memory database
  });

  describe('GET /api/auth/setup-status', () => {
    it('should return isSetupNeeded: true when no admin exists', async () => {
      const response = await request(app)
        .get('/api/auth/setup-status')
        .expect(200);

      expect(response.body).toEqual({ isSetupNeeded: true });
    });

    it('should return isSetupNeeded: false when admin exists', async () => {
      // Create an admin user
      const hashedPassword = await hashPassword('Admin123!');
      await query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        ['admin', hashedPassword, 'admin']
      );

      const response = await request(app)
        .get('/api/auth/setup-status')
        .expect(200);

      expect(response.body).toEqual({ isSetupNeeded: false });
    });
  });

  describe('POST /api/auth/register', () => {
    it('should register first admin user successfully (setup phase)', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin',
          password: 'Admin123!',
          role: 'admin'
        })
        .expect(201);

      expect(response.body).toMatchObject({
        message: 'User and member registered successfully',
        user: {
          username: 'admin',
          role: 'admin'
        }
      });
      expect(response.body.user.id).toBeDefined();
    });

    it('should create corresponding member entry on registration', async () => {
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'Test123!',
          role: 'member'
        })
        .expect(201);

      // Check member was created
      const { rows } = await query('SELECT * FROM members WHERE email = $1', [
        'testuser@library.app'
      ]);
      expect(rows.length).toBe(1);
      expect(rows[0].name).toBe('testuser');
    });

    it('should default to member role if not specified', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'memberuser',
          password: 'Member123!'
        })
        .expect(201);

      expect(response.body.user.role).toBe('member');
    });

    it('should reject duplicate username', async () => {
      // Register first user
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'Test123!',
          role: 'member'
        })
        .expect(201);

      // Try to register with same username
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: 'Different123!',
          role: 'member'
        })
        .expect(409);

      expect(response.body.error).toContain('already exists');
    });

    it('should reject registration without username', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          password: 'Test123!',
          role: 'member'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject registration without password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          role: 'member'
        })
        .expect(400);

      expect(response.body.error).toBeDefined();
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'testuser',
          password: '123',
          role: 'member'
        })
        .expect(400);

      expect(response.body.error).toContain('at least 6 characters');
    });

    it('should sanitize username input', async () => {
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: '  <script>alert("xss")</script>  ',
          password: 'Test123!',
          role: 'member'
        })
        .expect(201);

      expect(response.body.user.username).not.toContain('<script>');
      expect(response.body.user.username).not.toContain('</script>');
    });

    it('should require admin authentication after initial setup', async () => {
      // Create first admin
      await request(app)
        .post('/api/auth/register')
        .send({
          username: 'admin',
          password: 'Admin123!',
          role: 'admin'
        })
        .expect(201);

      // Try to register another user without auth
      const response = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'newuser',
          password: 'Test123!',
          role: 'member'
        })
        .expect(401);

      expect(response.body.error).toContain('Authentication token required');
    });
  });

  describe('POST /api/auth/login', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await hashPassword('Test123!');
      await query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        ['testuser', hashedPassword, 'member']
      );
    });

    it('should login with valid credentials', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123!'
        })
        .expect(200);

      expect(response.body).toMatchObject({
        message: 'Logged in successfully',
        user: {
          username: 'testuser',
          role: 'member'
        }
      });
      expect(response.body.token).toBeDefined();
      expect(typeof response.body.token).toBe('string');
    });

    it('should return 401 for invalid username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'nonexistent',
          password: 'Test123!'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should return 401 for invalid password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'WrongPassword!'
        })
        .expect(401);

      expect(response.body.error).toBe('Invalid credentials');
    });

    it('should reject login without username', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          password: 'Test123!'
        })
        .expect(400);

      expect(response.body.error).toContain('Username and password are required');
    });

    it('should reject login without password', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser'
        })
        .expect(400);

      expect(response.body.error).toContain('Username and password are required');
    });

    it('should return user data in response', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123!'
        })
        .expect(200);

      expect(response.body.user).toBeDefined();
      expect(response.body.user.id).toBeDefined();
      expect(response.body.user.username).toBe('testuser');
      expect(response.body.user.role).toBe('member');
    });

    it('should generate valid JWT token', async () => {
      const response = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'Test123!'
        })
        .expect(200);

      expect(response.body.token).toBeDefined();
      // JWT has 3 parts separated by dots
      expect(response.body.token.split('.').length).toBe(3);
    });
  });

  describe('POST /api/auth/forgot-password', () => {
    beforeEach(async () => {
      // Create a test user
      const hashedPassword = await hashPassword('Test123!');
      await query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        ['testuser', hashedPassword, 'member']
      );
    });

    it('should generate reset token for existing user', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          username: 'testuser'
        })
        .expect(200);

      expect(response.body.message).toContain('If a user with that username exists');

      // In development mode, token should be included
      if (process.env.NODE_ENV === 'development') {
        expect(response.body.resetToken).toBeDefined();
        expect(response.body.username).toBe('testuser');
      }
    });

    it('should store hashed reset token in database', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          username: 'testuser'
        })
        .expect(200);

      // Check database for reset token
      const { rows } = await query(
        'SELECT reset_token, reset_token_expires FROM users WHERE username = $1',
        ['testuser']
      );

      expect(rows[0].reset_token).toBeDefined();
      expect(rows[0].reset_token_expires).toBeDefined();
      expect(rows[0].reset_token.length).toBe(64); // SHA-256 hash is 64 hex characters
    });

    it('should set token expiry to 1 hour from now', async () => {
      await request(app)
        .post('/api/auth/forgot-password')
        .send({
          username: 'testuser'
        })
        .expect(200);

      const { rows } = await query(
        'SELECT reset_token_expires FROM users WHERE username = $1',
        ['testuser']
      );

      const expiresAt = new Date(rows[0].reset_token_expires);
      const now = new Date();
      const diffMinutes = (expiresAt.getTime() - now.getTime()) / (1000 * 60);

      expect(diffMinutes).toBeGreaterThan(55);
      expect(diffMinutes).toBeLessThan(65);
    });

    it('should return success even for non-existent user (prevent enumeration)', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          username: 'nonexistent'
        })
        .expect(200);

      expect(response.body.message).toContain('If a user with that username exists');
    });

    it('should reject request without username', async () => {
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({})
        .expect(400);

      expect(response.body.error).toContain('Username is required');
    });
  });

  describe('POST /api/auth/reset-password', () => {
    let resetToken: string;

    beforeEach(async () => {
      // Create a test user and generate reset token
      const hashedPassword = await hashPassword('OldPassword123!');
      await query(
        'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
        ['testuser', hashedPassword, 'member']
      );

      // Generate and store reset token
      const response = await request(app)
        .post('/api/auth/forgot-password')
        .send({
          username: 'testuser'
        });

      if (process.env.NODE_ENV === 'development') {
        resetToken = response.body.resetToken;
      } else {
        // Manually generate token for test
        const crypto = require('crypto');
        resetToken = crypto.randomBytes(32).toString('hex');
        const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000);
        await query(
          'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE username = $3',
          [hashedToken, expiresAt, 'testuser']
        );
      }
    });

    it('should reset password with valid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!'
        })
        .expect(200);

      expect(response.body.message).toContain('Password reset successfully');
      expect(response.body.username).toBe('testuser');
    });

    it('should allow login with new password after reset', async () => {
      // Reset password
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!'
        })
        .expect(200);

      // Try logging in with new password
      const loginResponse = await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'NewPassword123!'
        })
        .expect(200);

      expect(loginResponse.body.token).toBeDefined();
    });

    it('should not allow login with old password after reset', async () => {
      // Reset password
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!'
        })
        .expect(200);

      // Try logging in with old password
      await request(app)
        .post('/api/auth/login')
        .send({
          username: 'testuser',
          password: 'OldPassword123!'
        })
        .expect(401);
    });

    it('should clear reset token after successful reset', async () => {
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!'
        })
        .expect(200);

      const { rows } = await query(
        'SELECT reset_token, reset_token_expires FROM users WHERE username = $1',
        ['testuser']
      );

      expect(rows[0].reset_token).toBeNull();
      expect(rows[0].reset_token_expires).toBeNull();
    });

    it('should reject invalid token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: 'invalid-token-12345',
          newPassword: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid or expired reset token');
    });

    it('should reject expired token', async () => {
      // Manually set token expiry to past
      const crypto = require('crypto');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const pastDate = new Date(Date.now() - 1000); // 1 second ago
      await query(
        'UPDATE users SET reset_token_expires = $1 WHERE username = $2',
        [pastDate, 'testuser']
      );

      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid or expired reset token');
    });

    it('should reject request without token', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          newPassword: 'NewPassword123!'
        })
        .expect(400);

      expect(response.body.error).toContain('Token and new password are required');
    });

    it('should reject request without new password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken
        })
        .expect(400);

      expect(response.body.error).toContain('Token and new password are required');
    });

    it('should reject short password', async () => {
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: '123'
        })
        .expect(400);

      expect(response.body.error).toContain('at least 6 characters');
    });

    it('should not allow token reuse', async () => {
      // Use token once
      await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'NewPassword123!'
        })
        .expect(200);

      // Try to use same token again
      const response = await request(app)
        .post('/api/auth/reset-password')
        .send({
          token: resetToken,
          newPassword: 'AnotherPassword123!'
        })
        .expect(400);

      expect(response.body.error).toContain('Invalid or expired reset token');
    });
  });
});

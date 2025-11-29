/**
 * Loans Routes Integration Tests
 *
 * Tests for all loans endpoints including:
 * - Borrow books (with transaction handling)
 * - Return books (with transaction handling)
 * - Get loan history with pagination, filtering, and search
 */

import request from 'supertest';
import express from 'express';
import loansRoutes from '../../src/routes/loans';
import { errorHandler } from '../../src/middleware/errorHandler';
import { generateToken } from '../../src/utils/authUtils';

// Test data
const testLoans = [
  {
    id: 1,
    book_id: 1,
    member_id: 1,
    borrow_date: new Date('2024-01-01'),
    due_date: new Date('2024-01-15'),
    return_date: null,
    book_title: 'The Great Gatsby',
    member_name: 'John Doe'
  },
  {
    id: 2,
    book_id: 2,
    member_id: 2,
    borrow_date: new Date('2024-01-02'),
    due_date: new Date('2024-01-16'),
    return_date: new Date('2024-01-10'),
    book_title: '1984',
    member_name: 'Jane Smith'
  },
  {
    id: 3,
    book_id: 3,
    member_id: 1,
    borrow_date: new Date('2023-12-20'),
    due_date: new Date('2024-01-03'),
    return_date: null,
    book_title: 'To Kill a Mockingbird',
    member_name: 'John Doe'
  },
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

// Create a test app instance
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/loans', loansRoutes);
  app.use(errorHandler);
  return app;
};

describe('Loans Routes', () => {
  let app: express.Application;
  let adminToken: string;
  let memberToken: string;
  let mockQuery: jest.Mock;

  beforeAll(async () => {
    // Create mock query function
    mockQuery = jest.fn(async (text: string, params?: any[]) => {
      // Handle BEGIN/COMMIT/ROLLBACK for transactions
      if (text === 'BEGIN' || text === 'COMMIT' || text === 'ROLLBACK') {
        return { rows: [] };
      }

      // Handle count queries
      if (text.includes('COUNT(*)')) {
        return { rows: [{ count: '3' }] };
      }

      // Handle SELECT for book availability (for borrow)
      if (text.includes('SELECT available FROM books')) {
        const bookId = params![0];
        if (bookId === 999) {
          return { rows: [] }; // Book not found
        }
        if (bookId === 2) {
          return { rows: [{ available: false }] }; // Book unavailable
        }
        return { rows: [{ available: true }] }; // Book available
      }

      // Handle INSERT loan
      if (text.includes('INSERT INTO loans')) {
        return {
          rows: [{
            id: 4,
            book_id: params![0],
            member_id: params![1],
            borrow_date: new Date(),
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
            return_date: null
          }]
        };
      }

      // Handle UPDATE books availability
      if (text.includes('UPDATE books SET available')) {
        return { rows: [] };
      }

      // Handle SELECT active loan for return
      if (text.includes('SELECT * FROM loans WHERE book_id')) {
        const bookId = params![0];
        if (bookId === 999) {
          return { rows: [] }; // No active loan
        }
        return {
          rows: [{
            id: 1,
            book_id: bookId,
            member_id: 1,
            borrow_date: new Date(),
            due_date: new Date(),
            return_date: null
          }]
        };
      }

      // Handle UPDATE loan with return date
      if (text.includes('UPDATE loans SET return_date')) {
        return { rows: [] };
      }

      // Handle SELECT queries for loan history
      if (text.includes('SELECT') && text.includes('FROM loans')) {
        let loans = [...testLoans];

        // Apply status filter
        if (text.includes('loans.return_date IS NULL') && !text.includes('loans.return_date IS NOT NULL')) {
          loans = loans.filter(l => l.return_date === null);
        } else if (text.includes('loans.return_date IS NOT NULL')) {
          loans = loans.filter(l => l.return_date !== null);
        } else if (text.includes('loans.due_date < CURRENT_TIMESTAMP')) {
          // Overdue loans (return_date is null and due_date is in the past)
          loans = loans.filter(l => l.return_date === null && l.due_date < new Date());
        }

        // Apply search filter
        if (params && params.length > 0 && text.includes('LOWER(books.title)')) {
          const searchTerm = String(params[0]).replace(/%/g, '').toLowerCase();
          loans = loans.filter(l =>
            l.book_title.toLowerCase().includes(searchTerm) ||
            l.member_name.toLowerCase().includes(searchTerm)
          );
        }

        // Apply pagination
        const limit = params?.[params.length - 2] || 25;
        const offset = params?.[params.length - 1] || 0;
        loans = loans.slice(offset, offset + limit);

        return { rows: loans };
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

  describe('POST /api/loans/borrow', () => {
    it('should borrow a book successfully', async () => {
      const response = await request(app)
        .post('/api/loans/borrow')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          book_id: 1,
          member_id: 1
        })
        .expect(201);

      expect(response.body).toMatchObject({
        book_id: 1,
        member_id: 1,
        return_date: null
      });
      expect(response.body.id).toBeDefined();
      expect(response.body.due_date).toBeDefined();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/loans/borrow')
        .send({
          book_id: 1,
          member_id: 1
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should reject missing book_id', async () => {
      const response = await request(app)
        .post('/api/loans/borrow')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          member_id: 1
        })
        .expect(400);

      expect(response.body.error).toContain('book_id');
    });

    it('should reject missing member_id', async () => {
      const response = await request(app)
        .post('/api/loans/borrow')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          book_id: 1
        })
        .expect(400);

      expect(response.body.error).toContain('member_id');
    });

    it('should return 404 for nonexistent book', async () => {
      const response = await request(app)
        .post('/api/loans/borrow')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          book_id: 999,
          member_id: 1
        })
        .expect(404);

      expect(response.body.error).toContain('Book not found');
    });

    it('should return 409 when book is unavailable', async () => {
      const response = await request(app)
        .post('/api/loans/borrow')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          book_id: 2,
          member_id: 1
        })
        .expect(409);

      expect(response.body.error).toContain('not available');
    });

    it('should work with member token', async () => {
      const response = await request(app)
        .post('/api/loans/borrow')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          book_id: 1,
          member_id: 2
        })
        .expect(201);

      expect(response.body.member_id).toBe(2);
    });

    it('should use transaction (BEGIN and COMMIT)', async () => {
      await request(app)
        .post('/api/loans/borrow')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          book_id: 1,
          member_id: 1
        })
        .expect(201);

      const calls = mockQuery.mock.calls;
      const hasBegin = calls.some((call: any) => call[0] === 'BEGIN');
      const hasCommit = calls.some((call: any) => call[0] === 'COMMIT');

      expect(hasBegin).toBe(true);
      expect(hasCommit).toBe(true);
    });
  });

  describe('POST /api/loans/return', () => {
    it('should return a book successfully', async () => {
      const response = await request(app)
        .post('/api/loans/return')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          book_id: 1
        })
        .expect(200);

      expect(response.body.message).toContain('returned successfully');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/loans/return')
        .send({
          book_id: 1
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should reject missing book_id', async () => {
      const response = await request(app)
        .post('/api/loans/return')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({})
        .expect(400);

      expect(response.body.error).toContain('book_id');
    });

    it('should return 404 when no active loan found', async () => {
      const response = await request(app)
        .post('/api/loans/return')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          book_id: 999
        })
        .expect(404);

      expect(response.body.error).toContain('No active loan');
    });

    it('should work with member token', async () => {
      const response = await request(app)
        .post('/api/loans/return')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          book_id: 1
        })
        .expect(200);

      expect(response.body.message).toContain('returned successfully');
    });

    it('should use transaction (BEGIN and COMMIT)', async () => {
      await request(app)
        .post('/api/loans/return')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          book_id: 1
        })
        .expect(200);

      const calls = mockQuery.mock.calls;
      const hasBegin = calls.some((call: any) => call[0] === 'BEGIN');
      const hasCommit = calls.some((call: any) => call[0] === 'COMMIT');

      expect(hasBegin).toBe(true);
      expect(hasCommit).toBe(true);
    });
  });

  describe('GET /api/loans', () => {
    it('should get all loans with default pagination', async () => {
      const response = await request(app)
        .get('/api/loans')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 25,
        total: 3,
        totalPages: 1
      });
    });

    it('should paginate loans correctly', async () => {
      const response = await request(app)
        .get('/api/loans?page=1&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2
      });
    });

    it('should filter active loans', async () => {
      const response = await request(app)
        .get('/api/loans?status=active')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((loan: any) => {
        expect(loan.return_date).toBeNull();
      });
    });

    it('should filter returned loans', async () => {
      const response = await request(app)
        .get('/api/loans?status=returned')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((loan: any) => {
        expect(loan.return_date).not.toBeNull();
      });
    });

    it('should filter overdue loans', async () => {
      const response = await request(app)
        .get('/api/loans?status=overdue')
        .expect(200);

      expect(response.body.data).toBeDefined();
    });

    it('should search loans by book title', async () => {
      const response = await request(app)
        .get('/api/loans?search=gatsby')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      expect(response.body.data[0].book_title).toContain('Gatsby');
    });

    it('should search loans by member name', async () => {
      const response = await request(app)
        .get('/api/loans?search=john')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
    });

    it('should return empty array when no loans match search', async () => {
      const response = await request(app)
        .get('/api/loans?search=nonexistent')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });

    it('should combine status filter and search', async () => {
      const response = await request(app)
        .get('/api/loans?status=active&search=john')
        .expect(200);

      expect(response.body.data).toBeDefined();
    });
  });
});

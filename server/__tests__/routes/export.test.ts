/**
 * Export Routes Integration Tests
 *
 * Tests for CSV export endpoints:
 * - Export books with date filtering
 * - Export members with date filtering
 * - Export loans with status and date filtering
 */

import request from 'supertest';
import express from 'express';
import exportRoutes from '../../src/routes/export';
import { errorHandler } from '../../src/middleware/errorHandler';
import { generateToken } from '../../src/utils/authUtils';

// Test data
const testBooks = [
  {
    id: 1,
    title: 'The Great Gatsby',
    author: 'F. Scott Fitzgerald',
    isbn: '9780743273565',
    available: true,
    cover_image_path: '/uploads/gatsby.jpg',
    created_at: new Date('2024-01-01'),
    categories: 'Fiction; Classic'
  },
  {
    id: 2,
    title: '1984',
    author: 'George Orwell',
    isbn: '9780451524935',
    available: false,
    cover_image_path: null,
    created_at: new Date('2024-01-15'),
    categories: 'Fiction; Dystopian'
  },
];

const testMembers = [
  {
    id: 1,
    name: 'John Doe',
    email: 'john@example.com',
    phone: '555-0100',
    created_at: new Date('2024-01-01')
  },
  {
    id: 2,
    name: 'Jane Smith',
    email: 'jane@example.com',
    phone: '555-0101',
    created_at: new Date('2024-02-01')
  },
];

const testLoans = [
  {
    id: 1,
    book_title: 'The Great Gatsby',
    book_author: 'F. Scott Fitzgerald',
    book_isbn: '9780743273565',
    member_name: 'John Doe',
    member_email: 'john@example.com',
    borrow_date: new Date('2024-01-01'),
    due_date: new Date('2024-01-15'),
    return_date: null,
    status: 'active'
  },
  {
    id: 2,
    book_title: '1984',
    book_author: 'George Orwell',
    book_isbn: '9780451524935',
    member_name: 'Jane Smith',
    member_email: 'jane@example.com',
    borrow_date: new Date('2024-01-05'),
    due_date: new Date('2024-01-19'),
    return_date: new Date('2024-01-18'),
    status: 'returned'
  },
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
  app.use('/api/export', exportRoutes);
  app.use(errorHandler);
  return app;
};

describe('Export Routes', () => {
  let app: express.Application;
  let adminToken: string;
  let memberToken: string;
  let mockQuery: jest.Mock;

  beforeAll(async () => {
    // Create mock query function
    mockQuery = jest.fn(async (text: string, params?: any[]) => {
      // Handle books export query
      if (text.includes('FROM books b') && text.includes('LEFT JOIN book_categories')) {
        let books = [...testBooks];

        // Apply date filters - check for WHERE clause existence
        if (text.includes('WHERE') && params && params.length > 0) {
          // Determine which params are startDate and endDate based on query structure
          let paramIndex = 0;

          if (text.includes('b.created_at >=')) {
            const startDate = new Date(params[paramIndex]);
            books = books.filter(b => b.created_at >= startDate);
            paramIndex++;
          }

          if (text.includes('b.created_at <=')) {
            const endDate = new Date(params[paramIndex]);
            books = books.filter(b => b.created_at <= endDate);
          }
        }

        return { rows: books };
      }

      // Handle members export query
      if (text.includes('FROM members') && !text.includes('JOIN')) {
        let members = [...testMembers];

        // Apply date filters - check for WHERE clause existence
        if (text.includes('WHERE') && params && params.length > 0) {
          let paramIndex = 0;

          if (text.includes('created_at >=')) {
            const startDate = new Date(params[paramIndex]);
            members = members.filter(m => m.created_at >= startDate);
            paramIndex++;
          }

          if (text.includes('created_at <=')) {
            const endDate = new Date(params[paramIndex]);
            members = members.filter(m => m.created_at <= endDate);
          }
        }

        return { rows: members };
      }

      // Handle loans export query
      if (text.includes('FROM loans l') && text.includes('JOIN books b')) {
        let loans = [...testLoans];

        // Extract WHERE clause to check for status filters
        const whereMatch = text.match(/WHERE\s+(.+?)\s+ORDER BY/s);
        const whereClause = whereMatch ? whereMatch[1] : '';

        // Apply status filter only if it appears in WHERE clause
        // (CASE statement includes "THEN", WHERE clause does not)
        if (whereClause.includes("l.return_date IS NULL AND l.due_date >= CURRENT_DATE")) {
          loans = loans.filter(l => l.status === 'active');
        } else if (whereClause.includes("l.return_date IS NULL AND l.due_date < CURRENT_DATE")) {
          loans = loans.filter(l => l.status === 'overdue');
        } else if (whereClause.includes("l.return_date IS NOT NULL") && !whereClause.includes("THEN")) {
          loans = loans.filter(l => l.status === 'returned');
        }

        // Apply date filters
        if (params && params.length > 0) {
          let paramIndex = 0;

          if (text.includes('l.borrow_date >=')) {
            const startDate = new Date(params[paramIndex]);
            loans = loans.filter(l => l.borrow_date >= startDate);
            paramIndex++;
          }

          if (text.includes('l.borrow_date <=')) {
            const endDate = new Date(params[paramIndex]);
            loans = loans.filter(l => l.borrow_date <= endDate);
          }
        }

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

  describe('GET /api/export/books', () => {
    it('should export books as CSV with admin token', async () => {
      const response = await request(app)
        .get('/api/export/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('books_export.csv');
      expect(response.text).toContain('id,title,author,isbn,available,cover_image_path,categories,created_at');
      expect(response.text).toContain('The Great Gatsby');
      expect(response.text).toContain('F. Scott Fitzgerald');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/export/books')
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/export/books')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.error).toContain('Admin');
    });

    it('should filter by start date', async () => {
      const response = await request(app)
        .get('/api/export/books?startDate=2024-01-10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('1984');
      expect(response.text).not.toContain('The Great Gatsby');
    });

    it('should filter by end date', async () => {
      const response = await request(app)
        .get('/api/export/books?endDate=2024-01-10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('The Great Gatsby');
      expect(response.text).not.toContain('1984');
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/export/books?startDate=2024-01-01&endDate=2024-01-10')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('The Great Gatsby');
      expect(response.text).not.toContain('1984');
    });

    it('should include CSV headers when no data', async () => {
      mockQuery.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

      const response = await request(app)
        .get('/api/export/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('id,title,author,isbn,available,cover_image_path,categories,created_at');
    });

    it('should handle null values in CSV', async () => {
      const response = await request(app)
        .get('/api/export/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Book 2 has null cover_image_path
      const lines = response.text.split('\n');
      expect(lines.length).toBeGreaterThan(2);
    });
  });

  describe('GET /api/export/members', () => {
    it('should export members as CSV with admin token', async () => {
      const response = await request(app)
        .get('/api/export/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('members_export.csv');
      expect(response.text).toContain('id,name,email,phone,created_at');
      expect(response.text).toContain('John Doe');
      expect(response.text).toContain('jane@example.com');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/export/members')
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/export/members')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.error).toContain('Admin');
    });

    it('should filter by start date', async () => {
      const response = await request(app)
        .get('/api/export/members?startDate=2024-01-15')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('Jane Smith');
      expect(response.text).not.toContain('John Doe');
    });

    it('should filter by end date', async () => {
      const response = await request(app)
        .get('/api/export/members?endDate=2024-01-15')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('John Doe');
      expect(response.text).not.toContain('Jane Smith');
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/export/members?startDate=2024-01-01&endDate=2024-01-31')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('John Doe');
      expect(response.text).not.toContain('Jane Smith');
    });

    it('should include CSV headers when no data', async () => {
      mockQuery.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

      const response = await request(app)
        .get('/api/export/members')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('id,name,email,phone,created_at');
    });
  });

  describe('GET /api/export/loans', () => {
    it('should export loans as CSV with admin token', async () => {
      const response = await request(app)
        .get('/api/export/loans')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.headers['content-type']).toBe('text/csv; charset=utf-8');
      expect(response.headers['content-disposition']).toContain('attachment');
      expect(response.headers['content-disposition']).toContain('loans_export.csv');
      expect(response.text).toContain('id,book_title,book_author,book_isbn,member_name,member_email,borrow_date,due_date,return_date,status');
      expect(response.text).toContain('The Great Gatsby');
      expect(response.text).toContain('John Doe');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .get('/api/export/loans')
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should require admin role', async () => {
      const response = await request(app)
        .get('/api/export/loans')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(403);

      expect(response.body.error).toContain('Admin');
    });

    it('should filter by start date', async () => {
      const response = await request(app)
        .get('/api/export/loans?startDate=2024-01-03')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('1984');
      expect(response.text).not.toContain('The Great Gatsby');
    });

    it('should filter by end date', async () => {
      const response = await request(app)
        .get('/api/export/loans?endDate=2024-01-03')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('The Great Gatsby');
      expect(response.text).not.toContain('1984');
    });

    it('should filter by date range', async () => {
      const response = await request(app)
        .get('/api/export/loans?startDate=2024-01-01&endDate=2024-01-03')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('The Great Gatsby');
      expect(response.text).not.toContain('1984');
    });

    it('should filter by active status', async () => {
      const response = await request(app)
        .get('/api/export/loans?status=active')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('The Great Gatsby');
      expect(response.text).not.toContain('1984');
    });

    it('should filter by returned status', async () => {
      const response = await request(app)
        .get('/api/export/loans?status=returned')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('1984');
      expect(response.text).not.toContain('The Great Gatsby');
    });

    it('should filter by overdue status', async () => {
      const response = await request(app)
        .get('/api/export/loans?status=overdue')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // No overdue loans in test data
      expect(response.text).toContain('id,book_title');
    });

    it('should combine status and date filters', async () => {
      const response = await request(app)
        .get('/api/export/loans?status=active&startDate=2024-01-01&endDate=2024-01-03')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('The Great Gatsby');
      expect(response.text).not.toContain('1984');
    });

    it('should include CSV headers when no data', async () => {
      mockQuery.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

      const response = await request(app)
        .get('/api/export/loans')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      expect(response.text).toContain('id,book_title,book_author,book_isbn,member_name,member_email,borrow_date,due_date,return_date,status');
    });

    it('should handle null return_date in CSV', async () => {
      const response = await request(app)
        .get('/api/export/loans')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(200);

      // Active loan has null return_date
      const lines = response.text.split('\n');
      expect(lines.length).toBeGreaterThan(2);
    });
  });
});

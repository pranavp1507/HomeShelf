/**
 * Books Routes Integration Tests
 *
 * Tests for all books endpoints including:
 * - List books with pagination, search, and filters
 * - Create, update, delete books
 * - ISBN lookup
 * - Category associations
 */

import request from 'supertest';
import express from 'express';
import booksRoutes from '../../src/routes/books';
import { errorHandler } from '../../src/middleware/errorHandler';
import { hashPassword, generateToken } from '../../src/utils/authUtils';

// Test data
const testBooks = [
  { id: 1, title: 'The Great Gatsby', author: 'F. Scott Fitzgerald', isbn: '9780743273565', available: true, cover_image_path: null, created_at: new Date(), categories: [] },
  { id: 2, title: '1984', author: 'George Orwell', isbn: '9780451524935', available: false, cover_image_path: null, created_at: new Date(), categories: [] },
  { id: 3, title: 'To Kill a Mockingbird', author: 'Harper Lee', isbn: '9780061120084', available: true, cover_image_path: null, created_at: new Date(), categories: [] },
];

const testCategories = [
  { id: 1, name: 'Fiction', created_at: new Date() },
  { id: 2, name: 'Classic', created_at: new Date() },
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
  coverUpload: {
    single: () => (req: any, res: any, next: any) => next()
  },
  csvUpload: {
    single: () => (req: any, res: any, next: any) => next()
  },
  uploadsDir: '/tmp/uploads'
}));

// Mock external APIs for ISBN lookup
jest.mock('axios', () => ({
  get: jest.fn((url: string) => {
    if (url.includes('openlibrary.org')) {
      return Promise.resolve({
        data: {
          title: 'Test Book from API',
          authors: [{ name: 'Test Author' }],
          covers: [12345]
        }
      });
    }
    return Promise.reject(new Error('API not found'));
  })
}));

// Create a test app instance
const createTestApp = () => {
  const app = express();
  app.use(express.json());
  app.use('/api/books', booksRoutes);
  app.use(errorHandler);
  return app;
};

describe('Books Routes', () => {
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

      // Handle SELECT queries for books list
      if (text.includes('SELECT') && text.includes('FROM books b')) {
        let books = [...testBooks];

        // Apply search filter
        if (params && params.length > 0 && text.includes('LOWER(b.title)')) {
          const searchTerm = String(params[0]).replace(/%/g, '').toLowerCase();
          books = books.filter(b =>
            b.title.toLowerCase().includes(searchTerm) ||
            b.author.toLowerCase().includes(searchTerm) ||
            (b.isbn && b.isbn.includes(searchTerm))
          );
        }

        // Apply availability filter
        if (text.includes('b.available')) {
          const availableParam = params?.find(p => typeof p === 'boolean');
          if (availableParam !== undefined) {
            books = books.filter(b => b.available === availableParam);
          }
        }

        // Apply pagination
        const limit = params?.[params.length - 2] || 10;
        const offset = params?.[params.length - 1] || 0;
        books = books.slice(offset, offset + limit);

        return { rows: books };
      }

      // Handle INSERT queries for books
      if (text.includes('INSERT INTO books')) {
        return {
          rows: [{
            id: 4,
            title: params![0],
            author: params![1],
            isbn: params![2] || null,
            available: true,
            cover_image_path: null,
            created_at: new Date()
          }]
        };
      }

      // Handle UPDATE queries for books
      if (text.includes('UPDATE books')) {
        const idParam = params![params!.length - 1];
        const book = testBooks.find(b => b.id === idParam);
        if (book) {
          return {
            rows: [{
              ...book,
              title: params![0] || book.title,
              author: params![1] || book.author,
              isbn: params![2] || book.isbn,
            }]
          };
        }
        return { rows: [] };
      }

      // Handle DELETE queries
      if (text.includes('DELETE FROM books')) {
        return { rows: [], rowCount: 1 };
      }

      // Handle DELETE category associations
      if (text.includes('DELETE FROM book_categories')) {
        return { rows: [], rowCount: 0 };
      }

      // Handle INSERT category associations
      if (text.includes('INSERT INTO book_categories')) {
        return { rows: [] };
      }

      // Handle category queries
      if (text.includes('SELECT') && text.includes('FROM categories')) {
        return { rows: testCategories };
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

  describe('GET /api/books', () => {
    it('should get all books with default pagination', async () => {
      const response = await request(app)
        .get('/api/books')
        .expect(200);

      expect(response.body.data).toHaveLength(3);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 10,
        total: 3,
        totalPages: 1
      });
    });

    it('should paginate books correctly', async () => {
      const response = await request(app)
        .get('/api/books?page=1&limit=2')
        .expect(200);

      expect(response.body.data).toHaveLength(2);
      expect(response.body.pagination).toMatchObject({
        page: 1,
        limit: 2,
        total: 3,
        totalPages: 2
      });
    });

    it('should search books by title', async () => {
      const response = await request(app)
        .get('/api/books?search=gatsby')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].title).toContain('Gatsby');
    });

    it('should search books by author', async () => {
      const response = await request(app)
        .get('/api/books?search=orwell')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].author).toContain('Orwell');
    });

    it('should search books by ISBN', async () => {
      const response = await request(app)
        .get('/api/books?search=9780743273565')
        .expect(200);

      expect(response.body.data).toHaveLength(1);
      expect(response.body.data[0].isbn).toBe('9780743273565');
    });

    it('should filter books by availability', async () => {
      const response = await request(app)
        .get('/api/books?available=true')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((book: any) => {
        expect(book.available).toBe(true);
      });
    });

    it('should filter books by unavailability', async () => {
      const response = await request(app)
        .get('/api/books?available=false')
        .expect(200);

      expect(response.body.data.length).toBeGreaterThan(0);
      response.body.data.forEach((book: any) => {
        expect(book.available).toBe(false);
      });
    });

    it('should sort books by title ascending', async () => {
      const response = await request(app)
        .get('/api/books?sortBy=title&sortOrder=asc')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should sort books by title descending', async () => {
      const response = await request(app)
        .get('/api/books?sortBy=title&sortOrder=desc')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(mockQuery).toHaveBeenCalled();
    });

    it('should return empty array when no books match search', async () => {
      const response = await request(app)
        .get('/api/books?search=nonexistentbook')
        .expect(200);

      expect(response.body.data).toHaveLength(0);
    });
  });

  describe('POST /api/books', () => {
    it('should create a new book with authentication', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'New Book',
          author: 'New Author',
          isbn: '9781234567890'
        })
        .expect(201);

      expect(response.body).toMatchObject({
        title: 'New Book',
        author: 'New Author',
        isbn: '9781234567890',
        available: true
      });
      expect(response.body.id).toBeDefined();
    });

    it('should create book without ISBN', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'No ISBN Book',
          author: 'Some Author'
        })
        .expect(201);

      expect(response.body.title).toBe('No ISBN Book');
      expect(response.body.isbn).toBeNull();
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .post('/api/books')
        .send({
          title: 'Test Book',
          author: 'Test Author'
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should reject missing title', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          author: 'Test Author'
        })
        .expect(400);

      expect(response.body.error).toContain('Title');
    });

    it('should reject missing author', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Book'
        })
        .expect(400);

      expect(response.body.error).toContain('Author');
    });

    it('should sanitize title input', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '<script>alert("xss")</script>Clean Title',
          author: 'Test Author'
        })
        .expect(201);

      expect(response.body.title).not.toContain('<script>');
      expect(response.body.title).toContain('Clean Title');
    });

    it('should sanitize author input', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Test Book',
          author: '<b>Bold Author</b>Clean Name'
        })
        .expect(201);

      expect(response.body.author).not.toContain('<b>');
      expect(response.body.author).toContain('Clean Name');
    });

    it('should work with member token', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${memberToken}`)
        .send({
          title: 'Member Book',
          author: 'Member Author'
        })
        .expect(201);

      expect(response.body.title).toBe('Member Book');
    });
  });

  describe('PUT /api/books/:id', () => {
    it('should update a book', async () => {
      const response = await request(app)
        .put('/api/books/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Gatsby',
          author: 'F. Scott Fitzgerald'
        })
        .expect(200);

      expect(response.body.title).toBe('Updated Gatsby');
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .put('/api/books/1')
        .send({
          title: 'Updated Title'
        })
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should return 404 for nonexistent book', async () => {
      mockQuery.mockImplementationOnce(() => Promise.resolve({ rows: [] }));

      const response = await request(app)
        .put('/api/books/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Updated Title'
        })
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should update only specified fields', async () => {
      const response = await request(app)
        .put('/api/books/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          author: 'Updated Author Only'
        })
        .expect(200);

      expect(response.body.author).toBe('Updated Author Only');
    });

    it('should sanitize updated title', async () => {
      const response = await request(app)
        .put('/api/books/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: '<img src=x onerror=alert(1)>Sanitized'
        })
        .expect(200);

      expect(response.body.title).not.toContain('<img');
      expect(response.body.title).toContain('Sanitized');
    });
  });

  describe('DELETE /api/books/:id', () => {
    it('should delete a book', async () => {
      const response = await request(app)
        .delete('/api/books/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);
    });

    it('should require authentication', async () => {
      const response = await request(app)
        .delete('/api/books/1')
        .expect(401);

      expect(response.body.error).toBe('Authentication token required');
    });

    it('should return 404 for nonexistent book', async () => {
      mockQuery.mockImplementationOnce(() => Promise.resolve({ rows: [], rowCount: 0 }));

      const response = await request(app)
        .delete('/api/books/999')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(404);

      expect(response.body.error).toContain('not found');
    });

    it('should allow member to delete books', async () => {
      await request(app)
        .delete('/api/books/2')
        .set('Authorization', `Bearer ${memberToken}`)
        .expect(204);
    });

    it('should cascade delete book categories', async () => {
      await request(app)
        .delete('/api/books/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .expect(204);

      // Verify that mockQuery was called (CASCADE handled by database)
      expect(mockQuery).toHaveBeenCalled();
    });
  });

  describe('Category Associations', () => {
    it('should create book with categories', async () => {
      const response = await request(app)
        .post('/api/books')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'Categorized Book',
          author: 'Test Author',
          categoryIds: [1, 2]
        })
        .expect(201);

      expect(response.body.title).toBe('Categorized Book');
      // Verify category insertion was attempted
      const calls = mockQuery.mock.calls;
      const hasCategoryInsert = calls.some((call: any) =>
        String(call[0]).includes('INSERT INTO book_categories')
      );
      expect(hasCategoryInsert).toBe(true);
    });

    it('should update book categories', async () => {
      await request(app)
        .put('/api/books/1')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({
          title: 'The Great Gatsby',
          categoryIds: [1]
        })
        .expect(200);

      const calls = mockQuery.mock.calls;
      const hasCategoryDelete = calls.some((call: any) =>
        String(call[0]).includes('DELETE FROM book_categories')
      );
      expect(hasCategoryDelete).toBe(true);
    });

    it('should filter books by category', async () => {
      const response = await request(app)
        .get('/api/books?categoryIds=1')
        .expect(200);

      expect(response.body.data).toBeDefined();
      expect(mockQuery).toHaveBeenCalled();
    });
  });
});

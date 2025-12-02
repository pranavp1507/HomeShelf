# Implementation Roadmap - Optional Enhancements

**Project**: Mulampuzha Library Management System
**Status**: Production-ready (9.0/10) - All critical issues resolved
**Purpose**: Structured game plan for implementing optional enhancements
**Created**: November 30, 2025

---

## Table of Contents

1. [Overview](#overview)
2. [Phase 1: Production Validation (Week 1)](#phase-1-production-validation-week-1)
3. [Phase 2: Architecture Refactoring (Weeks 2-3)](#phase-2-architecture-refactoring-weeks-2-3)
4. [Phase 3: Production Hardening (Week 4)](#phase-3-production-hardening-week-4)
5. [Phase 4: Polish & Optimization (Week 5)](#phase-4-polish--optimization-week-5)
6. [Implementation Details](#implementation-details)
7. [Testing Strategy](#testing-strategy)
8. [Rollout Plan](#rollout-plan)

---

## Overview

### Current State
- ✅ All critical security issues fixed
- ✅ All performance bottlenecks addressed
- ✅ 100% test pass rate (486/486 tests)
- ✅ Production-ready with score 9.0/10

### Goals
- Implement service layer for better architecture
- Add production monitoring and observability
- Validate performance under load
- Optimize remaining minor bottlenecks

### Total Estimated Effort
- **Development**: 5-7 days
- **Testing**: 2-3 days
- **Documentation**: 1 day
- **Total**: 8-11 days (2-3 weeks with reviews)

---

## Phase 1: Production Validation (Week 1)

**Goal**: Validate application performance under load and establish monitoring baseline
**Duration**: 3-4 days
**Priority**: HIGH - Recommended before large-scale deployment

### 1.1 Load Testing Setup (Day 1)

**Files to Create**:
- `server/__tests__/load/k6-tests.js`
- `server/__tests__/load/scenarios.js`
- `server/__tests__/load/README.md`

**Implementation Steps**:

```bash
# Install k6 (via package manager)
# Windows: choco install k6
# macOS: brew install k6
# Linux: sudo apt-get install k6

# Create load test directory
mkdir -p server/__tests__/load
```

**Create**: `server/__tests__/load/k6-tests.js`
```javascript
import http from 'k6/http';
import { check, sleep } from 'k6';
import { Rate } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');

// Test configuration
export const options = {
  stages: [
    { duration: '2m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users
    { duration: '2m', target: 100 },  // Ramp up to 100 users
    { duration: '5m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% requests < 500ms
    errors: ['rate<0.1'],             // Error rate < 10%
  },
};

const BASE_URL = 'http://localhost:3001';

// Setup: Login and get token
export function setup() {
  const loginRes = http.post(`${BASE_URL}/api/auth/login`,
    JSON.stringify({
      username: 'admin',
      password: 'admin123'
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  const token = loginRes.json('token');
  return { token };
}

// Main test scenarios
export default function(data) {
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`
  };

  // Scenario 1: Search books
  let res = http.get(`${BASE_URL}/api/books?search=gatsby&page=1&limit=25`,
    { headers }
  );
  check(res, {
    'books search status 200': (r) => r.status === 200,
    'books search duration < 200ms': (r) => r.timings.duration < 200,
  });
  errorRate.add(res.status !== 200);

  sleep(1);

  // Scenario 2: Get dashboard stats
  res = http.get(`${BASE_URL}/api/dashboard/stats`, { headers });
  check(res, {
    'dashboard status 200': (r) => r.status === 200,
    'dashboard duration < 300ms': (r) => r.timings.duration < 300,
  });
  errorRate.add(res.status !== 200);

  sleep(1);

  // Scenario 3: Get members list
  res = http.get(`${BASE_URL}/api/members?page=1&limit=25`, { headers });
  check(res, {
    'members status 200': (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);

  sleep(1);

  // Scenario 4: Get loans with filters
  res = http.get(`${BASE_URL}/api/loans?status=active`, { headers });
  check(res, {
    'loans status 200': (r) => r.status === 200,
  });
  errorRate.add(res.status !== 200);

  sleep(2);
}

// Teardown
export function teardown(data) {
  console.log('Test complete');
}
```

**Acceptance Criteria**:
- [ ] k6 installed and configured
- [ ] Load tests cover all major endpoints
- [ ] Tests run successfully with 100 concurrent users
- [ ] 95th percentile response time < 500ms
- [ ] Error rate < 1%

**Testing**:
```bash
# Run load test
k6 run server/__tests__/load/k6-tests.js

# Run with cloud output (optional)
k6 run --out cloud server/__tests__/load/k6-tests.js
```

---

### 1.2 Error Monitoring Setup (Day 2)

**Goal**: Integrate Sentry for error tracking and monitoring

**Implementation Steps**:

```bash
# Install Sentry
cd server
pnpm add @sentry/node @sentry/profiling-node
```

**Files to Modify**:
- `server/src/config/index.ts` - Add Sentry config
- `server/src/index.ts` - Initialize Sentry
- `server/src/middleware/errorHandler.ts` - Report errors to Sentry

**Create**: `server/src/config/sentry.ts`
```typescript
import * as Sentry from '@sentry/node';
import { nodeProfilingIntegration } from '@sentry/profiling-node';
import config from './index';

export const initSentry = (app: any) => {
  if (config.nodeEnv === 'production' && config.sentryDsn) {
    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.nodeEnv,
      integrations: [
        nodeProfilingIntegration(),
        new Sentry.Integrations.Http({ tracing: true }),
        new Sentry.Integrations.Express({ app }),
      ],
      tracesSampleRate: 0.1, // 10% of transactions
      profilesSampleRate: 0.1, // 10% of transactions
    });

    console.log('✅ Sentry initialized');
  } else {
    console.log('⚠️  Sentry disabled (no DSN or not production)');
  }

  return Sentry;
};
```

**Update**: `server/src/config/index.ts`
```typescript
export default {
  // ... existing config
  sentryDsn: process.env.SENTRY_DSN || '',
};
```

**Update**: `server/src/index.ts`
```typescript
import { initSentry } from './config/sentry';

const app = express();
const Sentry = initSentry(app);

// Add Sentry request handler (before routes)
app.use(Sentry.Handlers.requestHandler());
app.use(Sentry.Handlers.tracingHandler());

// ... existing middleware and routes

// Add Sentry error handler (before other error handlers)
app.use(Sentry.Handlers.errorHandler());

// ... existing error handlers
```

**Update**: `server/src/middleware/errorHandler.ts`
```typescript
import * as Sentry from '@sentry/node';

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  // Report to Sentry in production
  if (config.nodeEnv === 'production') {
    Sentry.captureException(err);
  }

  // ... existing error handling
};
```

**Environment Variables**:
Add to `.env`:
```bash
SENTRY_DSN=https://your-sentry-dsn@sentry.io/project-id
```

**Acceptance Criteria**:
- [ ] Sentry SDK installed and initialized
- [ ] Errors automatically reported in production
- [ ] Request tracing enabled (10% sample rate)
- [ ] Performance profiling enabled (10% sample rate)
- [ ] Sentry dashboard showing errors

**Testing**:
```bash
# Test error reporting
curl -X POST http://localhost:3001/api/test-error

# Check Sentry dashboard for reported error
```

---

### 1.3 Request ID Tracking (Day 3)

**Goal**: Add correlation IDs for distributed tracing

**Implementation Steps**:

```bash
cd server
pnpm add express-request-id
```

**Update**: `server/src/index.ts`
```typescript
import addRequestId from 'express-request-id';

// Add request ID middleware (early in stack)
app.use(addRequestId());

// Add request ID to response headers
app.use((req: any, res: Response, next: NextFunction) => {
  res.setHeader('X-Request-ID', req.id);
  next();
});
```

**Update**: `server/src/middleware/errorHandler.ts`
```typescript
export const errorHandler = (
  err: Error | AppError,
  req: any, // Now has req.id
  res: Response,
  next: NextFunction
): void => {
  // Log error with request ID
  console.error(`[${req.id}] Error:`, err);

  // Include request ID in error response
  res.status(statusCode).json({
    error: message,
    requestId: req.id,
    ...(config.nodeEnv === 'development' && { stack: err.stack }),
  });
};
```

**Update**: Create `server/src/utils/logger.ts`
```typescript
import config from '../config';

export const logger = {
  info: (requestId: string, message: string, meta?: any) => {
    console.log(`[${requestId}] INFO:`, message, meta || '');
  },

  error: (requestId: string, message: string, error?: Error) => {
    console.error(`[${requestId}] ERROR:`, message, error?.stack || '');
  },

  warn: (requestId: string, message: string, meta?: any) => {
    console.warn(`[${requestId}] WARN:`, message, meta || '');
  },
};
```

**Usage in Routes**:
```typescript
import { logger } from '../utils/logger';

router.post('/borrow', async (req: any, res: Response) => {
  logger.info(req.id, 'Borrow book request', { book_id, member_id });

  try {
    // ... business logic
    logger.info(req.id, 'Book borrowed successfully', { loan_id });
  } catch (err) {
    logger.error(req.id, 'Failed to borrow book', err as Error);
    throw err;
  }
});
```

**Acceptance Criteria**:
- [ ] Request ID generated for every request
- [ ] Request ID in response headers (X-Request-ID)
- [ ] Request ID in all logs
- [ ] Request ID in error responses
- [ ] Centralized logger utility

**Testing**:
```bash
# Test request ID
curl -i http://localhost:3001/api/books
# Should see: X-Request-ID: <uuid>
```

---

### 1.4 Dashboard Query Optimization (Day 4)

**Goal**: Consolidate multiple queries into single CTE query

**Files to Modify**:
- `server/src/routes/dashboard.ts`

**Current Code** (Multiple Queries):
```typescript
// Before: 5 separate queries
const { rows: totalBooks } = await query('SELECT COUNT(*) FROM books');
const { rows: availableBooks } = await query(
  'SELECT COUNT(*) FROM books WHERE available = true'
);
const { rows: totalMembers } = await query('SELECT COUNT(*) FROM members');
const { rows: activeLoans } = await query(
  'SELECT COUNT(*) FROM loans WHERE return_date IS NULL'
);
const { rows: overdueLoans } = await query(
  'SELECT COUNT(*) FROM loans WHERE return_date IS NULL AND due_date < CURRENT_TIMESTAMP'
);
```

**Optimized Code** (Single Query with CTE):
```typescript
// After: Single query with Common Table Expression
const { rows } = await query(`
  WITH stats AS (
    SELECT
      (SELECT COUNT(*) FROM books) as total_books,
      (SELECT COUNT(*) FROM books WHERE available = true) as available_books,
      (SELECT COUNT(*) FROM members) as total_members,
      (SELECT COUNT(*) FROM loans WHERE return_date IS NULL) as active_loans,
      (SELECT COUNT(*) FROM loans
       WHERE return_date IS NULL
       AND due_date < CURRENT_TIMESTAMP) as overdue_loans
  )
  SELECT
    total_books::integer,
    available_books::integer,
    total_members::integer,
    active_loans::integer,
    overdue_loans::integer
  FROM stats
`);

const stats = rows[0];

res.json({
  totalBooks: stats.total_books,
  availableBooks: stats.available_books,
  totalMembers: stats.total_members,
  activeLoans: stats.active_loans,
  overdueLoans: stats.overdue_loans,
});
```

**Acceptance Criteria**:
- [ ] Dashboard stats use single query
- [ ] Response time < 100ms (down from ~300ms)
- [ ] All tests still passing
- [ ] No functional changes (same data returned)

**Testing**:
```bash
# Run dashboard tests
pnpm test -- dashboard.test.ts

# Manual performance test
time curl http://localhost:3001/api/dashboard/stats \
  -H "Authorization: Bearer $TOKEN"
```

---

## Phase 2: Architecture Refactoring (Weeks 2-3)

**Goal**: Implement service layer for better separation of concerns
**Duration**: 6-8 days
**Priority**: MEDIUM - Long-term maintainability improvement

### 2.1 Service Layer Foundation (Days 1-2)

**Directory Structure to Create**:
```
server/src/
├── services/
│   ├── index.ts          # Export all services
│   ├── BaseService.ts    # Abstract base class
│   ├── loanService.ts
│   ├── bookService.ts
│   ├── memberService.ts
│   ├── categoryService.ts
│   └── userService.ts
└── repositories/
    ├── index.ts          # Export all repositories
    ├── BaseRepository.ts # Abstract base class
    ├── loanRepository.ts
    ├── bookRepository.ts
    ├── memberRepository.ts
    ├── categoryRepository.ts
    └── userRepository.ts
```

**Create**: `server/src/repositories/BaseRepository.ts`
```typescript
import { Pool, PoolClient } from 'pg';
import { pool } from '../db';

export abstract class BaseRepository<T> {
  protected pool: Pool;
  protected tableName: string;

  constructor(tableName: string) {
    this.pool = pool;
    this.tableName = tableName;
  }

  /**
   * Get a client for transaction operations
   */
  async getClient(): Promise<PoolClient> {
    return this.pool.connect();
  }

  /**
   * Execute query with automatic connection handling
   */
  async query<R>(text: string, params?: any[]): Promise<R[]> {
    const { rows } = await this.pool.query<R>(text, params);
    return rows;
  }

  /**
   * Find by ID
   */
  async findById(id: number, client?: PoolClient): Promise<T | null> {
    const executor = client || this.pool;
    const { rows } = await executor.query<T>(
      `SELECT * FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Find all with pagination
   */
  async findAll(
    page: number = 1,
    limit: number = 25,
    client?: PoolClient
  ): Promise<{ data: T[]; total: number }> {
    const executor = client || this.pool;
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      executor.query<T>(
        `SELECT * FROM ${this.tableName} ORDER BY id LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      executor.query<{ count: string }>(
        `SELECT COUNT(*) FROM ${this.tableName}`
      ),
    ]);

    return {
      data: data.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Delete by ID
   */
  async deleteById(id: number, client?: PoolClient): Promise<boolean> {
    const executor = client || this.pool;
    const { rowCount } = await executor.query(
      `DELETE FROM ${this.tableName} WHERE id = $1`,
      [id]
    );
    return (rowCount || 0) > 0;
  }
}
```

**Create**: `server/src/repositories/bookRepository.ts`
```typescript
import { BaseRepository } from './BaseRepository';
import { Book } from '../types/models';
import { PoolClient } from 'pg';

export class BookRepository extends BaseRepository<Book> {
  constructor() {
    super('books');
  }

  /**
   * Search books by title or author
   */
  async search(
    searchTerm: string,
    page: number = 1,
    limit: number = 25,
    client?: PoolClient
  ): Promise<{ data: Book[]; total: number }> {
    const executor = client || this.pool;
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      executor.query<Book>(
        `SELECT b.*,
         COALESCE(json_agg(json_build_object('id', c.id, 'name', c.name) ORDER BY c.name)
           FILTER (WHERE c.id IS NOT NULL), '[]') AS categories
         FROM books b
         LEFT JOIN book_categories bc ON b.id = bc.book_id
         LEFT JOIN categories c ON bc.category_id = c.id
         WHERE b.title ILIKE $1 OR b.author ILIKE $1
         GROUP BY b.id
         ORDER BY b.title
         LIMIT $2 OFFSET $3`,
        [`%${searchTerm}%`, limit, offset]
      ),
      executor.query<{ count: string }>(
        `SELECT COUNT(*) FROM books WHERE title ILIKE $1 OR author ILIKE $1`,
        [`%${searchTerm}%`]
      ),
    ]);

    return {
      data: data.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Get book with categories
   */
  async findByIdWithCategories(
    id: number,
    client?: PoolClient
  ): Promise<Book | null> {
    const executor = client || this.pool;
    const { rows } = await executor.query<Book>(
      `SELECT b.*,
       COALESCE(json_agg(json_build_object('id', c.id, 'name', c.name) ORDER BY c.name)
         FILTER (WHERE c.id IS NOT NULL), '[]') AS categories
       FROM books b
       LEFT JOIN book_categories bc ON b.id = bc.book_id
       LEFT JOIN categories c ON bc.category_id = c.id
       WHERE b.id = $1
       GROUP BY b.id`,
      [id]
    );
    return rows[0] || null;
  }

  /**
   * Check book availability
   */
  async isAvailable(id: number, client?: PoolClient): Promise<boolean> {
    const executor = client || this.pool;
    const { rows } = await executor.query<{ available: boolean }>(
      `SELECT available FROM books WHERE id = $1`,
      [id]
    );
    return rows[0]?.available || false;
  }

  /**
   * Update book availability
   */
  async updateAvailability(
    id: number,
    available: boolean,
    client?: PoolClient
  ): Promise<void> {
    const executor = client || this.pool;
    await executor.query(
      `UPDATE books SET available = $1 WHERE id = $2`,
      [available, id]
    );
  }

  /**
   * Create book
   */
  async create(
    bookData: Omit<Book, 'id'>,
    client?: PoolClient
  ): Promise<Book> {
    const executor = client || this.pool;
    const { rows } = await executor.query<Book>(
      `INSERT INTO books (title, author, isbn, published_year, available, cover_image)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING *`,
      [
        bookData.title,
        bookData.author,
        bookData.isbn || null,
        bookData.published_year || null,
        bookData.available !== false,
        bookData.cover_image || null,
      ]
    );
    return rows[0];
  }

  /**
   * Update book
   */
  async update(
    id: number,
    bookData: Partial<Book>,
    client?: PoolClient
  ): Promise<Book | null> {
    const executor = client || this.pool;

    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    if (bookData.title !== undefined) {
      fields.push(`title = $${paramCount++}`);
      values.push(bookData.title);
    }
    if (bookData.author !== undefined) {
      fields.push(`author = $${paramCount++}`);
      values.push(bookData.author);
    }
    if (bookData.isbn !== undefined) {
      fields.push(`isbn = $${paramCount++}`);
      values.push(bookData.isbn);
    }
    if (bookData.published_year !== undefined) {
      fields.push(`published_year = $${paramCount++}`);
      values.push(bookData.published_year);
    }
    if (bookData.available !== undefined) {
      fields.push(`available = $${paramCount++}`);
      values.push(bookData.available);
    }
    if (bookData.cover_image !== undefined) {
      fields.push(`cover_image = $${paramCount++}`);
      values.push(bookData.cover_image);
    }

    if (fields.length === 0) {
      return this.findById(id, client);
    }

    values.push(id);
    const { rows } = await executor.query<Book>(
      `UPDATE books SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
      values
    );
    return rows[0] || null;
  }
}
```

**Create**: `server/src/services/BaseService.ts`
```typescript
import { PoolClient } from 'pg';
import { pool } from '../db';

export abstract class BaseService {
  /**
   * Execute function within a transaction
   */
  async withTransaction<T>(
    callback: (client: PoolClient) => Promise<T>
  ): Promise<T> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      const result = await callback(client);
      await client.query('COMMIT');
      return result;
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }
}
```

**Create**: `server/src/services/bookService.ts`
```typescript
import { BaseService } from './BaseService';
import { BookRepository } from '../repositories/bookRepository';
import { Book } from '../types/models';
import { AppError } from '../middleware/errorHandler';

export class BookService extends BaseService {
  private bookRepo: BookRepository;

  constructor() {
    super();
    this.bookRepo = new BookRepository();
  }

  /**
   * Get all books with pagination
   */
  async getBooks(
    page: number = 1,
    limit: number = 25,
    search?: string
  ): Promise<{ data: Book[]; total: number; page: number; limit: number }> {
    const result = search
      ? await this.bookRepo.search(search, page, limit)
      : await this.bookRepo.findAll(page, limit);

    return {
      ...result,
      page,
      limit,
    };
  }

  /**
   * Get book by ID
   */
  async getBookById(id: number): Promise<Book> {
    const book = await this.bookRepo.findByIdWithCategories(id);
    if (!book) {
      throw new AppError('Book not found', 404);
    }
    return book;
  }

  /**
   * Create new book
   */
  async createBook(bookData: Omit<Book, 'id'>): Promise<Book> {
    return this.withTransaction(async (client) => {
      const book = await this.bookRepo.create(bookData, client);

      // Handle categories if provided
      if (bookData.categoryIds && bookData.categoryIds.length > 0) {
        await this.updateBookCategories(book.id, bookData.categoryIds, client);
      }

      return this.bookRepo.findByIdWithCategories(book.id, client) as Promise<Book>;
    });
  }

  /**
   * Update book
   */
  async updateBook(id: number, bookData: Partial<Book>): Promise<Book> {
    return this.withTransaction(async (client) => {
      const book = await this.bookRepo.update(id, bookData, client);
      if (!book) {
        throw new AppError('Book not found', 404);
      }

      // Handle categories if provided
      if (bookData.categoryIds !== undefined) {
        await this.updateBookCategories(id, bookData.categoryIds, client);
      }

      return this.bookRepo.findByIdWithCategories(id, client) as Promise<Book>;
    });
  }

  /**
   * Delete book
   */
  async deleteBook(id: number): Promise<void> {
    const deleted = await this.bookRepo.deleteById(id);
    if (!deleted) {
      throw new AppError('Book not found', 404);
    }
  }

  /**
   * Update book categories (private helper)
   */
  private async updateBookCategories(
    bookId: number,
    categoryIds: number[],
    client: PoolClient
  ): Promise<void> {
    // Delete existing categories
    await client.query('DELETE FROM book_categories WHERE book_id = $1', [bookId]);

    // Insert new categories
    if (categoryIds.length > 0) {
      const values = categoryIds.map((catId, idx) =>
        `($1, $${idx + 2})`
      ).join(', ');

      await client.query(
        `INSERT INTO book_categories (book_id, category_id) VALUES ${values}`,
        [bookId, ...categoryIds]
      );
    }
  }
}
```

**Acceptance Criteria**:
- [ ] Base classes created (BaseRepository, BaseService)
- [ ] BookRepository implemented with all methods
- [ ] BookService implemented with transaction handling
- [ ] Unit tests for repository layer
- [ ] Unit tests for service layer
- [ ] All existing integration tests still passing

---

### 2.2 Loan Service Implementation (Days 3-4)

**Create**: `server/src/repositories/loanRepository.ts`
```typescript
import { BaseRepository } from './BaseRepository';
import { Loan } from '../types/models';
import { PoolClient } from 'pg';

export class LoanRepository extends BaseRepository<Loan> {
  constructor() {
    super('loans');
  }

  /**
   * Get active loans (not returned)
   */
  async findActive(
    page: number = 1,
    limit: number = 25,
    client?: PoolClient
  ): Promise<{ data: Loan[]; total: number }> {
    const executor = client || this.pool;
    const offset = (page - 1) * limit;

    const [data, countResult] = await Promise.all([
      executor.query<Loan>(
        `SELECT l.*,
         b.title as book_title,
         m.name as member_name
         FROM loans l
         JOIN books b ON l.book_id = b.id
         JOIN members m ON l.member_id = m.id
         WHERE l.return_date IS NULL
         ORDER BY l.loan_date DESC
         LIMIT $1 OFFSET $2`,
        [limit, offset]
      ),
      executor.query<{ count: string }>(
        `SELECT COUNT(*) FROM loans WHERE return_date IS NULL`
      ),
    ]);

    return {
      data: data.rows,
      total: parseInt(countResult.rows[0].count, 10),
    };
  }

  /**
   * Get overdue loans
   */
  async findOverdue(client?: PoolClient): Promise<Loan[]> {
    const executor = client || this.pool;
    const { rows } = await executor.query<Loan>(
      `SELECT l.*,
       b.title as book_title,
       m.name as member_name
       FROM loans l
       JOIN books b ON l.book_id = b.id
       JOIN members m ON l.member_id = m.id
       WHERE l.return_date IS NULL
       AND l.due_date < CURRENT_TIMESTAMP
       ORDER BY l.due_date ASC`
    );
    return rows;
  }

  /**
   * Create loan
   */
  async create(
    bookId: number,
    memberId: number,
    dueDate: Date,
    client?: PoolClient
  ): Promise<Loan> {
    const executor = client || this.pool;
    const { rows } = await executor.query<Loan>(
      `INSERT INTO loans (book_id, member_id, loan_date, due_date)
       VALUES ($1, $2, CURRENT_TIMESTAMP, $3)
       RETURNING *`,
      [bookId, memberId, dueDate]
    );
    return rows[0];
  }

  /**
   * Return loan
   */
  async returnLoan(id: number, client?: PoolClient): Promise<Loan | null> {
    const executor = client || this.pool;
    const { rows } = await executor.query<Loan>(
      `UPDATE loans
       SET return_date = CURRENT_TIMESTAMP
       WHERE id = $1 AND return_date IS NULL
       RETURNING *`,
      [id]
    );
    return rows[0] || null;
  }
}
```

**Create**: `server/src/services/loanService.ts`
```typescript
import { BaseService } from './BaseService';
import { LoanRepository } from '../repositories/loanRepository';
import { BookRepository } from '../repositories/bookRepository';
import { Loan } from '../types/models';
import { AppError } from '../middleware/errorHandler';

export class LoanService extends BaseService {
  private loanRepo: LoanRepository;
  private bookRepo: BookRepository;

  constructor() {
    super();
    this.loanRepo = new LoanRepository();
    this.bookRepo = new BookRepository();
  }

  /**
   * Borrow a book
   */
  async borrowBook(bookId: number, memberId: number): Promise<Loan> {
    return this.withTransaction(async (client) => {
      // Check book availability
      const isAvailable = await this.bookRepo.isAvailable(bookId, client);
      if (!isAvailable) {
        throw new AppError('Book is not available for borrowing', 400);
      }

      // Calculate due date (14 days from now)
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14);

      // Create loan
      const loan = await this.loanRepo.create(bookId, memberId, dueDate, client);

      // Update book availability
      await this.bookRepo.updateAvailability(bookId, false, client);

      return loan;
    });
  }

  /**
   * Return a book
   */
  async returnBook(loanId: number): Promise<Loan> {
    return this.withTransaction(async (client) => {
      // Get loan details
      const loan = await this.loanRepo.findById(loanId, client);
      if (!loan) {
        throw new AppError('Loan not found', 404);
      }

      if (loan.return_date) {
        throw new AppError('Book has already been returned', 400);
      }

      // Mark loan as returned
      const updatedLoan = await this.loanRepo.returnLoan(loanId, client);
      if (!updatedLoan) {
        throw new AppError('Failed to return book', 500);
      }

      // Update book availability
      await this.bookRepo.updateAvailability(loan.book_id, true, client);

      return updatedLoan;
    });
  }

  /**
   * Get active loans
   */
  async getActiveLoans(
    page: number = 1,
    limit: number = 25
  ): Promise<{ data: Loan[]; total: number; page: number; limit: number }> {
    const result = await this.loanRepo.findActive(page, limit);
    return {
      ...result,
      page,
      limit,
    };
  }

  /**
   * Get overdue loans
   */
  async getOverdueLoans(): Promise<Loan[]> {
    return this.loanRepo.findOverdue();
  }

  /**
   * Get loan history for a member
   */
  async getMemberLoanHistory(
    memberId: number,
    page: number = 1,
    limit: number = 25
  ): Promise<{ data: Loan[]; total: number }> {
    const offset = (page - 1) * limit;

    const result = await this.loanRepo.query<Loan>(
      `SELECT l.*, b.title as book_title
       FROM loans l
       JOIN books b ON l.book_id = b.id
       WHERE l.member_id = $1
       ORDER BY l.loan_date DESC
       LIMIT $2 OFFSET $3`,
      [memberId, limit, offset]
    );

    const countResult = await this.loanRepo.query<{ count: string }>(
      `SELECT COUNT(*) FROM loans WHERE member_id = $1`,
      [memberId]
    );

    return {
      data: result,
      total: parseInt(countResult[0].count, 10),
    };
  }
}
```

**Refactor**: `server/src/routes/loans.ts`
```typescript
// Before: Business logic in route
router.post('/borrow', authenticateToken, validateLoan, asyncHandler(async (req: AuthRequest, res: Response) => {
  const { book_id, member_id } = req.body;

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Check book availability
    const { rows: books } = await client.query(
      'SELECT * FROM books WHERE id = $1 AND available = TRUE',
      [book_id]
    );

    // ... lots of business logic ...

    await client.query('COMMIT');
    res.status(201).json(loan);
  } catch (err) {
    await client.query('ROLLBACK');
    throw err;
  } finally {
    client.release();
  }
}));

// After: Thin controller with service
import { LoanService } from '../services/loanService';

const loanService = new LoanService();

router.post('/borrow',
  authenticateToken,
  validateLoan,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { book_id, member_id } = req.body;
    const loan = await loanService.borrowBook(book_id, member_id);
    res.status(201).json(loan);
  })
);

router.post('/return/:id',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const loan = await loanService.returnBook(parseInt(req.params.id));
    res.status(200).json(loan);
  })
);

router.get('/',
  authenticateToken,
  validatePagination,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 25;
    const status = req.query.status as string;

    if (status === 'overdue') {
      const loans = await loanService.getOverdueLoans();
      res.json({ data: loans });
    } else {
      const result = await loanService.getActiveLoans(page, limit);
      res.json(result);
    }
  })
);
```

**Acceptance Criteria**:
- [ ] LoanRepository implemented
- [ ] LoanService implemented with transaction handling
- [ ] Loan routes refactored to use service
- [ ] Unit tests for LoanService
- [ ] All integration tests still passing

---

### 2.3 Complete Remaining Services (Days 5-6)

**Similar implementation for**:
- MemberService + MemberRepository
- CategoryService + CategoryRepository
- UserService + UserRepository

**Acceptance Criteria**:
- [ ] All services implemented
- [ ] All repositories implemented
- [ ] All routes refactored
- [ ] 100% test coverage maintained
- [ ] Documentation updated

---

### 2.4 API Versioning (Days 7-8)

**Goal**: Add `/api/v1/` prefix for future-proof API evolution

**Implementation Steps**:

**Update**: `server/src/index.ts`
```typescript
// Current routes
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/books', apiLimiter, booksRoutes);

// Add versioned routes
app.use('/api/v1/auth', authLimiter, authRoutes);
app.use('/api/v1/books', apiLimiter, booksRoutes);
app.use('/api/v1/members', apiLimiter, membersRoutes);
app.use('/api/v1/loans', apiLimiter, loansRoutes);
app.use('/api/v1/categories', apiLimiter, categoriesRoutes);
app.use('/api/v1/users', apiLimiter, usersRoutes);
app.use('/api/v1/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/v1/export', apiLimiter, exportRoutes);
app.use('/api/v1/system', apiLimiter, systemRoutes);

// Keep legacy routes for backward compatibility (deprecated)
app.use('/api/auth', authLimiter, authRoutes);
app.use('/api/books', apiLimiter, booksRoutes);
// ... etc
```

**Add Deprecation Warning Middleware**:
```typescript
const deprecationWarning = (req: Request, res: Response, next: NextFunction) => {
  if (!req.path.startsWith('/api/v1/')) {
    res.setHeader('X-API-Deprecated', 'true');
    res.setHeader('X-API-Deprecation-Info', 'Please use /api/v1/ endpoints');
  }
  next();
};

app.use('/api/', deprecationWarning);
```

**Update Client** (`client/.env`):
```bash
# Update API URL to use v1
VITE_API_URL=http://localhost:3001/api/v1
```

**Acceptance Criteria**:
- [ ] All routes accessible via `/api/v1/`
- [ ] Legacy routes still work (backward compatibility)
- [ ] Deprecation headers on legacy routes
- [ ] Client updated to use v1 endpoints
- [ ] Documentation updated

---

## Phase 3: Production Hardening (Week 4)

**Goal**: Final security and configuration enhancements
**Duration**: 2-3 days
**Priority**: LOW - Minor improvements

### 3.1 Username Enumeration Fix (Day 1)

**File**: `server/src/routes/auth.ts`

**Current Code** (Vulnerable):
```typescript
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.body;

  const { rows } = await query<User>('SELECT id FROM users WHERE username = $1', [username]);

  if (!rows[0]) {
    // Fast path - returns immediately
    res.json({ message: 'If a user with that username exists...' });
    return;
  }

  // Slow path - generates token, hashes, updates DB
  const resetToken = crypto.randomBytes(32).toString('hex');
  // ... more operations
}));
```

**Fixed Code** (Constant Time):
```typescript
router.post('/forgot-password', asyncHandler(async (req: Request, res: Response) => {
  const { username } = req.body;

  // Always perform same operations regardless of user existence
  const performPasswordResetLogic = async (username: string) => {
    const { rows } = await query<User>('SELECT id FROM users WHERE username = $1', [username]);

    if (rows[0]) {
      // User exists - generate real token
      const resetToken = crypto.randomBytes(32).toString('hex');
      const hashedToken = crypto.createHash('sha256').update(resetToken).digest('hex');
      const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

      await query(
        'UPDATE users SET reset_token = $1, reset_token_expires = $2 WHERE id = $3',
        [hashedToken, expiresAt, rows[0].id]
      );

      return resetToken;
    } else {
      // User doesn't exist - perform dummy operations for constant time
      const dummyToken = crypto.randomBytes(32).toString('hex');
      crypto.createHash('sha256').update(dummyToken).digest('hex');

      // Simulate database write delay
      await new Promise(resolve => setTimeout(resolve, 50));

      return null;
    }
  };

  await performPasswordResetLogic(username);

  // Always return same response
  res.json({
    message: 'If a user with that username exists, a password reset link has been generated.'
  });
}));
```

**Acceptance Criteria**:
- [ ] Constant-time password reset
- [ ] Same response time for existing/non-existing users
- [ ] Tests verify timing consistency

---

### 3.2 PATCH Validation Middleware (Day 2)

**Create**: `server/src/middleware/validation.ts` - Add new validators

```typescript
/**
 * Validation middleware for book updates (PATCH)
 * Allows partial updates - only validates provided fields
 */
export const validateBookUpdate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const { title, author, isbn } = req.body;

  // Only validate fields that are provided
  if (title !== undefined) {
    if (typeof title !== 'string' || title.trim().length === 0) {
      return next(new AppError('Title must be a non-empty string', 400));
    }
    req.body.title = sanitizeString(title);
  }

  if (author !== undefined) {
    if (typeof author !== 'string' || author.trim().length === 0) {
      return next(new AppError('Author must be a non-empty string', 400));
    }
    req.body.author = sanitizeString(author);
  }

  if (isbn !== undefined && !isValidISBN(isbn)) {
    return next(new AppError('Invalid ISBN format. Must be ISBN-10 or ISBN-13', 400));
  }

  if (isbn) req.body.isbn = sanitizeString(isbn);

  next();
};

/**
 * Validation middleware for member updates (PATCH)
 */
export const validateMemberUpdate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const { name, email, phone } = req.body;

  if (name !== undefined) {
    if (typeof name !== 'string' || name.trim().length === 0) {
      return next(new AppError('Name must be a non-empty string', 400));
    }
    req.body.name = sanitizeString(name);
  }

  if (email !== undefined && !isValidEmail(email)) {
    return next(new AppError('Valid email is required', 400));
  }

  if (email) req.body.email = sanitizeString(email).toLowerCase();

  if (phone !== undefined && typeof phone !== 'string') {
    return next(new AppError('Phone must be a string', 400));
  }

  if (phone) req.body.phone = sanitizeString(phone);

  next();
};
```

**Update Routes**:
```typescript
// Use validateBook for POST (requires all fields)
router.post('/', authenticateToken, checkAdmin, validateBook, ...);

// Use validateBookUpdate for PUT/PATCH (allows partial updates)
router.put('/:id', authenticateToken, checkAdmin, validateBookUpdate, ...);
router.patch('/:id', authenticateToken, checkAdmin, validateBookUpdate, ...);
```

**Acceptance Criteria**:
- [ ] PATCH validators created
- [ ] Routes updated to use appropriate validators
- [ ] Tests for partial updates
- [ ] All tests passing

---

### 3.3 JWT Secret Validation Improvement (Day 3)

**Current**: `server/src/utils/authUtils.ts`
```typescript
if (!config.jwtSecret) {
  console.error('FATAL ERROR: JWT_SECRET is not defined');
  process.exit(1); // Crashes at runtime
}
```

**Update**: `server/src/config/index.ts`
```typescript
// Validate critical env vars at startup
const jwtSecret = process.env.JWT_SECRET;

if (!jwtSecret && process.env.NODE_ENV !== 'test') {
  console.error('FATAL ERROR: JWT_SECRET environment variable is not defined.');
  console.error('Please set JWT_SECRET in your .env file.');
  process.exit(1);
}

const databaseUrl = process.env.DATABASE_URL;

if (!databaseUrl && process.env.NODE_ENV !== 'test') {
  console.error('FATAL ERROR: DATABASE_URL environment variable is not defined.');
  console.error('Please set DATABASE_URL in your .env file.');
  process.exit(1);
}

export default {
  jwtSecret: jwtSecret || 'test-secret-do-not-use-in-production',
  databaseUrl: databaseUrl || 'postgresql://test',
  // ... rest of config
};
```

**Update**: `server/src/utils/authUtils.ts`
```typescript
// Remove runtime check (already validated in config)
import config from '../config';

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, SALT_ROUNDS);
};

export const generateToken = (userId: number, role: string): string => {
  return jwt.sign({ userId, role }, config.jwtSecret, { expiresIn: '1h' });
};
```

**Acceptance Criteria**:
- [ ] Config validation at startup
- [ ] Clear error messages for missing env vars
- [ ] Graceful handling in test environment
- [ ] No runtime crashes

---

## Phase 4: Polish & Optimization (Week 5)

**Goal**: Final documentation and minor improvements
**Duration**: 2 days
**Priority**: LOW

### 4.1 Documentation Updates (Day 1)

**Update Files**:
- `README.md` - Add service layer documentation
- `docs/api_documentation.md` - Update with v1 endpoints
- `docs/architecture.md` - Document service/repository pattern
- `CLAUDE.md` - Update with new architecture

**Create**: `docs/service_layer_guide.md`
```markdown
# Service Layer Guide

## Architecture Overview

The application uses a 3-layer architecture:

```
Routes (HTTP layer)
  ↓
Services (Business logic)
  ↓
Repositories (Data access)
  ↓
Database
```

## Using Services

### In Routes
```typescript
import { BookService } from '../services/bookService';

const bookService = new BookService();

router.get('/:id', async (req, res) => {
  const book = await bookService.getBookById(parseInt(req.params.id));
  res.json(book);
});
```

### Transaction Handling
```typescript
// Services handle transactions automatically
await bookService.createBook(bookData); // Automatic BEGIN/COMMIT/ROLLBACK
```

## Creating New Services

1. Create repository in `server/src/repositories/`
2. Extend `BaseRepository<T>`
3. Create service in `server/src/services/`
4. Extend `BaseService`
5. Use `withTransaction()` for multi-step operations
6. Write unit tests
```

**Acceptance Criteria**:
- [ ] All documentation updated
- [ ] Architecture diagrams added
- [ ] Code examples provided
- [ ] Migration guide from old to new architecture

---

### 4.2 Performance Profiling (Day 2)

**Goal**: Identify any remaining bottlenecks

**Install**:
```bash
cd server
pnpm add --save-dev autocannon
```

**Create**: `server/__tests__/load/benchmark.sh`
```bash
#!/bin/bash

# Benchmark script for API endpoints

echo "Starting API benchmarks..."

# Get auth token
TOKEN=$(curl -s -X POST http://localhost:3001/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"admin123"}' \
  | jq -r '.token')

# Benchmark: Get books list
echo "\n=== GET /api/v1/books ==="
autocannon -c 50 -d 30 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/books

# Benchmark: Search books
echo "\n=== GET /api/v1/books?search=gatsby ==="
autocannon -c 50 -d 30 \
  -H "Authorization: Bearer $TOKEN" \
  "http://localhost:3001/api/v1/books?search=gatsby"

# Benchmark: Dashboard stats
echo "\n=== GET /api/v1/dashboard/stats ==="
autocannon -c 50 -d 30 \
  -H "Authorization: Bearer $TOKEN" \
  http://localhost:3001/api/v1/dashboard/stats

echo "\nBenchmarks complete!"
```

**Acceptance Criteria**:
- [ ] Benchmark script created
- [ ] All endpoints < 500ms at 95th percentile
- [ ] No memory leaks detected
- [ ] Connection pool sized appropriately

---

## Testing Strategy

### Unit Tests

**For Repositories**:
```typescript
// server/__tests__/repositories/bookRepository.test.ts
import { BookRepository } from '../../src/repositories/bookRepository';

describe('BookRepository', () => {
  it('should find book by ID', async () => {
    const repo = new BookRepository();
    const book = await repo.findById(1);
    expect(book).toBeDefined();
    expect(book?.id).toBe(1);
  });

  it('should search books by title', async () => {
    const repo = new BookRepository();
    const result = await repo.search('gatsby', 1, 25);
    expect(result.data).toBeInstanceOf(Array);
    expect(result.total).toBeGreaterThan(0);
  });
});
```

**For Services**:
```typescript
// server/__tests__/services/loanService.test.ts
import { LoanService } from '../../src/services/loanService';

describe('LoanService', () => {
  it('should borrow available book', async () => {
    const service = new LoanService();
    const loan = await service.borrowBook(1, 1);
    expect(loan).toBeDefined();
    expect(loan.book_id).toBe(1);
    expect(loan.member_id).toBe(1);
  });

  it('should throw error for unavailable book', async () => {
    const service = new LoanService();
    await expect(service.borrowBook(999, 1))
      .rejects
      .toThrow('Book is not available');
  });
});
```

### Integration Tests

**Keep existing route tests**, they validate end-to-end functionality:
```typescript
// server/__tests__/routes/books.test.ts
// These tests still work with service layer
describe('Books Routes', () => {
  it('should get all books', async () => {
    const response = await request(app)
      .get('/api/v1/books')
      .set('Authorization', `Bearer ${token}`)
      .expect(200);

    expect(response.body.data).toBeInstanceOf(Array);
  });
});
```

### Load Tests

```bash
# Run k6 load tests
k6 run server/__tests__/load/k6-tests.js

# Run autocannon benchmarks
bash server/__tests__/load/benchmark.sh
```

---

## Rollout Plan

### Phase 1: Testing (Week 1)
- [ ] All unit tests passing
- [ ] All integration tests passing
- [ ] Load tests validate performance
- [ ] Monitoring in place

### Phase 2: Service Layer (Weeks 2-3)
- [ ] Implement service layer incrementally
- [ ] One module at a time (books → loans → members → etc)
- [ ] Test after each module
- [ ] Keep routes working during refactoring

### Phase 3: Production (Week 4)
- [ ] Deploy monitoring first
- [ ] Run load tests on staging
- [ ] Deploy API versioning
- [ ] Monitor error rates

### Phase 4: Optimization (Week 5)
- [ ] Performance profiling
- [ ] Documentation complete
- [ ] Team training on new architecture

---

## Success Metrics

### Performance
- [ ] 95th percentile response time < 500ms
- [ ] Error rate < 0.1%
- [ ] 100 concurrent users supported
- [ ] Zero memory leaks

### Code Quality
- [ ] 100% test coverage maintained
- [ ] All tests passing
- [ ] No code duplication
- [ ] Clear separation of concerns

### Monitoring
- [ ] Errors reported to Sentry
- [ ] Request IDs in all logs
- [ ] Performance metrics tracked
- [ ] Alerts configured for anomalies

---

## Risk Mitigation

### Backward Compatibility
- Keep legacy `/api/` routes during transition
- Add deprecation warnings
- Migrate client gradually to `/api/v1/`
- Document migration path

### Performance Regression
- Run load tests before/after each change
- Monitor response times in production
- Rollback plan ready
- Database connection pool monitored

### Testing Coverage
- Write tests before refactoring
- Keep integration tests as regression suite
- Add unit tests for new services
- E2E tests validate critical flows

---

**Total Timeline**: 5 weeks (25 working days)
**Estimated Effort**: 8-11 developer days
**Priority**: All optional - can be done incrementally
**Recommended**: Start with Phase 1 (load testing) before production launch

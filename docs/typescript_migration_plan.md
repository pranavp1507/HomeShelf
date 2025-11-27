# TypeScript Migration Plan - Backend Server

**Status**: Phase 5 - Planned
**Priority**: Medium
**Estimated Time**: 2-3 weeks
**Last Updated**: 2025-01-25

---

## Overview

Migrate the Node.js/Express backend from JavaScript to TypeScript for improved type safety, better developer experience, and consistency with the React frontend.

### Goals

1. **Type Safety**: Catch errors at compile-time instead of runtime
2. **Code Quality**: Self-documenting code with interfaces and types
3. **Developer Experience**: Better IDE autocomplete and refactoring
4. **Shared Types**: Reusable types between client and server
5. **Maintainability**: Easier to understand and modify codebase

### Current State

- **Language**: JavaScript (ES6+)
- **Lines of Code**: ~1,200 lines across 10+ files
- **Structure**: Modular (routes, middleware, utils) - recently refactored in Phase 3
- **Testing**: No automated tests (will add in Phase 6)

### Success Metrics

- ✅ 100% of server code migrated to TypeScript
- ✅ Zero `any` types in production code
- ✅ Shared types package created
- ✅ Build succeeds without errors
- ✅ All API endpoints work identically
- ✅ Docker builds succeed

---

## Phase 5.1: Infrastructure Setup (Week 1, Days 1-2)

### Tasks

**1. Install TypeScript Dependencies**
```bash
cd server
pnpm add -D typescript @types/node @types/express @types/pg @types/cors
pnpm add -D @types/bcryptjs @types/jsonwebtoken @types/multer @types/node-cron
pnpm add -D ts-node ts-node-dev
```

**2. Create TypeScript Configuration**

File: `server/tsconfig.json`
```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "forceConsistentCasingInFileNames": true,
    "resolveJsonModule": true,
    "moduleResolution": "node",
    "allowSyntheticDefaultImports": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitReturns": true,
    "noFallthroughCasesInSwitch": true,
    "allowJs": true, // Allow JS during migration
    "checkJs": false
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.test.ts"]
}
```

**3. Update package.json Scripts**

File: `server/package.json`
```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/index.ts",
    "build": "tsc",
    "start": "node dist/index.js",
    "migrate:up": "node-pg-migrate up",
    "migrate:down": "node-pg-migrate down",
    "migrate:create": "node-pg-migrate create"
  }
}
```

**4. Create Directory Structure**
```bash
server/
├── src/
│   ├── index.ts          # Main entry (migrated from index.js)
│   ├── db.ts             # Database connection
│   ├── types/            # TypeScript type definitions
│   │   ├── index.ts
│   │   ├── book.ts
│   │   ├── member.ts
│   │   ├── loan.ts
│   │   ├── user.ts
│   │   ├── category.ts
│   │   └── express.ts    # Express extensions
│   ├── routes/           # Route handlers
│   ├── middleware/       # Middleware
│   ├── utils/            # Utilities
│   └── config/           # Configuration
├── dist/                 # Compiled output (gitignored)
├── tsconfig.json
└── package.json
```

**5. Update .gitignore**
```
dist/
*.js.map
*.d.ts
!migrations/*.js
```

**Deliverables**:
- ✅ TypeScript tooling installed
- ✅ tsconfig.json configured
- ✅ Development workflow with ts-node-dev
- ✅ Build process configured

---

## Phase 5.2: Shared Types Package (Week 1, Days 3-4)

### Create Core Type Definitions

**File: `server/src/types/book.ts`**
```typescript
export interface Book {
  id: number;
  title: string;
  author: string;
  isbn: string;
  available: boolean;
  cover_image_path?: string | null;
  created_at: Date;
}

export interface BookInput {
  title: string;
  author: string;
  isbn: string;
  categoryIds?: number[];
}

export interface BookFilter {
  search?: string;
  available?: 'all' | 'true' | 'false';
  categoryIds?: number[];
}

export interface BookQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'title' | 'author' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  search?: string;
  available?: string;
  categoryIds?: string;
}
```

**File: `server/src/types/member.ts`**
```typescript
export interface Member {
  id: number;
  name: string;
  email: string;
  phone?: string | null;
  created_at: Date;
}

export interface MemberInput {
  name: string;
  email: string;
  phone?: string;
}

export interface MemberQueryParams {
  page?: number;
  limit?: number;
  sortBy?: 'name' | 'email' | 'created_at';
  sortOrder?: 'asc' | 'desc';
  search?: string;
}
```

**File: `server/src/types/loan.ts`**
```typescript
export interface Loan {
  id: number;
  book_id: number;
  member_id: number;
  borrow_date: Date;
  due_date: Date;
  return_date?: Date | null;
  created_at: Date;
}

export interface LoanWithDetails extends Loan {
  book_title: string;
  book_author: string;
  member_name: string;
  member_email: string;
  is_overdue: boolean;
}

export interface BorrowRequest {
  book_id: number;
  member_id: number;
}

export interface ReturnRequest {
  book_id: number;
}

export interface LoanQueryParams {
  page?: number;
  limit?: number;
  status?: 'all' | 'active' | 'returned' | 'overdue';
  search?: string;
}
```

**File: `server/src/types/user.ts`**
```typescript
export interface User {
  id: number;
  username: string;
  password_hash: string;
  role: 'admin' | 'member';
  created_at: Date;
}

export interface UserInput {
  username: string;
  password: string;
  role?: 'admin' | 'member';
}

export interface UserResponse {
  id: number;
  username: string;
  role: 'admin' | 'member';
  created_at: Date;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  user: UserResponse;
}

export interface JwtPayload {
  userId: number;
  username: string;
  role: 'admin' | 'member';
}
```

**File: `server/src/types/category.ts`**
```typescript
export interface Category {
  id: number;
  name: string;
  created_at: Date;
}

export interface CategoryInput {
  name: string;
}
```

**File: `server/src/types/express.ts`**
```typescript
import { Request } from 'express';
import { JwtPayload } from './user';

// Extend Express Request with authenticated user
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

// API Response types
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    totalPages: number;
    totalCount: number;
  };
}
```

**File: `server/src/types/index.ts`**
```typescript
// Export all types
export * from './book';
export * from './member';
export * from './loan';
export * from './user';
export * from './category';
export * from './express';
```

**Deliverables**:
- ✅ Complete type definitions for all entities
- ✅ Request/Response types for all APIs
- ✅ Express extensions for authentication
- ✅ Exportable type package

---

## Phase 5.3: Migrate Core Files (Week 1, Days 5-7)

### Migration Order

**1. Database Connection (`db.ts`)**

Before (JS):
```javascript
// db.js
const { Pool } = require('pg');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

module.exports = pool;
```

After (TS):
```typescript
// db.ts
import { Pool } from 'pg';

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
});

export default pool;
```

**2. Auth Utilities (`utils/authUtils.ts`)**

```typescript
import { Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { AuthRequest, JwtPayload, UserResponse } from '../types';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key';

export const generateToken = (user: UserResponse): string => {
  const payload: JwtPayload = {
    userId: user.id,
    username: user.username,
    role: user.role,
  };

  return jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
};

export const hashPassword = async (password: string): Promise<string> => {
  return bcrypt.hash(password, 10);
};

export const comparePassword = async (
  password: string,
  hash: string
): Promise<boolean> => {
  return bcrypt.compare(password, hash);
};

export const authenticateToken = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  const authHeader = req.headers['authorization'];
  const token = authHeader && authHeader.split(' ')[1];

  if (!token) {
    res.status(401).json({ error: 'Access token required' });
    return;
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as JwtPayload;
    req.user = decoded;
    next();
  } catch (err) {
    res.status(403).json({ error: 'Invalid or expired token' });
  }
};

export const checkAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (req.user?.role !== 'admin') {
    res.status(403).json({ error: 'Admin access required' });
    return;
  }
  next();
};
```

**3. Environment Configuration (`config/index.ts`)**

```typescript
import dotenv from 'dotenv';
dotenv.config();

interface Config {
  port: number;
  databaseUrl: string;
  jwtSecret: string;
  googleBooksApiKey?: string;
  nodeEnv: 'development' | 'production' | 'test';
}

const config: Config = {
  port: parseInt(process.env.PORT || '3001', 10),
  databaseUrl: process.env.DATABASE_URL || '',
  jwtSecret: process.env.JWT_SECRET || 'your-secret-key',
  googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY,
  nodeEnv: (process.env.NODE_ENV as Config['nodeEnv']) || 'development',
};

export default config;
```

**Deliverables**:
- ✅ db.ts migrated
- ✅ authUtils.ts migrated with full types
- ✅ config.ts created with environment validation
- ✅ All utilities properly typed

---

## Phase 5.4: Migrate Middleware (Week 2, Days 1-2)

**File: `server/src/middleware/errorHandler.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { ApiResponse } from '../types';

export class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message);
    Object.setPrototypeOf(this, AppError.prototype);
  }
}

export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<any>
) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

export const errorHandler = (
  err: Error | AppError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  if (err instanceof AppError) {
    const response: ApiResponse = {
      success: false,
      error: err.message,
    };
    res.status(err.statusCode).json(response);
    return;
  }

  // PostgreSQL errors
  if (err.message.includes('duplicate key')) {
    res.status(409).json({
      success: false,
      error: 'Resource already exists',
    });
    return;
  }

  // Default error
  console.error('Error:', err);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
  });
};

export const notFound = (req: Request, res: Response): void => {
  res.status(404).json({
    success: false,
    error: `Route ${req.originalUrl} not found`,
  });
};
```

**File: `server/src/middleware/validation.ts`**

```typescript
import { Request, Response, NextFunction } from 'express';
import { BookInput, MemberInput, UserInput, CategoryInput } from '../types';

const sanitizeString = (str: string): string => {
  return str.trim().replace(/[<>]/g, '');
};

export const validateBookInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { title, author, isbn } = req.body as BookInput;

  if (!title || !author) {
    res.status(400).json({ error: 'Title and author are required' });
    return;
  }

  req.body.title = sanitizeString(title);
  req.body.author = sanitizeString(author);
  if (isbn) req.body.isbn = sanitizeString(isbn);

  next();
};

export const validateMemberInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name, email } = req.body as MemberInput;

  if (!name || !email) {
    res.status(400).json({ error: 'Name and email are required' });
    return;
  }

  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  if (!emailRegex.test(email)) {
    res.status(400).json({ error: 'Invalid email format' });
    return;
  }

  req.body.name = sanitizeString(name);
  req.body.email = sanitizeString(email);

  next();
};

export const validateUserInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { username, password } = req.body as UserInput;

  if (!username || !password) {
    res.status(400).json({ error: 'Username and password are required' });
    return;
  }

  if (password.length < 6) {
    res.status(400).json({ error: 'Password must be at least 6 characters' });
    return;
  }

  req.body.username = sanitizeString(username);

  next();
};

export const validateCategoryInput = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name } = req.body as CategoryInput;

  if (!name) {
    res.status(400).json({ error: 'Category name is required' });
    return;
  }

  req.body.name = sanitizeString(name);

  next();
};

export const validatePagination = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const page = parseInt(req.query.page as string) || 1;
  const limit = parseInt(req.query.limit as string) || 10;

  if (page < 1 || limit < 1 || limit > 100) {
    res.status(400).json({ error: 'Invalid pagination parameters' });
    return;
  }

  req.query.page = page.toString();
  req.query.limit = limit.toString();

  next();
};
```

**Deliverables**:
- ✅ Error handling middleware with custom types
- ✅ Validation middleware with type guards
- ✅ Async handler wrapper
- ✅ All middleware properly typed

---

## Phase 5.5: Migrate Routes (Week 2, Days 3-5)

### Route Migration Pattern

**Example: Books Route (`routes/books.ts`)**

```typescript
import { Router, Response } from 'express';
import pool from '../db';
import { asyncHandler } from '../middleware/errorHandler';
import { validateBookInput, validatePagination } from '../middleware/validation';
import { authenticateToken } from '../utils/authUtils';
import {
  AuthRequest,
  Book,
  BookInput,
  BookQueryParams,
  PaginatedResponse,
} from '../types';

const router = Router();

// GET /api/books - Get all books with pagination
router.get(
  '/',
  validatePagination,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const {
      page = '1',
      limit = '10',
      sortBy = 'title',
      sortOrder = 'asc',
      search = '',
      available = 'all',
      categoryIds = '',
    } = req.query as BookQueryParams;

    const offset = (parseInt(page) - 1) * parseInt(limit);

    // Build query with type safety
    let query = `
      SELECT DISTINCT b.*
      FROM books b
      LEFT JOIN book_categories bc ON b.id = bc.book_id
      WHERE 1=1
    `;

    const queryParams: (string | number)[] = [];
    let paramIndex = 1;

    // Search filter
    if (search) {
      query += ` AND (
        b.title ILIKE $${paramIndex} OR
        b.author ILIKE $${paramIndex} OR
        b.isbn ILIKE $${paramIndex}
      )`;
      queryParams.push(`%${search}%`);
      paramIndex++;
    }

    // Availability filter
    if (available !== 'all') {
      query += ` AND b.available = $${paramIndex}`;
      queryParams.push(available === 'true');
      paramIndex++;
    }

    // Category filter
    if (categoryIds) {
      const categoryIdArray = categoryIds.split(',').map(Number);
      query += ` AND bc.category_id = ANY($${paramIndex}::int[])`;
      queryParams.push(categoryIdArray);
      paramIndex++;
    }

    // Get total count
    const countResult = await pool.query<{ count: string }>(
      `SELECT COUNT(DISTINCT b.id) as count FROM (${query}) b`,
      queryParams
    );
    const totalCount = parseInt(countResult.rows[0].count);

    // Add sorting and pagination
    query += ` ORDER BY b.${sortBy} ${sortOrder}`;
    query += ` LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
    queryParams.push(parseInt(limit), offset);

    const result = await pool.query<Book>(query, queryParams);

    const response: PaginatedResponse<Book> = {
      data: result.rows,
      pagination: {
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(totalCount / parseInt(limit)),
        totalCount,
      },
    };

    res.json(response);
  })
);

// POST /api/books - Create new book
router.post(
  '/',
  authenticateToken,
  validateBookInput,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { title, author, isbn, categoryIds = [] } = req.body as BookInput & {
      categoryIds: number[];
    };

    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      // Insert book
      const bookResult = await client.query<Book>(
        'INSERT INTO books (title, author, isbn, available) VALUES ($1, $2, $3, true) RETURNING *',
        [title, author, isbn || null]
      );
      const book = bookResult.rows[0];

      // Insert categories
      if (categoryIds.length > 0) {
        const categoryValues = categoryIds
          .map((_, i) => `($1, $${i + 2})`)
          .join(',');
        await client.query(
          `INSERT INTO book_categories (book_id, category_id) VALUES ${categoryValues}`,
          [book.id, ...categoryIds]
        );
      }

      await client.query('COMMIT');
      res.status(201).json(book);
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  })
);

// PUT /api/books/:id - Update book
router.put(
  '/:id',
  authenticateToken,
  validateBookInput,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;
    const { title, author, isbn } = req.body as BookInput;

    const result = await pool.query<Book>(
      'UPDATE books SET title = $1, author = $2, isbn = $3 WHERE id = $4 RETURNING *',
      [title, author, isbn || null, id]
    );

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    res.json(result.rows[0]);
  })
);

// DELETE /api/books/:id - Delete book
router.delete(
  '/:id',
  authenticateToken,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    const { id } = req.params;

    const result = await pool.query('DELETE FROM books WHERE id = $1 RETURNING id', [id]);

    if (result.rows.length === 0) {
      res.status(404).json({ error: 'Book not found' });
      return;
    }

    res.json({ message: 'Book deleted successfully' });
  })
);

export default router;
```

### Routes to Migrate (in order)

1. ✅ `routes/auth.ts` - Authentication routes
2. ✅ `routes/books.ts` - Book CRUD + lookup + bulk import
3. ✅ `routes/members.ts` - Member CRUD
4. ✅ `routes/loans.ts` - Loan management
5. ✅ `routes/categories.ts` - Category CRUD
6. ✅ `routes/users.ts` - User management
7. ✅ `routes/dashboard.ts` - Dashboard stats

**Deliverables**:
- ✅ All 7 route modules migrated
- ✅ Full type safety in all handlers
- ✅ Proper error handling
- ✅ Database queries typed

---

## Phase 5.6: Migrate Main Entry Point (Week 2, Day 6)

**File: `server/src/index.ts`**

```typescript
import express, { Express } from 'express';
import cors from 'cors';
import cron from 'node-cron';
import config from './config';
import pool from './db';
import { errorHandler, notFound } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth';
import bookRoutes from './routes/books';
import memberRoutes from './routes/members';
import loanRoutes from './routes/loans';
import categoryRoutes from './routes/categories';
import userRoutes from './routes/users';
import dashboardRoutes from './routes/dashboard';

const app: Express = express();

// Middleware
app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:3000',
  credentials: true,
}));
app.use(express.json());
app.use('/uploads', express.static('uploads'));

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', bookRoutes);
app.use('/api/members', memberRoutes);
app.use('/api/loans', loanRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/users', userRoutes);
app.use('/api/dashboard', dashboardRoutes);

// Health check
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// Error handling
app.use(notFound);
app.use(errorHandler);

// Cron job for overdue loans
cron.schedule('*/1 * * * *', async () => {
  try {
    const result = await pool.query(
      `SELECT COUNT(*) as count
       FROM loans
       WHERE return_date IS NULL
       AND due_date < NOW()`
    );

    const overdueCount = parseInt(result.rows[0].count);
    if (overdueCount > 0) {
      console.warn(`[${new Date().toISOString()}] Warning: ${overdueCount} overdue loans detected`);
    }
  } catch (err) {
    console.error('Error checking overdue loans:', err);
  }
});

// Graceful shutdown
const gracefulShutdown = async (signal: string) => {
  console.log(`${signal} received. Closing server gracefully...`);

  await pool.end();
  console.log('Database connections closed');

  process.exit(0);
};

process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
process.on('SIGINT', () => gracefulShutdown('SIGINT'));

// Start server
app.listen(config.port, () => {
  console.log(`Server running on port ${config.port}`);
  console.log(`Environment: ${config.nodeEnv}`);
});

export default app;
```

**Deliverables**:
- ✅ Main entry point migrated
- ✅ All imports converted to ES6
- ✅ Express app fully typed
- ✅ Graceful shutdown implemented

---

## Phase 5.7: Update Docker & Build (Week 2, Day 7)

**Update Containerfile**

```dockerfile
FROM node:24-alpine

WORKDIR /app

# Install pnpm
RUN corepack enable && corepack prepare pnpm@10.22.0 --activate

# Copy package files
COPY package.json pnpm-lock.yaml ./

# Install dependencies
RUN pnpm install --frozen-lockfile

# Copy source code
COPY . .

# Build TypeScript
RUN pnpm run build

# Expose port
EXPOSE 3001

# Start command
CMD ["sh", "-c", "pnpm run migrate:up && node dist/index.js"]
```

**Update start.sh**

```bash
#!/bin/sh
set -e

echo "Running database migrations..."
pnpm run migrate:up

echo "Starting server..."
node dist/index.js
```

**Update .dockerignore**

```
node_modules
dist
.env
*.log
src
tsconfig.json
```

**Deliverables**:
- ✅ Docker build updated for TypeScript
- ✅ Build step added to production
- ✅ Start script updated
- ✅ Development and production builds work

---

## Phase 5.8: Optional - Shared Types Package

### Create Shared Package (Optional Advanced Step)

**Structure**:
```
/packages
  /shared-types
    /src
      - book.ts
      - member.ts
      - loan.ts
      - user.ts
      - category.ts
      - api.ts
    - package.json
    - tsconfig.json

/client
  package.json (add: "@library/shared-types": "workspace:*")

/server
  package.json (add: "@library/shared-types": "workspace:*")

pnpm-workspace.yaml
```

**Benefits**:
- Single source of truth for types
- No duplication between client/server
- Automatic type updates across projects

**Complexity**: Medium-High
**Recommended**: Only if planning significant API expansion

---

## Testing Strategy (Phase 6 Integration)

### During Migration

**Manual Testing Checklist**:
- [ ] All API endpoints return expected responses
- [ ] Authentication still works
- [ ] File uploads work
- [ ] CSV bulk import works
- [ ] Pagination works
- [ ] Filters and search work
- [ ] Cron job runs without errors

### After Migration (Phase 6)

**Unit Tests** (with Jest + Supertest):
```typescript
// Example: books.test.ts
import request from 'supertest';
import app from '../src/index';

describe('Books API', () => {
  it('GET /api/books returns paginated books', async () => {
    const response = await request(app)
      .get('/api/books?page=1&limit=10')
      .expect(200);

    expect(response.body).toHaveProperty('data');
    expect(response.body).toHaveProperty('pagination');
    expect(Array.isArray(response.body.data)).toBe(true);
  });

  it('POST /api/books creates a new book', async () => {
    const newBook = {
      title: 'Test Book',
      author: 'Test Author',
      isbn: '1234567890',
    };

    const response = await request(app)
      .post('/api/books')
      .set('Authorization', 'Bearer valid-token')
      .send(newBook)
      .expect(201);

    expect(response.body).toMatchObject(newBook);
    expect(response.body).toHaveProperty('id');
  });
});
```

---

## Risk Mitigation

### Risks & Mitigations

| Risk | Impact | Likelihood | Mitigation |
|------|--------|------------|------------|
| Runtime errors from type mismatches | High | Medium | Thorough testing, gradual migration |
| Build failures | Medium | Low | Keep `allowJs: true` during transition |
| Breaking API changes | High | Low | Extensive manual testing |
| Developer learning curve | Low | Medium | Comprehensive documentation |
| Deployment issues | Medium | Low | Test Docker builds early |

### Rollback Plan

If migration causes issues:
1. Keep JavaScript files as `.js.backup`
2. Can revert by renaming `.ts` → `.js`
3. Git branches for each phase
4. Feature flags for new TypeScript routes

---

## Success Checklist

### Phase 5.1 ✅
- [ ] TypeScript installed and configured
- [ ] tsconfig.json created
- [ ] Development workflow with ts-node-dev
- [ ] Build process working

### Phase 5.2 ✅
- [ ] All type definitions created
- [ ] Types exported from index
- [ ] No `any` types used
- [ ] Types compile without errors

### Phase 5.3 ✅
- [ ] db.ts migrated
- [ ] authUtils.ts migrated
- [ ] config.ts created
- [ ] All utilities typed

### Phase 5.4 ✅
- [ ] Error handler migrated
- [ ] Validation middleware migrated
- [ ] All middleware typed
- [ ] No type errors

### Phase 5.5 ✅
- [ ] All 7 routes migrated
- [ ] Database queries typed
- [ ] Request/response types correct
- [ ] No type errors

### Phase 5.6 ✅
- [ ] index.ts migrated
- [ ] All routes imported
- [ ] App compiles successfully
- [ ] Server starts without errors

### Phase 5.7 ✅
- [ ] Docker builds successfully
- [ ] Production build works
- [ ] Migrations run correctly
- [ ] Server starts in container

### Phase 5.8 (Optional) ✅
- [ ] Shared types package created
- [ ] Client uses shared types
- [ ] Server uses shared types
- [ ] No type conflicts

---

## Timeline Summary

| Phase | Duration | Description |
|-------|----------|-------------|
| 5.1 | 2 days | Infrastructure setup |
| 5.2 | 2 days | Shared types package |
| 5.3 | 3 days | Core files migration |
| 5.4 | 2 days | Middleware migration |
| 5.5 | 3 days | Routes migration |
| 5.6 | 1 day | Main entry point |
| 5.7 | 1 day | Docker & build |
| 5.8 | 2 days | Shared package (optional) |
| **Total** | **14-16 days** | **2-3 weeks** |

---

## Post-Migration Benefits

### Immediate Benefits
- ✅ Compile-time error detection
- ✅ Better IDE autocomplete
- ✅ Self-documenting code
- ✅ Easier refactoring

### Long-term Benefits
- ✅ Reduced runtime errors
- ✅ Faster development velocity
- ✅ Easier onboarding for new developers
- ✅ Better code maintainability
- ✅ Foundation for shared types package

### Metrics to Track
- Number of bugs caught at compile-time
- Development time for new features
- Code review time reduction
- Developer satisfaction

---

## Next Steps After Migration

1. **Phase 6**: Add comprehensive testing (unit + integration)
2. **Phase 7**: Performance optimization and monitoring
3. **Phase 8**: Advanced features (email notifications, etc.)

---

**Document Version**: 1.0
**Last Updated**: 2025-01-25
**Author**: Development Team
**Status**: Ready for implementation

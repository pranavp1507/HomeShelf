# Server-Side Testing Suite Implementation Plan

**Status:** PLANNED
**Phase:** 6.5
**Estimated Duration:** 2-3 weeks
**Goal:** Achieve 80%+ server-side test coverage with comprehensive unit, integration, and E2E tests

---

## Current State Assessment

### Existing Test Coverage
- **Total Tests:** 7 tests (minimal coverage)
- **Test Files:** 1 file (`__tests__/auth.test.js`)
- **Coverage Areas:** Basic authentication utilities only (hashPassword, comparePasswords, generateToken, verifyToken)
- **Missing Coverage:**
  - 0 route/API integration tests
  - 0 middleware tests
  - 0 database tests
  - 0 business logic tests
  - 0 file upload tests
  - 0 CSV import/export tests

### Comparison with Client-Side
- **Client Tests:** 160 tests (113 unit + 47 E2E)
- **Server Tests:** 7 tests
- **Gap:** 95.6% fewer tests on server vs client

### Technical Debt
- No test database setup/teardown infrastructure
- No API integration test framework
- No mocking strategy for external dependencies
- No CI/CD test integration
- No test coverage reporting

---

## Testing Strategy

### Testing Philosophy
1. **Test Pyramid Approach:**
   - 60% Unit Tests (utilities, middleware, helpers)
   - 30% Integration Tests (routes, database operations)
   - 10% E2E Tests (critical user flows)

2. **TypeScript-First Testing:**
   - Leverage TypeScript for type-safe test assertions
   - Use typed mocks and fixtures
   - Maintain strict type checking in tests

3. **Database Testing Strategy:**
   - Separate test database instance
   - Transaction-based test isolation
   - Automated seed data for consistent test states
   - Cleanup after each test suite

4. **Coverage Goals:**
   - Overall: 80%+ code coverage
   - Routes: 90%+ coverage
   - Middleware: 95%+ coverage
   - Utils: 95%+ coverage
   - Critical paths: 100% coverage (auth, loans)

---

## Test Infrastructure Setup

### Required Tools & Packages

**Testing Framework:**
```json
{
  "jest": "^29.7.0",
  "@types/jest": "^29.5.12",
  "ts-jest": "^29.2.5"
}
```

**API Testing:**
```json
{
  "supertest": "^7.1.4",
  "@types/supertest": "^6.0.2"
}
```

**Database Testing:**
```json
{
  "pg-mem": "^3.0.2"  // In-memory PostgreSQL for fast tests
}
```

**Mocking & Utilities:**
```json
{
  "@faker-js/faker": "^9.4.0",  // Generate test data
  "nock": "^14.0.0"  // Mock external HTTP requests
}
```

### Test Configuration Files

**jest.config.js:**
```javascript
module.exports = {
  preset: 'ts-jest',
  testEnvironment: 'node',
  roots: ['<rootDir>/src', '<rootDir>/__tests__'],
  testMatch: ['**/__tests__/**/*.test.ts'],
  collectCoverageFrom: [
    'src/**/*.ts',
    '!src/types/**',
    '!src/index.ts'
  ],
  coverageThresholds: {
    global: {
      branches: 80,
      functions: 80,
      lines: 80,
      statements: 80
    }
  },
  setupFilesAfterEnv: ['<rootDir>/__tests__/setup.ts'],
  moduleNameMapper: {
    '^@/(.*)$': '<rootDir>/src/$1'
  }
};
```

**__tests__/setup.ts:**
```typescript
import { newDb } from 'pg-mem';

// Global test setup
beforeAll(() => {
  // Initialize test database
  // Set up global mocks
});

afterAll(() => {
  // Cleanup resources
});

// Mock environment variables
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/test';
```

### Test Database Strategy

**Option 1: pg-mem (Recommended for unit/integration tests)**
- In-memory PostgreSQL database
- Fast test execution
- No external dependencies
- Perfect for CI/CD

**Option 2: Separate Test PostgreSQL Instance**
- Real PostgreSQL instance for E2E tests
- More accurate to production
- Slower but comprehensive

**Implementation Pattern:**
```typescript
// __tests__/helpers/database.ts
import { newDb } from 'pg-mem';
import fs from 'fs';
import path from 'path';

export const setupTestDatabase = () => {
  const db = newDb();

  // Load and execute migrations
  const migrations = fs.readdirSync(path.join(__dirname, '../../migrations'));
  migrations.forEach(file => {
    const sql = fs.readFileSync(path.join(__dirname, '../../migrations', file), 'utf8');
    db.public.none(sql);
  });

  return db;
};

export const seedTestData = async (db) => {
  // Insert test data
  await db.public.none(`
    INSERT INTO users (username, password_hash, role)
    VALUES ('testadmin', '$2a$10$...', 'admin');
  `);
  // ... more seed data
};
```

---

## Test Categories & Implementation Plan

### Phase 1: Infrastructure & Utilities (Week 1, Sprint 1)

**1.1 Test Infrastructure Setup**
- [ ] Install testing dependencies (Jest, Supertest, ts-jest)
- [ ] Configure jest.config.js
- [ ] Create __tests__/setup.ts with global mocks
- [ ] Set up test database with pg-mem
- [ ] Create test helpers and utilities
- [ ] Configure test scripts in package.json

**1.2 Utility Function Tests**
Files to test:
- `src/utils/authUtils.ts` (expand existing tests)
- `src/utils/fileUpload.ts`

Test cases:
```typescript
// __tests__/utils/authUtils.test.ts
describe('authUtils', () => {
  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {});
    it('should generate different hashes for same password', async () => {});
    it('should reject empty passwords', async () => {});
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {});
    it('should return false for non-matching passwords', async () => {});
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {});
    it('should include user id and role in payload', () => {});
    it('should set expiration time', () => {});
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {});
    it('should reject expired token', () => {});
    it('should reject invalid signature', () => {});
  });

  describe('authenticateToken middleware', () => {
    it('should attach user to request for valid token', async () => {});
    it('should return 401 for missing token', async () => {});
    it('should return 403 for invalid token', async () => {});
  });
});

// __tests__/utils/fileUpload.test.ts
describe('fileUpload', () => {
  describe('multer configuration', () => {
    it('should accept valid image file', () => {});
    it('should reject non-image file', () => {});
    it('should enforce file size limit', () => {});
    it('should generate unique filenames', () => {});
  });
});
```

**Expected Coverage:** 95%+ for utils

---

### Phase 2: Middleware Tests (Week 1, Sprint 2)

**2.1 Error Handling Middleware**
File: `src/middleware/errorHandler.ts`

Test cases:
```typescript
// __tests__/middleware/errorHandler.test.ts
describe('errorHandler middleware', () => {
  describe('asyncHandler', () => {
    it('should catch async errors and pass to next', async () => {});
    it('should not interfere with successful requests', async () => {});
  });

  describe('errorHandler', () => {
    it('should return 400 for validation errors', () => {});
    it('should return 404 for not found errors', () => {});
    it('should return 500 for unknown errors', () => {});
    it('should handle PostgreSQL errors correctly', () => {});
    it('should not leak error details in production', () => {});
  });

  describe('notFound', () => {
    it('should return 404 with proper message', () => {});
  });
});
```

**2.2 Validation Middleware**
File: `src/middleware/validation.ts`

Test cases:
```typescript
// __tests__/middleware/validation.test.ts
describe('validation middleware', () => {
  describe('validateBookInput', () => {
    it('should accept valid book data', () => {});
    it('should reject missing title', () => {});
    it('should reject missing author', () => {});
    it('should sanitize XSS attempts', () => {});
    it('should validate ISBN format', () => {});
  });

  describe('validateMemberInput', () => {
    it('should accept valid member data', () => {});
    it('should reject invalid email format', () => {});
    it('should reject invalid phone format', () => {});
    it('should sanitize inputs', () => {});
  });

  describe('validateUserInput', () => {
    it('should accept valid user data', () => {});
    it('should enforce password strength', () => {});
    it('should validate role values', () => {});
  });

  describe('validatePaginationParams', () => {
    it('should accept valid pagination params', () => {});
    it('should enforce maximum page size', () => {});
    it('should default to page 1 if not provided', () => {});
    it('should reject negative values', () => {});
  });
});
```

**Expected Coverage:** 95%+ for middleware

---

### Phase 3: Route Integration Tests - Core Entities (Week 2)

**3.1 Authentication Routes**
File: `src/routes/auth.ts`

Test cases:
```typescript
// __tests__/routes/auth.test.ts
import request from 'supertest';
import { app } from '../../src/index';

describe('Auth Routes', () => {
  describe('GET /api/auth/setup-status', () => {
    it('should return needsSetup=true when no admin exists', async () => {});
    it('should return needsSetup=false when admin exists', async () => {});
  });

  describe('POST /api/auth/setup', () => {
    it('should create first admin user', async () => {});
    it('should hash password correctly', async () => {});
    it('should return 400 if admin already exists', async () => {});
    it('should validate required fields', async () => {});
  });

  describe('POST /api/auth/register', () => {
    it('should register new user as admin', async () => {});
    it('should return 403 for non-admin', async () => {});
    it('should reject duplicate username', async () => {});
    it('should validate password strength', async () => {});
  });

  describe('POST /api/auth/login', () => {
    it('should login with valid credentials', async () => {});
    it('should return JWT token', async () => {});
    it('should return 401 for invalid credentials', async () => {});
    it('should return 401 for non-existent user', async () => {});
  });

  describe('POST /api/auth/forgot-password', () => {
    it('should accept valid email', async () => {});
    it('should return success even for non-existent email (security)', async () => {});
  });

  describe('POST /api/auth/reset-password', () => {
    it('should reset password with valid token', async () => {});
    it('should reject invalid token', async () => {});
    it('should reject expired token', async () => {});
  });
});
```

**3.2 Books Routes**
File: `src/routes/books.ts`

Test cases:
```typescript
// __tests__/routes/books.test.ts
describe('Books Routes', () => {
  let authToken: string;

  beforeAll(async () => {
    // Login and get token
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'testadmin', password: 'password' });
    authToken = res.body.token;
  });

  describe('GET /api/books', () => {
    it('should return paginated books', async () => {});
    it('should filter by category', async () => {});
    it('should filter by availability', async () => {});
    it('should search by title/author/ISBN', async () => {});
    it('should sort by specified field', async () => {});
    it('should include categories for each book', async () => {});
  });

  describe('POST /api/books', () => {
    it('should create book with valid data', async () => {});
    it('should require authentication', async () => {});
    it('should validate required fields', async () => {});
    it('should associate categories', async () => {});
    it('should reject duplicate ISBN', async () => {});
  });

  describe('PUT /api/books/:id', () => {
    it('should update book with valid data', async () => {});
    it('should require authentication', async () => {});
    it('should return 404 for non-existent book', async () => {});
    it('should update categories', async () => {});
  });

  describe('DELETE /api/books/:id', () => {
    it('should delete book', async () => {});
    it('should require authentication', async () => {});
    it('should return 404 for non-existent book', async () => {});
    it('should cascade delete book_categories', async () => {});
  });

  describe('POST /api/books/lookup', () => {
    it('should lookup book from Google Books API', async () => {});
    it('should lookup book from Open Library API', async () => {});
    it('should handle API failures gracefully', async () => {});
  });

  describe('POST /api/books/bulk-import', () => {
    it('should import books from CSV', async () => {});
    it('should skip duplicate ISBNs', async () => {});
    it('should validate CSV format', async () => {});
    it('should require admin authentication', async () => {});
    it('should rollback on errors', async () => {});
  });

  describe('POST /api/books/:id/cover', () => {
    it('should upload cover image', async () => {});
    it('should reject non-image files', async () => {});
    it('should enforce file size limit', async () => {});
    it('should update cover_image_path', async () => {});
  });
});
```

**3.3 Members Routes**
File: `src/routes/members.ts`

Test cases:
```typescript
// __tests__/routes/members.test.ts
describe('Members Routes', () => {
  describe('GET /api/members', () => {
    it('should return paginated members', async () => {});
    it('should search by name/email/phone', async () => {});
    it('should sort by specified field', async () => {});
  });

  describe('GET /api/members/:id', () => {
    it('should return member by id', async () => {});
    it('should return 404 for non-existent member', async () => {});
  });

  describe('POST /api/members', () => {
    it('should create member with valid data', async () => {});
    it('should require authentication', async () => {});
    it('should validate email format', async () => {});
    it('should validate phone format', async () => {});
  });

  describe('PUT /api/members/:id', () => {
    it('should update member', async () => {});
    it('should require authentication', async () => {});
    it('should return 404 for non-existent member', async () => {});
  });

  describe('DELETE /api/members/:id', () => {
    it('should delete member', async () => {});
    it('should require authentication', async () => {});
    it('should cascade delete loans', async () => {});
  });

  describe('POST /api/members/bulk-import', () => {
    it('should import members from CSV', async () => {});
    it('should validate email uniqueness', async () => {});
    it('should handle errors gracefully', async () => {});
  });
});
```

**3.4 Loans Routes**
File: `src/routes/loans.ts`

Test cases:
```typescript
// __tests__/routes/loans.test.ts
describe('Loans Routes', () => {
  describe('POST /api/loans/borrow', () => {
    it('should create loan for available book', async () => {});
    it('should set due date to 14 days from now', async () => {});
    it('should mark book as unavailable', async () => {});
    it('should return 400 if book unavailable', async () => {});
    it('should require authentication', async () => {});
    it('should use transaction for data consistency', async () => {});
  });

  describe('POST /api/loans/return', () => {
    it('should return book', async () => {});
    it('should set return_date', async () => {});
    it('should mark book as available', async () => {});
    it('should return 404 if loan not found', async () => {});
    it('should use transaction for data consistency', async () => {});
  });

  describe('GET /api/loans', () => {
    it('should return paginated loans', async () => {});
    it('should filter by status (active/overdue/returned)', async () => {});
    it('should search by book/member', async () => {});
    it('should include book and member details', async () => {});
  });
});
```

**Expected Coverage:** 90%+ for routes

---

### Phase 4: Route Integration Tests - Admin Features (Week 2)

**4.1 Categories Routes**
```typescript
// __tests__/routes/categories.test.ts
describe('Categories Routes', () => {
  describe('GET /api/categories', () => {
    it('should return all categories', async () => {});
    it('should include book counts', async () => {});
  });

  describe('POST /api/categories', () => {
    it('should create category as admin', async () => {});
    it('should return 403 for non-admin', async () => {});
    it('should reject duplicate names', async () => {});
  });

  describe('PUT /api/categories/:id', () => {
    it('should update category as admin', async () => {});
    it('should return 403 for non-admin', async () => {});
  });

  describe('DELETE /api/categories/:id', () => {
    it('should delete category as admin', async () => {});
    it('should cascade delete book_categories', async () => {});
    it('should return 403 for non-admin', async () => {});
  });
});
```

**4.2 Users Routes**
```typescript
// __tests__/routes/users.test.ts
describe('Users Routes', () => {
  describe('GET /api/users', () => {
    it('should return all users as admin', async () => {});
    it('should exclude password_hash from response', async () => {});
    it('should return 403 for non-admin', async () => {});
  });

  describe('PUT /api/users/:id', () => {
    it('should update user role as admin', async () => {});
    it('should return 403 for non-admin', async () => {});
  });

  describe('DELETE /api/users/:id', () => {
    it('should delete user as admin', async () => {});
    it('should prevent deleting last admin', async () => {});
    it('should return 403 for non-admin', async () => {});
  });

  describe('PUT /api/users/:id/password', () => {
    it('should change password as admin', async () => {});
    it('should hash new password', async () => {});
    it('should return 403 for non-admin', async () => {});
  });
});
```

**4.3 Dashboard Routes**
```typescript
// __tests__/routes/dashboard.test.ts
describe('Dashboard Routes', () => {
  describe('GET /api/dashboard', () => {
    it('should return statistics', async () => {});
    it('should calculate total books correctly', async () => {});
    it('should calculate available books correctly', async () => {});
    it('should calculate total members correctly', async () => {});
    it('should calculate active loans correctly', async () => {});
    it('should calculate overdue loans correctly', async () => {});
    it('should require authentication', async () => {});
  });
});
```

**4.4 Export Routes**
```typescript
// __tests__/routes/export.test.ts
describe('Export Routes', () => {
  describe('GET /api/export/books', () => {
    it('should export books as CSV', async () => {});
    it('should filter by date range', async () => {});
    it('should include all required fields', async () => {});
    it('should require admin authentication', async () => {});
  });

  describe('GET /api/export/members', () => {
    it('should export members as CSV', async () => {});
    it('should filter by date range', async () => {});
    it('should require admin authentication', async () => {});
  });

  describe('GET /api/export/loans', () => {
    it('should export loans as CSV', async () => {});
    it('should filter by date range and status', async () => {});
    it('should require admin authentication', async () => {});
  });
});
```

**4.5 System Routes**
```typescript
// __tests__/routes/system.test.ts
describe('System Routes', () => {
  describe('GET /api/system/info', () => {
    it('should return system information as admin', async () => {});
    it('should include configuration status', async () => {});
    it('should return 403 for non-admin', async () => {});
  });
});
```

---

### Phase 5: Database Integration Tests (Week 3)

**5.1 Database Connection Tests**
```typescript
// __tests__/db.test.ts
describe('Database Connection', () => {
  it('should connect to database successfully', async () => {});
  it('should execute queries', async () => {});
  it('should handle connection errors', async () => {});
  it('should support transactions', async () => {});
  it('should rollback on transaction errors', async () => {});
});
```

**5.2 Transaction Tests**
```typescript
// __tests__/integration/transactions.test.ts
describe('Database Transactions', () => {
  describe('Borrow Book Transaction', () => {
    it('should commit when successful', async () => {});
    it('should rollback when loan insert fails', async () => {});
    it('should rollback when book update fails', async () => {});
  });

  describe('Return Book Transaction', () => {
    it('should commit when successful', async () => {});
    it('should rollback when loan update fails', async () => {});
    it('should rollback when book update fails', async () => {});
  });

  describe('Bulk Import Transaction', () => {
    it('should commit all books when successful', async () => {});
    it('should rollback all books on any error', async () => {});
  });
});
```

---

### Phase 6: Business Logic & Edge Cases (Week 3)

**6.1 Overdue Loan Detection**
```typescript
// __tests__/business-logic/overdue-loans.test.ts
describe('Overdue Loan Detection', () => {
  it('should detect overdue loans', async () => {});
  it('should not flag returned loans as overdue', async () => {});
  it('should calculate days overdue correctly', async () => {});
  it('should log overdue warnings', async () => {});
});
```

**6.2 CSV Import/Export Logic**
```typescript
// __tests__/business-logic/csv-operations.test.ts
describe('CSV Import', () => {
  it('should parse valid CSV', () => {});
  it('should handle missing optional fields', () => {});
  it('should reject malformed CSV', () => {});
  it('should handle large files', () => {});
});

describe('CSV Export', () => {
  it('should format data correctly', () => {});
  it('should escape special characters', () => {});
  it('should handle empty result sets', () => {});
});
```

**6.3 ISBN Lookup Logic**
```typescript
// __tests__/business-logic/isbn-lookup.test.ts
import nock from 'nock';

describe('ISBN Lookup', () => {
  beforeEach(() => {
    nock.cleanAll();
  });

  describe('Google Books API', () => {
    it('should fetch book data successfully', async () => {});
    it('should handle API errors gracefully', async () => {});
    it('should handle invalid ISBN', async () => {});
  });

  describe('Open Library API', () => {
    it('should fetch book data successfully', async () => {});
    it('should handle API errors gracefully', async () => {});
  });

  describe('Fallback Strategy', () => {
    it('should try Google Books first', async () => {});
    it('should fallback to Open Library if Google fails', async () => {});
    it('should return error if both fail', async () => {});
  });
});
```

---

## Test Data Management

### Seed Data Strategy

**Create test fixtures:**
```typescript
// __tests__/fixtures/users.ts
export const testUsers = {
  admin: {
    username: 'testadmin',
    password: 'Admin123!',
    password_hash: '$2a$10$...',
    role: 'admin'
  },
  member: {
    username: 'testmember',
    password: 'Member123!',
    password_hash: '$2a$10$...',
    role: 'member'
  }
};

// __tests__/fixtures/books.ts
export const testBooks = [
  {
    id: 1,
    title: 'Test Book 1',
    author: 'Test Author',
    isbn: '9780123456789',
    available: true
  },
  // ... more books
];

// __tests__/fixtures/members.ts
export const testMembers = [
  {
    id: 1,
    name: 'Test Member',
    email: 'test@example.com',
    phone: '1234567890'
  },
  // ... more members
];
```

### Database Helpers

```typescript
// __tests__/helpers/database.ts
export const clearDatabase = async () => {
  await query('TRUNCATE users, books, members, loans, categories, book_categories CASCADE');
};

export const seedDatabase = async () => {
  await clearDatabase();

  // Insert test users
  for (const user of Object.values(testUsers)) {
    await query(
      'INSERT INTO users (username, password_hash, role) VALUES ($1, $2, $3)',
      [user.username, user.password_hash, user.role]
    );
  }

  // Insert test books
  // Insert test members
  // etc.
};
```

---

## CI/CD Integration

### GitHub Actions Workflow

```yaml
# .github/workflows/server-tests.yml
name: Server Tests

on:
  push:
    branches: [master, develop]
    paths:
      - 'server/**'
  pull_request:
    branches: [master, develop]
    paths:
      - 'server/**'

jobs:
  test:
    runs-on: ubuntu-latest

    services:
      postgres:
        image: postgres:16
        env:
          POSTGRES_USER: test
          POSTGRES_PASSWORD: test
          POSTGRES_DB: library_test
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5

    steps:
      - uses: actions/checkout@v4

      - name: Setup Node.js
        uses: actions/setup-node@v4
        with:
          node-version: '24'

      - name: Install pnpm
        uses: pnpm/action-setup@v4
        with:
          version: 10.22.0

      - name: Install dependencies
        run: cd server && pnpm install

      - name: Run migrations
        run: cd server && pnpm run migrate up
        env:
          DATABASE_URL: postgresql://test:test@localhost:5432/library_test

      - name: Run tests
        run: cd server && pnpm test
        env:
          NODE_ENV: test
          DATABASE_URL: postgresql://test:test@localhost:5432/library_test
          JWT_SECRET: test-secret

      - name: Upload coverage
        uses: codecov/codecov-action@v4
        with:
          files: ./server/coverage/lcov.info
          flags: server
```

---

## Success Criteria

### Coverage Metrics
- [ ] Overall code coverage: 80%+
- [ ] Route coverage: 90%+
- [ ] Middleware coverage: 95%+
- [ ] Utils coverage: 95%+
- [ ] Critical path coverage: 100% (auth, loans)

### Test Quality Metrics
- [ ] All routes have integration tests
- [ ] All middleware functions tested
- [ ] All utility functions tested
- [ ] Database transactions tested
- [ ] Error handling tested
- [ ] Input validation tested
- [ ] Authentication/authorization tested

### Integration Metrics
- [ ] CI/CD pipeline integrated
- [ ] Coverage reports automated
- [ ] Tests run on every PR
- [ ] Test failures block merges

### Documentation Metrics
- [ ] Test README created
- [ ] Test patterns documented
- [ ] Fixture usage documented
- [ ] Mock strategy documented

---

## Implementation Timeline

### Week 1
- **Sprint 1 (Days 1-2):** Test infrastructure setup, utility tests
- **Sprint 2 (Days 3-5):** Middleware tests

### Week 2
- **Sprint 3 (Days 1-3):** Core route tests (auth, books, members, loans)
- **Sprint 4 (Days 4-5):** Admin route tests (categories, users, dashboard, export, system)

### Week 3
- **Sprint 5 (Days 1-2):** Database integration tests
- **Sprint 6 (Days 3-4):** Business logic and edge case tests
- **Sprint 7 (Day 5):** CI/CD integration, documentation, final review

---

## Migration from Existing Tests

### Preserve Existing Tests
The current 7 tests in `__tests__/auth.test.js` should be:
1. Migrated to TypeScript (`__tests__/utils/authUtils.test.ts`)
2. Expanded with additional test cases
3. Integrated with new test infrastructure

### Migration Steps
1. Copy existing tests to new location
2. Convert to TypeScript
3. Update to use new test helpers
4. Add additional test cases
5. Verify all tests still pass

---

## Risk Mitigation

### Potential Risks
1. **Test Database Performance:** In-memory DB (pg-mem) may have limitations
   - Mitigation: Use real PostgreSQL for E2E tests if needed

2. **Flaky Tests:** Timing issues with async operations
   - Mitigation: Use proper async/await, avoid arbitrary timeouts

3. **Test Data Pollution:** Tests affecting each other
   - Mitigation: Transaction-based isolation, cleanup after each test

4. **External API Dependencies:** ISBN lookup tests failing due to API changes
   - Mitigation: Mock external APIs with nock, test both success and failure paths

---

## Future Enhancements

After achieving 80%+ coverage, consider:
1. **Load Testing:** Use Artillery or k6 for performance testing
2. **Security Testing:** OWASP ZAP integration
3. **Contract Testing:** Pact for API contract testing
4. **Mutation Testing:** Stryker for test quality assessment
5. **Visual Regression:** Percy or Chromatic for UI testing
6. **Chaos Engineering:** Test resilience under failure conditions

---

## References

- Jest Documentation: https://jestjs.io/
- Supertest Documentation: https://github.com/ladjs/supertest
- pg-mem Documentation: https://github.com/oguimbal/pg-mem
- TypeScript Testing Best Practices: https://testingjavascript.com/

---

**This plan provides a comprehensive roadmap for achieving production-grade test coverage on the server-side. Execute phases sequentially to maintain momentum and ensure quality at each step.**

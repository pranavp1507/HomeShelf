# Testing Guide

This guide explains how to run and write tests for the Mulampuzha Library Management System.

---

## Current Testing Status

**Phase 1 (Completed):**

- ✅ Basic test framework setup (Jest + Supertest)
- ✅ Authentication utility tests
- ✅ Password hashing tests
- ✅ JWT token tests

**Phase 2 (Planned):**

- 🚧 Integration tests for API endpoints
- 🚧 Database transaction tests
- 🚧 Frontend component tests

See [issues_and_gaps.md](./issues_and_gaps.md) for the complete testing roadmap.

---

## Backend Tests

### Setup

1. **Navigate to server directory:**

   ```bash
   cd server
   ```

2. **Install dependencies** (if not already done):

   ```bash
   pnpm install
   ```

3. **Run tests:**

   ```bash
   pnpm test
   ```

### Available Test Commands

```bash
# Run all tests once
pnpm test

# Watch mode - re-run tests on file changes
pnpm run test:watch

# Generate coverage report
pnpm run test:coverage
```

### Test Files

Tests are located in `server/__tests__/`:

- `auth.test.js` - Authentication and security tests

### Writing New Tests

Create a new file in `server/__tests__/` with the `.test.js` extension:

```javascript
const authUtils = require("../authUtils");

describe("Feature Name", () => {
  describe("Specific Functionality", () => {
    it("should behave correctly", () => {
      // Arrange
      const input = "test";

      // Act
      const result = someFunction(input);

      // Assert
      expect(result).toBe("expected");
    });
  });
});
```

---

## Frontend Tests (Planned)

Frontend testing will use:

- **Jest** - Test runner
- **React Testing Library** - Component testing
- **Testing Library User Event** - Simulating user interactions

### Setup (Coming Soon)

```bash
cd client
pnpm install --save-dev @testing-library/react @testing-library/jest-dom @testing-library/user-event
pnpm test
```

---

## Integration Tests (Planned)

Integration tests will verify the entire system working together.

### Test Database Setup

For integration tests, we need a separate test database:

1. **Create test database:**

   ```sql
   CREATE DATABASE library_test;
   ```

2. **Run migrations on test DB:**

   ```bash
   DATABASE_URL=postgres://user:password@localhost:5432/library_test pnpm run migrate
   ```

3. **Configure test environment:**
   Create `server/.env.test`:

   ```env
   DATABASE_URL=postgres://user:password@localhost:5432/library_test
   JWT_SECRET=test_secret_key
   ```

4. **Tests clean up after themselves:**
   - Truncate tables between tests
   - Use transactions and rollback
   - Or reset database to known state

---

## Test Coverage Goals

### Critical Paths (Priority 1)

- ✅ Authentication (password hashing, JWT)
- 🚧 Loan transactions (borrow/return with proper rollback)
- 🚧 Category filtering (OR logic verification)
- 🚧 User registration and login flows

### Important Paths (Priority 2)

- 🚧 Book CRUD operations
- 🚧 Member CRUD operations
- 🚧 Bulk import functionality
- 🚧 File upload handling

### Nice to Have (Priority 3)

- 🚧 Error handling scenarios
- 🚧 Input validation
- 🚧 Edge cases and boundary conditions
- 🚧 Performance tests

### Target Coverage

- **Phase 1:** >40% coverage (critical paths)
- **Phase 2:** >70% coverage (important paths)
- **Phase 3:** >80% coverage (comprehensive)

---

## Continuous Integration

When CI/CD is configured, tests will run automatically:

### GitHub Actions Example (Planned)

```yaml
name: Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v3
        with:
          node-version: "24"
          cache: "pnpm"
      - run: cd server && pnpm install
      - run: cd server && pnpm test
```

---

## Test-Driven Development (TDD)

For new features, consider using TDD:

1. **Write a failing test** first
2. **Implement the feature** to make it pass
3. **Refactor** while keeping tests green

Example workflow:

```javascript
// 1. Write failing test
describe("New Feature", () => {
  it("should work correctly", () => {
    const result = newFeature(input);
    expect(result).toBe(expected); // This fails initially
  });
});

// 2. Implement feature
function newFeature(input) {
  // Implementation here
  return expected;
}

// 3. Test passes, refactor if needed
```

---

## Common Testing Patterns

### Testing Async Functions

```javascript
it("should handle async operations", async () => {
  const result = await asyncFunction();
  expect(result).toBeDefined();
});
```

### Testing Error Cases

```javascript
it("should throw error for invalid input", () => {
  expect(() => {
    dangerousFunction(invalidInput);
  }).toThrow("Expected error message");
});
```

### Testing API Endpoints (Integration)

```javascript
const request = require("supertest");
const app = require("../index"); // Your Express app

it("should return books", async () => {
  const response = await request(app)
    .get("/api/books")
    .set("Authorization", `Bearer ${token}`)
    .expect(200);

  expect(response.body).toBeInstanceOf(Array);
});
```

---

## Debugging Tests

### Run Single Test File

```bash
pnpm test auth.test.js
```

### Run Single Test

```bash
pnpm test -t "should hash passwords securely"
```

### Verbose Output

```bash
pnpm test --verbose
```

### See Console Logs

By default Jest hides console.log. To see them:

```bash
pnpm test --silent=false
```

---

## Mocking

For unit tests, you may need to mock dependencies:

### Mocking Modules

```javascript
jest.mock("../db", () => ({
  query: jest.fn(),
  pool: {
    connect: jest.fn(),
  },
}));
```

### Mocking Time

```javascript
jest.useFakeTimers();
jest.setSystemTime(new Date("2025-01-01"));
```

---

## Resources

- [Jest Documentation](https://jestjs.io/)
- [Supertest Documentation](https://github.com/ladjs/supertest)
- [React Testing Library](https://testing-library.com/react)
- [Testing Best Practices](https://github.com/goldbergyoni/javascript-testing-best-practices)

---

## Getting Help

- Check existing tests for examples
- Read the Jest error messages carefully
- Use `--verbose` flag for more details
- Open an issue if you find bugs in tests

---

## Future Improvements

See Phase 5 in [issues_and_gaps.md](./issues_and_gaps.md):

- E2E tests with Playwright or Cypress
- Visual regression tests
- Performance/load tests
- Security tests (OWASP)
- Mutation testing

**Current focus:** Get basic test coverage for critical paths, then expand gradually.

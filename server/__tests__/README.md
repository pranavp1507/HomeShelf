# Server Tests

This directory contains tests for the backend API.

## Running Tests

### Install Dependencies First

If you haven't already, install test dependencies:

```bash
cd server
pnpm install
```

### Run All Tests

```bash
pnpm test
```

### Watch Mode (for development)

```bash
pnpm run test:watch
```

### Coverage Report

```bash
pnpm run test:coverage
```

## Test Structure

- `auth.test.js` - Authentication and security tests
- More tests to be added for:
  - Loan transactions (verifying database transactions work correctly)
  - Category filtering (verifying OR logic works)
  - Book management endpoints
  - Member management endpoints

## Current Test Coverage

### ✅ Implemented
- Password hashing and verification
- JWT token generation and validation

### 🚧 TODO (See issues_and_gaps.md)
- Integration tests for all API endpoints
- Database transaction tests
- Category filter logic tests
- Error handling tests
- Input validation tests

## Test Database Setup

For full integration tests, you'll need a separate test database:

1. Create a test database: `library_test`
2. Run migrations on test DB
3. Configure `DATABASE_URL` for test environment
4. Tests should clean up after themselves (truncate tables)

This setup is planned for future implementation.

## Notes

- Current tests focus on utility functions that don't require database
- Integration tests (requiring database) are marked as TODO
- Tests use Jest and Supertest
- Node environment is set to 'test' when running tests

## Writing New Tests

Example test structure:

```javascript
describe('Feature Name', () => {
  describe('Specific Functionality', () => {
    it('should do something specific', () => {
      // Arrange
      const input = 'test';

      // Act
      const result = someFunction(input);

      // Assert
      expect(result).toBe('expected');
    });
  });
});
```

## Continuous Integration

When CI/CD is set up, tests should run automatically on:
- Every commit
- Every pull request
- Before deployment

See `docs/issues_and_gaps.md` for the full testing roadmap.

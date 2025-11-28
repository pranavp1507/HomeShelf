/**
 * Global test setup file
 * Sets up environment variables, global mocks, and test database
 */

// Mock environment variables for tests
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-testing-only';
process.env.DATABASE_URL = 'postgresql://test:test@localhost:5432/library_test';
process.env.PORT = '3001';
process.env.CLIENT_URL = 'http://localhost:3000';
process.env.ENABLE_EMAIL_NOTIFICATIONS = 'false';
process.env.ENABLE_OVERDUE_CHECKS = 'false';
process.env.GOOGLE_BOOKS_API_KEY = 'test-api-key';

// Suppress console output during tests (optional - uncomment if needed)
// global.console = {
//   ...console,
//   log: jest.fn(),
//   debug: jest.fn(),
//   info: jest.fn(),
//   warn: jest.fn(),
//   error: jest.fn(),
// };

// Global test setup
beforeAll(async () => {
  // Any global setup needed before all tests
});

// Global test teardown
afterAll(async () => {
  // Any global cleanup needed after all tests
});

// Reset mocks between tests
afterEach(() => {
  jest.clearAllMocks();
});

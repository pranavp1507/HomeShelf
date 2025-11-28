/**
 * Validation Middleware Tests
 *
 * Tests for input validation middleware including:
 * - Email validation
 * - ISBN validation
 * - String sanitization
 * - Book validation
 * - Member validation
 * - User validation
 * - Category validation
 * - Loan validation
 * - Pagination validation
 */

import { Response, NextFunction } from 'express';
import { AuthRequest } from '../../src/types/express';
import {
  isValidEmail,
  isValidISBN,
  sanitizeString,
  validateBook,
  validateMember,
  validateUser,
  validateCategory,
  validateLoan,
  validatePagination,
} from '../../src/middleware/validation';

describe('Validation Middleware', () => {
  describe('isValidEmail', () => {
    it('should accept valid email addresses', () => {
      expect(isValidEmail('user@example.com')).toBe(true);
      expect(isValidEmail('test.user@domain.co.uk')).toBe(true);
      expect(isValidEmail('john+doe@company.org')).toBe(true);
      expect(isValidEmail('admin123@test.io')).toBe(true);
    });

    it('should reject invalid email addresses', () => {
      expect(isValidEmail('notanemail')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('user@')).toBe(false);
      expect(isValidEmail('user @example.com')).toBe(false);
      expect(isValidEmail('')).toBe(false);
    });

    it('should reject email without domain', () => {
      expect(isValidEmail('user@domain')).toBe(false);
    });

    it('should reject email with spaces', () => {
      expect(isValidEmail('user name@example.com')).toBe(false);
    });
  });

  describe('isValidISBN', () => {
    it('should accept valid ISBN-13', () => {
      expect(isValidISBN('9780123456789')).toBe(true);
      expect(isValidISBN('978-0-123-45678-9')).toBe(true);
      expect(isValidISBN('978 0 123 45678 9')).toBe(true);
    });

    it('should accept valid ISBN-10', () => {
      expect(isValidISBN('0123456789')).toBe(true);
      expect(isValidISBN('012345678X')).toBe(true);
      expect(isValidISBN('0-12-345678-9')).toBe(true);
    });

    it('should reject invalid ISBN', () => {
      expect(isValidISBN('123')).toBe(false);
      expect(isValidISBN('abcdefghij')).toBe(false);
      expect(isValidISBN('12345')).toBe(false);
      expect(isValidISBN('')).toBe(false);
    });

    it('should handle ISBN with hyphens and spaces', () => {
      expect(isValidISBN('978-0-123-45678-9')).toBe(true);
      expect(isValidISBN('0-12-345678-9')).toBe(true);
    });
  });

  describe('sanitizeString', () => {
    it('should trim whitespace', () => {
      expect(sanitizeString('  hello  ')).toBe('hello');
      expect(sanitizeString('\ttest\n')).toBe('test');
    });

    it('should remove < and > characters', () => {
      expect(sanitizeString('<script>alert("xss")</script>')).toBe('scriptalert("xss")/script');
      expect(sanitizeString('Hello <b>world</b>')).toBe('Hello bworld/b');
    });

    it('should handle non-string inputs', () => {
      expect(sanitizeString(123)).toBe(123);
      expect(sanitizeString(null)).toBe(null);
      expect(sanitizeString(undefined)).toBe(undefined);
    });

    it('should handle empty string', () => {
      expect(sanitizeString('')).toBe('');
    });

    it('should preserve safe special characters', () => {
      expect(sanitizeString('Hello! World?')).toBe('Hello! World?');
      expect(sanitizeString('Test@123')).toBe('Test@123');
    });
  });

  describe('validateBook middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        body: {},
      };
      mockResponse = {};
      nextFunction = jest.fn();
    });

    it('should accept valid book data', () => {
      mockRequest.body = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: '9780123456789',
      };

      validateBook(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.body.title).toBe('Test Book');
    });

    it('should reject missing title', () => {
      mockRequest.body = {
        author: 'Test Author',
      };

      validateBook(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Title is required'),
          statusCode: 400,
        })
      );
    });

    it('should reject empty title', () => {
      mockRequest.body = {
        title: '   ',
        author: 'Test Author',
      };

      validateBook(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Title is required'),
        })
      );
    });

    it('should reject missing author', () => {
      mockRequest.body = {
        title: 'Test Book',
      };

      validateBook(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Author is required'),
          statusCode: 400,
        })
      );
    });

    it('should reject invalid ISBN format', () => {
      mockRequest.body = {
        title: 'Test Book',
        author: 'Test Author',
        isbn: 'invalid-isbn',
      };

      validateBook(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Invalid ISBN format'),
          statusCode: 400,
        })
      );
    });

    it('should accept book without ISBN', () => {
      mockRequest.body = {
        title: 'Test Book',
        author: 'Test Author',
      };

      validateBook(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should sanitize inputs', () => {
      mockRequest.body = {
        title: '  <script>Test</script>  ',
        author: '  Author<b>Name</b>  ',
      };

      validateBook(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.body.title).not.toContain('<');
      expect(mockRequest.body.title).not.toContain('>');
      expect(mockRequest.body.author).not.toContain('<');
    });
  });

  describe('validateMember middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        body: {},
      };
      mockResponse = {};
      nextFunction = jest.fn();
    });

    it('should accept valid member data', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
        phone: '1234567890',
      };

      validateMember(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
      expect(mockRequest.body.email).toBe('john@example.com');
    });

    it('should reject missing name', () => {
      mockRequest.body = {
        email: 'test@example.com',
      };

      validateMember(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Name is required'),
          statusCode: 400,
        })
      );
    });

    it('should reject invalid email', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'invalid-email',
      };

      validateMember(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Valid email is required'),
          statusCode: 400,
        })
      );
    });

    it('should accept member without phone', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'john@example.com',
      };

      validateMember(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should lowercase email', () => {
      mockRequest.body = {
        name: 'John Doe',
        email: 'John@Example.COM',
        phone: '1234567890',
      };

      validateMember(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.body.email).toBe('john@example.com');
    });

    it('should sanitize inputs', () => {
      mockRequest.body = {
        name: '  <script>John</script>  ',
        email: 'john@example.com',
      };

      validateMember(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.body.name).not.toContain('<');
    });
  });

  describe('validateUser middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        body: {},
        method: 'POST',
      };
      mockResponse = {};
      nextFunction = jest.fn();
    });

    it('should accept valid user data', () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
        role: 'member',
      };

      validateUser(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should reject username shorter than 3 characters', () => {
      mockRequest.body = {
        username: 'ab',
        password: 'password123',
      };

      validateUser(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('at least 3 characters'),
          statusCode: 400,
        })
      );
    });

    it('should reject password shorter than 6 characters for POST', () => {
      mockRequest.body = {
        username: 'testuser',
        password: '12345',
      };

      validateUser(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('at least 6 characters'),
          statusCode: 400,
        })
      );
    });

    it('should reject invalid role', () => {
      mockRequest.body = {
        username: 'testuser',
        password: 'password123',
        role: 'superadmin',
      };

      validateUser(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('must be either "admin" or "member"'),
          statusCode: 400,
        })
      );
    });

    it('should accept admin role', () => {
      mockRequest.body = {
        username: 'testadmin',
        password: 'password123',
        role: 'admin',
      };

      validateUser(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should accept member role', () => {
      mockRequest.body = {
        username: 'testmember',
        password: 'password123',
        role: 'member',
      };

      validateUser(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should sanitize username', () => {
      mockRequest.body = {
        username: '  <script>user</script>  ',
        password: 'password123',
      };

      validateUser(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.body.username).not.toContain('<');
    });
  });

  describe('validateCategory middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        body: {},
      };
      mockResponse = {};
      nextFunction = jest.fn();
    });

    it('should accept valid category name', () => {
      mockRequest.body = {
        name: 'Programming',
      };

      validateCategory(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should reject missing name', () => {
      mockRequest.body = {};

      validateCategory(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Category name is required'),
          statusCode: 400,
        })
      );
    });

    it('should reject empty name', () => {
      mockRequest.body = {
        name: '   ',
      };

      validateCategory(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Category name is required'),
        })
      );
    });

    it('should sanitize name', () => {
      mockRequest.body = {
        name: '  <script>Category</script>  ',
      };

      validateCategory(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(mockRequest.body.name).not.toContain('<');
    });
  });

  describe('validateLoan middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        body: {},
        path: '/api/loans/borrow',
      };
      mockResponse = {};
      nextFunction = jest.fn();
    });

    it('should accept valid loan data for borrow', () => {
      mockRequest.body = {
        book_id: 1,
        member_id: 1,
      };

      validateLoan(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should reject missing book_id', () => {
      mockRequest.body = {
        member_id: 1,
      };

      validateLoan(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('book_id is required'),
          statusCode: 400,
        })
      );
    });

    it('should reject negative book_id', () => {
      mockRequest.body = {
        book_id: -1,
        member_id: 1,
      };

      validateLoan(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('book_id is required'),
        })
      );
    });

    it('should reject missing member_id for borrow', () => {
      mockRequest.body = {
        book_id: 1,
      };

      validateLoan(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('member_id is required'),
          statusCode: 400,
        })
      );
    });
  });

  describe('validatePagination middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        query: {},
      };
      mockResponse = {};
      nextFunction = jest.fn();
    });

    it('should accept valid pagination params', () => {
      mockRequest.query = {
        page: '1',
        limit: '10',
      };

      validatePagination(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should reject negative page', () => {
      mockRequest.query = {
        page: '-1',
      };

      validatePagination(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Page must be a positive integer'),
          statusCode: 400,
        })
      );
    });

    it('should reject zero page', () => {
      mockRequest.query = {
        page: '0',
      };

      validatePagination(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Page must be a positive integer'),
        })
      );
    });

    it('should reject limit over 1000', () => {
      mockRequest.query = {
        limit: '1001',
      };

      validatePagination(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Limit must be between 1 and 1000'),
          statusCode: 400,
        })
      );
    });

    it('should reject zero limit', () => {
      mockRequest.query = {
        limit: '0',
      };

      validatePagination(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Limit must be between 1 and 1000'),
        })
      );
    });

    it('should accept request without pagination params', () => {
      mockRequest.query = {};

      validatePagination(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith();
    });

    it('should reject non-numeric page', () => {
      mockRequest.query = {
        page: 'abc',
      };

      validatePagination(mockRequest as AuthRequest, mockResponse as Response, nextFunction);

      expect(nextFunction).toHaveBeenCalledWith(
        expect.objectContaining({
          message: expect.stringContaining('Page must be a positive integer'),
        })
      );
    });
  });
});

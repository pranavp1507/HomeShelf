/**
 * Authentication Utilities Tests
 *
 * Comprehensive tests for authentication utility functions including:
 * - Password hashing and comparison
 * - JWT token generation and verification
 * - Authentication middleware
 */

import { Request, Response, NextFunction } from 'express';
import {
  hashPassword,
  comparePasswords,
  generateToken,
  verifyToken,
  authenticateToken,
  checkAdmin,
} from '../../src/utils/authUtils';
import { AuthRequest } from '../../src/types/express';

describe('Authentication Utilities', () => {
  describe('hashPassword', () => {
    it('should hash password with bcrypt', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(50); // bcrypt hashes are long
      expect(hash).toMatch(/^\$2[aby]\$/); // bcrypt hash format
    });

    it('should generate different hashes for same password', async () => {
      const password = 'TestPassword123!';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2); // Due to random salt
    });

    it('should hash empty string', async () => {
      const hash = await hashPassword('');
      expect(hash).toBeDefined();
      expect(hash.length).toBeGreaterThan(0);
    });

    it('should hash very long passwords', async () => {
      const longPassword = 'a'.repeat(1000);
      const hash = await hashPassword(longPassword);
      expect(hash).toBeDefined();
    });

    it('should hash passwords with special characters', async () => {
      const password = '!@#$%^&*()_+-=[]{}|;:,.<>?/~`';
      const hash = await hashPassword(password);
      expect(hash).toBeDefined();
    });
  });

  describe('comparePasswords', () => {
    it('should return true for matching passwords', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await comparePasswords(password, hash);

      expect(isValid).toBe(true);
    });

    it('should return false for non-matching passwords', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await comparePasswords('WrongPassword', hash);

      expect(isValid).toBe(false);
    });

    it('should be case sensitive', async () => {
      const password = 'TestPassword';
      const hash = await hashPassword(password);
      const isValid = await comparePasswords('testpassword', hash);

      expect(isValid).toBe(false);
    });

    it('should handle empty password comparison', async () => {
      const password = 'TestPassword123!';
      const hash = await hashPassword(password);
      const isValid = await comparePasswords('', hash);

      expect(isValid).toBe(false);
    });

    it('should handle special characters correctly', async () => {
      const password = '!@#$%^&*()_+-=';
      const hash = await hashPassword(password);
      const isValid = await comparePasswords(password, hash);

      expect(isValid).toBe(true);
    });
  });

  describe('generateToken', () => {
    it('should generate valid JWT token', () => {
      const payload = { userId: 1, username: 'testuser', role: 'admin' as const };
      const token = generateToken(payload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.').length).toBe(3); // JWT has 3 parts: header.payload.signature
    });

    it('should include user id in token', () => {
      const payload = { userId: 42, username: 'testuser', role: 'admin' as const };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(42);
    });

    it('should include username in token', () => {
      const payload = { userId: 1, username: 'johndoe', role: 'admin' as const };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.username).toBe('johndoe');
    });

    it('should include role in token', () => {
      const payload = { userId: 1, username: 'testuser', role: 'member' as const };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.role).toBe('member');
    });

    it('should set expiration time', () => {
      const payload = { userId: 1, username: 'testuser', role: 'admin' as const };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.exp).toBeDefined();
      expect(decoded?.exp).toBeGreaterThan(Math.floor(Date.now() / 1000));
    });

    it('should handle admin role', () => {
      const payload = { userId: 1, username: 'admin', role: 'admin' as const };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded?.role).toBe('admin');
    });

    it('should handle member role', () => {
      const payload = { userId: 2, username: 'member', role: 'member' as const };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded?.role).toBe('member');
    });
  });

  describe('verifyToken', () => {
    it('should verify valid token', () => {
      const payload = { userId: 1, username: 'testuser', role: 'admin' as const };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(payload.userId);
      expect(decoded?.username).toBe(payload.username);
      expect(decoded?.role).toBe(payload.role);
    });

    it('should reject invalid token format', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('should reject malformed token', () => {
      const malformedToken = 'notajwttoken';
      const decoded = verifyToken(malformedToken);

      expect(decoded).toBeNull();
    });

    it('should reject empty token', () => {
      const decoded = verifyToken('');

      expect(decoded).toBeNull();
    });

    it('should reject token with invalid signature', () => {
      const payload = { userId: 1, username: 'testuser', role: 'admin' as const };
      const token = generateToken(payload);
      // Tamper with the token
      const tamperedToken = token.slice(0, -5) + 'xxxxx';
      const decoded = verifyToken(tamperedToken);

      expect(decoded).toBeNull();
    });

    it('should include iat (issued at) claim', () => {
      const payload = { userId: 1, username: 'testuser', role: 'admin' as const };
      const token = generateToken(payload);
      const decoded = verifyToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.iat).toBeDefined();
      expect(typeof decoded?.iat).toBe('number');
    });
  });

  describe('authenticateToken middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {
        headers: {},
      };
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn();
    });

    it('should attach user to request for valid token', () => {
      const payload = { userId: 1, username: 'testuser', role: 'admin' as const };
      const token = generateToken(payload);

      mockRequest.headers = {
        authorization: `Bearer ${token}`,
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockRequest.user).toBeDefined();
      expect(mockRequest.user?.userId).toBe(payload.userId);
      expect(mockRequest.user?.username).toBe(payload.username);
      expect(mockRequest.user?.role).toBe(payload.role);
      expect(nextFunction).toHaveBeenCalled();
    });

    it('should return 401 for missing authorization header', () => {
      mockRequest.headers = {};

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication token required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 401 for malformed authorization header', () => {
      mockRequest.headers = {
        authorization: 'InvalidFormat',
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Authentication token required',
      });
    });

    it('should return 403 for invalid token', () => {
      mockRequest.headers = {
        authorization: 'Bearer invalid.token.here',
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Invalid or expired token',
      });
    });

    it('should handle authorization header without Bearer prefix', () => {
      const payload = { userId: 1, username: 'testuser', role: 'admin' as const };
      const token = generateToken(payload);

      mockRequest.headers = {
        authorization: token, // Missing "Bearer " prefix
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(401);
    });

    it('should handle lowercase "bearer" prefix', () => {
      const payload = { userId: 1, username: 'testuser', role: 'admin' as const };
      const token = generateToken(payload);

      mockRequest.headers = {
        authorization: `bearer ${token}`,
      };

      authenticateToken(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      // Should still work or fail gracefully depending on implementation
      expect(nextFunction).toHaveBeenCalled();
    });
  });

  describe('checkAdmin middleware', () => {
    let mockRequest: Partial<AuthRequest>;
    let mockResponse: Partial<Response>;
    let nextFunction: NextFunction;

    beforeEach(() => {
      mockRequest = {};
      mockResponse = {
        status: jest.fn().mockReturnThis(),
        json: jest.fn().mockReturnThis(),
      };
      nextFunction = jest.fn();
    });

    it('should allow admin user to proceed', () => {
      mockRequest.user = {
        userId: 1,
        username: 'admin',
        role: 'admin',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      checkAdmin(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(nextFunction).toHaveBeenCalled();
      expect(mockResponse.status).not.toHaveBeenCalled();
    });

    it('should return 403 for member user', () => {
      mockRequest.user = {
        userId: 2,
        username: 'member',
        role: 'member',
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 3600,
      };

      checkAdmin(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(mockResponse.json).toHaveBeenCalledWith({
        error: 'Access denied: Admin role required',
      });
      expect(nextFunction).not.toHaveBeenCalled();
    });

    it('should return 403 when user is not attached to request', () => {
      mockRequest.user = undefined;

      checkAdmin(
        mockRequest as AuthRequest,
        mockResponse as Response,
        nextFunction
      );

      expect(mockResponse.status).toHaveBeenCalledWith(403);
      expect(nextFunction).not.toHaveBeenCalled();
    });
  });
});

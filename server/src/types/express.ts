/**
 * Express-specific types and extensions
 */

import { Request } from 'express';
import { JwtPayload } from './user';

/**
 * Extended Express Request with authenticated user information
 */
export interface AuthRequest extends Request {
  user?: JwtPayload;
}

/**
 * Generic API response structure
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

/**
 * Paginated API response structure
 */
export interface PaginatedResponse<T = any> {
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

/**
 * Dashboard statistics response
 */
export interface DashboardStats {
  totalBooks: number;
  availableBooks: number;
  totalMembers: number;
  activeLoans: number;
  overdueLoans: number;
  recentLoans?: Array<{
    id: number;
    book_title: string;
    member_name: string;
    borrow_date: Date;
    due_date: Date;
    is_overdue: boolean;
  }>;
}

/**
 * System information response
 */
export interface SystemInfo {
  version: string;
  nodeVersion: string;
  environment: string;
  database: {
    connected: boolean;
    host?: string;
    database?: string;
  };
  features: {
    emailNotifications: boolean;
    overdueChecks: boolean;
    googleBooksApi: boolean;
  };
  branding: {
    libraryName: string;
    logoUrl?: string;
  };
}

/**
 * Error response structure
 */
export interface ErrorResponse {
  success: false;
  error: string;
  message?: string;
  statusCode?: number;
}

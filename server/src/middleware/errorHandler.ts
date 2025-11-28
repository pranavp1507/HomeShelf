/**
 * Centralized error handling middleware
 * Catches all errors and returns consistent error responses
 */

import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from '../types/express';
import config from '../config';

/**
 * Custom application error class with status code
 */
export class AppError extends Error {
  public readonly statusCode: number;
  public readonly isOperational: boolean;

  constructor(message: string, statusCode: number = 500) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    Error.captureStackTrace(this, this.constructor);
  }
}

/**
 * Async error wrapper to avoid try-catch blocks in every route
 */
export const asyncHandler = <T = any>(
  fn: (req: AuthRequest, res: Response, next: NextFunction) => Promise<T>
) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};

/**
 * PostgreSQL error interface
 */
interface PostgresError extends Error {
  code?: string;
  detail?: string;
  constraint?: string;
}

/**
 * Global error handler middleware
 */
export const errorHandler = (
  err: Error | AppError | PostgresError,
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  let error: AppError;

  // Log to console for dev
  console.error('Error:', err);

  // If it's already an AppError, use it
  if (err instanceof AppError) {
    error = err;
  } else {
    // Create a new AppError from the generic error
    error = new AppError(err.message || 'Internal Server Error', 500);
  }

  // PostgreSQL unique violation
  if ('code' in err && err.code === '23505') {
    error = new AppError('Duplicate entry: This record already exists', 409);
  }

  // PostgreSQL foreign key violation
  if ('code' in err && err.code === '23503') {
    error = new AppError('Cannot complete operation: Referenced record does not exist', 400);
  }

  // PostgreSQL not-null violation
  if ('code' in err && err.code === '23502') {
    error = new AppError('Required field is missing', 400);
  }

  // Mongoose/MongoDB-like CastError (kept for compatibility if needed)
  if (err.name === 'CastError') {
    error = new AppError('Resource not found', 404);
  }

  // Send error response
  res.status(error.statusCode).json({
    success: false,
    error: error.message,
    ...(config.nodeEnv === 'development' && { stack: err.stack })
  });
};

/**
 * 404 handler for undefined routes
 */
export const notFound = (req: Request, res: Response, next: NextFunction): void => {
  const error = new AppError(`Not Found - ${req.originalUrl}`, 404);
  next(error);
};

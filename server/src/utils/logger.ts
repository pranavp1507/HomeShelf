/**
 * Logger Utility with Request ID Support
 *
 * Provides structured logging with request ID correlation for distributed tracing.
 *
 * Usage:
 *   import { logger } from '../utils/logger';
 *
 *   // In routes with request ID
 *   logger.info(req.id, 'User logged in', { userId: 123 });
 *   logger.error(req.id, 'Failed to save data', err);
 *
 *   // Without request ID
 *   logger.info('System startup', { port: 3001 });
 */

import config from '../config';

/**
 * Log levels
 */
export enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

/**
 * Log entry structure
 */
interface LogEntry {
  timestamp: string;
  level: LogLevel;
  requestId?: string;
  message: string;
  data?: any;
  error?: {
    name: string;
    message: string;
    stack?: string;
  };
}

/**
 * Format log entry for console output
 */
const formatLogEntry = (entry: LogEntry): string => {
  const parts: string[] = [];

  // Timestamp
  parts.push(`[${entry.timestamp}]`);

  // Level with color
  const level = colorizeLevel(entry.level);
  parts.push(`[${level}]`);

  // Request ID if present
  if (entry.requestId) {
    parts.push(`[${entry.requestId}]`);
  }

  // Message
  parts.push(entry.message);

  // Additional data
  if (entry.data) {
    parts.push(JSON.stringify(entry.data));
  }

  // Error details
  if (entry.error) {
    parts.push(`\n  Error: ${entry.error.name}: ${entry.error.message}`);
    if (entry.error.stack && config.nodeEnv === 'development') {
      parts.push(`\n  Stack: ${entry.error.stack}`);
    }
  }

  return parts.join(' ');
};

/**
 * Add color to log level for better readability
 */
const colorizeLevel = (level: LogLevel): string => {
  const colors = {
    DEBUG: '\x1b[36m', // Cyan
    INFO: '\x1b[32m',  // Green
    WARN: '\x1b[33m',  // Yellow
    ERROR: '\x1b[31m', // Red
  };
  const reset = '\x1b[0m';

  return `${colors[level]}${level}${reset}`;
};

/**
 * Create log entry
 */
const createLogEntry = (
  level: LogLevel,
  requestIdOrMessage: string,
  messageOrData?: string | any,
  dataOrError?: any
): LogEntry => {
  const timestamp = new Date().toISOString();

  // Determine if first param is request ID or message
  const hasRequestId = typeof requestIdOrMessage === 'string' &&
                       typeof messageOrData === 'string';

  if (hasRequestId) {
    // logger.info(requestId, message, data)
    return {
      timestamp,
      level,
      requestId: requestIdOrMessage,
      message: messageOrData as string,
      data: dataOrError,
    };
  } else {
    // logger.info(message, data)
    return {
      timestamp,
      level,
      message: requestIdOrMessage,
      data: messageOrData,
    };
  }
};

/**
 * Logger class
 */
class Logger {
  /**
   * Log debug message
   */
  debug(requestIdOrMessage: string, messageOrData?: string | any, data?: any): void {
    if (config.nodeEnv === 'production') {
      return; // Skip debug logs in production
    }

    const entry = createLogEntry(LogLevel.DEBUG, requestIdOrMessage, messageOrData, data);
    console.log(formatLogEntry(entry));
  }

  /**
   * Log info message
   */
  info(requestIdOrMessage: string, messageOrData?: string | any, data?: any): void {
    const entry = createLogEntry(LogLevel.INFO, requestIdOrMessage, messageOrData, data);
    console.log(formatLogEntry(entry));
  }

  /**
   * Log warning message
   */
  warn(requestIdOrMessage: string, messageOrData?: string | any, data?: any): void {
    const entry = createLogEntry(LogLevel.WARN, requestIdOrMessage, messageOrData, data);
    console.warn(formatLogEntry(entry));
  }

  /**
   * Log error message
   */
  error(requestIdOrMessage: string, messageOrData?: string | any, errorOrData?: Error | any): void {
    let entry: LogEntry;

    const hasRequestId = typeof requestIdOrMessage === 'string' &&
                         typeof messageOrData === 'string';

    if (hasRequestId) {
      // logger.error(requestId, message, error)
      entry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.ERROR,
        requestId: requestIdOrMessage,
        message: messageOrData as string,
      };

      if (errorOrData instanceof Error) {
        entry.error = {
          name: errorOrData.name,
          message: errorOrData.message,
          stack: errorOrData.stack,
        };
      } else if (errorOrData) {
        entry.data = errorOrData;
      }
    } else {
      // logger.error(message, error)
      entry = {
        timestamp: new Date().toISOString(),
        level: LogLevel.ERROR,
        message: requestIdOrMessage,
      };

      if (messageOrData instanceof Error) {
        entry.error = {
          name: messageOrData.name,
          message: messageOrData.message,
          stack: messageOrData.stack,
        };
      } else if (messageOrData) {
        entry.data = messageOrData;
      }
    }

    console.error(formatLogEntry(entry));
  }

  /**
   * Log HTTP request
   */
  request(requestId: string, method: string, path: string, statusCode?: number, duration?: number): void {
    const data: any = { method, path };

    if (statusCode) {
      data.statusCode = statusCode;
    }

    if (duration) {
      data.duration = `${duration}ms`;
    }

    const entry = createLogEntry(
      statusCode && statusCode >= 400 ? LogLevel.WARN : LogLevel.INFO,
      requestId,
      'HTTP Request',
      data
    );

    console.log(formatLogEntry(entry));
  }
}

/**
 * Export singleton logger instance
 */
export const logger = new Logger();

/**
 * Example usage:
 *
 * // With request ID (in route handlers)
 * logger.info(req.id, 'User logged in successfully', { userId: user.id });
 * logger.warn(req.id, 'Rate limit approaching', { attempts: 4 });
 * logger.error(req.id, 'Failed to create loan', error);
 *
 * // Without request ID (in startup, cron jobs, etc.)
 * logger.info('Server started', { port: 3001, env: 'production' });
 * logger.warn('Database connection slow', { latency: 500 });
 * logger.error('Cron job failed', error);
 *
 * // HTTP request logging
 * logger.request(req.id, 'GET', '/api/books', 200, 45);
 */

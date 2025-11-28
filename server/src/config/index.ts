/**
 * Configuration module - loads and validates environment variables
 */

import dotenv from 'dotenv';

dotenv.config();

export interface Config {
  // Server configuration
  nodeEnv: string;
  port: number;

  // Database configuration
  databaseUrl: string;

  // Authentication
  jwtSecret: string;

  // CORS
  clientUrl: string;

  // External APIs
  googleBooksApiKey?: string;

  // Email configuration
  emailNotificationsEnabled: boolean;
  smtpHost?: string;
  smtpPort?: number;
  smtpSecure?: boolean;
  smtpUser?: string;
  smtpPassword?: string;
  smtpFrom?: string;

  // Features
  overdueChecksEnabled: boolean;
  overdueCheckInterval: number;

  // Branding
  libraryName: string;
  libraryLogo?: string;
}

const config: Config = {
  // Server configuration
  nodeEnv: process.env.NODE_ENV || 'development',
  port: parseInt(process.env.PORT || '3001', 10),

  // Database configuration
  databaseUrl: process.env.DATABASE_URL || 'postgres://user:password@localhost:5432/library',

  // Authentication
  jwtSecret: process.env.JWT_SECRET || 'default-jwt-secret-change-in-production',

  // CORS
  clientUrl: process.env.CLIENT_URL || 'http://localhost:3000',

  // External APIs
  googleBooksApiKey: process.env.GOOGLE_BOOKS_API_KEY,

  // Email configuration
  emailNotificationsEnabled: process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true',
  smtpHost: process.env.SMTP_HOST,
  smtpPort: process.env.SMTP_PORT ? parseInt(process.env.SMTP_PORT, 10) : undefined,
  smtpSecure: process.env.SMTP_SECURE === 'true',
  smtpUser: process.env.SMTP_USER,
  smtpPassword: process.env.SMTP_PASSWORD,
  smtpFrom: process.env.SMTP_FROM,

  // Features
  overdueChecksEnabled: process.env.ENABLE_OVERDUE_CHECKS !== 'false',
  overdueCheckInterval: parseInt(process.env.OVERDUE_CHECK_INTERVAL || '60', 10),

  // Branding
  libraryName: process.env.LIBRARY_NAME || 'Library Management System',
  libraryLogo: process.env.LIBRARY_LOGO
};

// Validate required configuration
if (!config.jwtSecret || config.jwtSecret === 'default-jwt-secret-change-in-production') {
  console.warn('WARNING: JWT_SECRET is not set or using default value. Please set a secure JWT_SECRET in production.');
}

if (!config.databaseUrl) {
  throw new Error('DATABASE_URL is required but not set in environment variables');
}

export default config;

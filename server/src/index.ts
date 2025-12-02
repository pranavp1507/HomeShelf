/**
 * Main server entry point
 * Refactored with modular architecture for better maintainability
 */

import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import addRequestId from 'express-request-id';
import path from 'path';
import fs from 'fs';
import { schedule } from 'node-cron';
import { query, pool } from './db';
import config from './config';
import { logger } from './utils/logger';

// Import middleware
import { errorHandler, notFound } from './middleware/errorHandler';

// Import routes
import authRoutes from './routes/auth';
import booksRoutes from './routes/books';
import membersRoutes from './routes/members';
import loansRoutes from './routes/loans';
import categoriesRoutes from './routes/categories';
import usersRoutes from './routes/users';
import dashboardRoutes from './routes/dashboard';
import exportRoutes from './routes/export';
import systemRoutes from './routes/system';

const app = express();
const port = config.port;

// ========================================
// CORS Configuration
// ========================================
const corsOptions: cors.CorsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://local.test',
      config.clientUrl
    ].filter(Boolean); // Remove empty strings

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      if (config.nodeEnv === 'production') {
        callback(new Error('Not allowed by CORS'));
      } else {
        callback(null, true); // Allow in development for testing
      }
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// ========================================
// Security Middleware
// ========================================
// Helmet - Security headers
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      styleSrc: ["'self'", "'unsafe-inline'"],
      scriptSrc: ["'self'"],
      imgSrc: ["'self'", "data:", "https:"],
    },
  },
  crossOriginEmbedderPolicy: false, // Allow uploads
}));

// Rate limiting - Prevent brute force attacks
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // 5 requests per window
  message: 'Too many attempts, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // 100 requests per window
  message: 'Too many requests, please try again later',
  standardHeaders: true,
  legacyHeaders: false,
});

// ========================================
// Middleware Setup
// ========================================
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use(cors(corsOptions));

// Request ID tracking for distributed tracing
app.use(addRequestId());

// Add request ID to response headers
app.use((req: any, res: Response, next: NextFunction) => {
  res.setHeader('X-Request-ID', req.id);
  next();
});

// Serve static files from uploads directory
const uploadsDir = path.join(__dirname, '..', 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log(`Creating uploads directory: ${uploadsDir}`);
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ========================================
// Routes
// ========================================
app.get('/', (req: Request, res: Response) => {
  res.json({
    message: 'Library Management System API',
    version: '1.0.0',
    endpoints: {
      auth: '/api/auth',
      books: '/api/books',
      members: '/api/members',
      loans: '/api/loans',
      categories: '/api/categories',
      users: '/api/users',
      dashboard: '/api/dashboard',
      export: '/api/export',
      system: '/api/system'
    }
  });
});

// API Routes
// Apply strict rate limiting to authentication endpoints
app.use('/api/auth', authLimiter, authRoutes);

// Apply general rate limiting to other API endpoints
app.use('/api/books', apiLimiter, booksRoutes);
app.use('/api/members', apiLimiter, membersRoutes);
app.use('/api/loans', apiLimiter, loansRoutes);
app.use('/api/categories', apiLimiter, categoriesRoutes);
app.use('/api/users', apiLimiter, usersRoutes);
app.use('/api/dashboard', apiLimiter, dashboardRoutes);
app.use('/api/export', apiLimiter, exportRoutes);
app.use('/api/system', apiLimiter, systemRoutes);

// ========================================
// Error Handling
// ========================================
// 404 handler for undefined routes
app.use(notFound);

// Global error handler
app.use(errorHandler);

// ========================================
// Utility Functions
// ========================================

interface CountResult {
  count: string;
}

interface OverdueLoanResult {
  loan_id: number;
  book_title: string;
  member_name: string;
  due_date: Date;
}

// Function to check and ensure at least one admin user exists
const ensureAdminUserExists = async (): Promise<void> => {
  try {
    const { rows } = await query<CountResult>(
      "SELECT COUNT(*) FROM users WHERE role = 'admin'"
    );
    const adminCount = parseInt(rows[0].count, 10);

    if (adminCount === 0) {
      console.log('No admin user found. Initial setup via frontend is required.');
    } else {
      console.log(`Found ${adminCount} admin user(s).`);
    }
  } catch (err: any) {
    console.error('Error checking for admin user on startup:', err.stack);
  }
};

// Function to check for overdue loans
const checkOverdueLoans = async (): Promise<void> => {
  try {
    const { rows } = await query<OverdueLoanResult>(
      `SELECT
        l.id AS loan_id,
        b.title AS book_title,
        m.name AS member_name,
        l.due_date
      FROM loans l
      JOIN books b ON l.book_id = b.id
      JOIN members m ON l.member_id = m.id
      WHERE l.return_date IS NULL AND l.due_date < CURRENT_TIMESTAMP`
    );

    if (rows.length > 0) {
      console.warn(`[OVERDUE REMINDER] Found ${rows.length} overdue loans:`);
      rows.forEach(loan => {
        console.warn(
          `  - Loan ID: ${loan.loan_id}, Book: "${loan.book_title}", Member: ${loan.member_name}, Due Date: ${new Date(loan.due_date).toLocaleDateString()}`
        );
      });
      // Here you would typically implement a notification mechanism
      // (e.g., email, push notification, in-app alert)
    } else {
      console.log('[OVERDUE REMINDER] No overdue loans found.');
    }
  } catch (err: any) {
    console.error('[OVERDUE REMINDER ERROR]', err.stack);
  }
};

// ========================================
// Security Validation
// ========================================
// Ensure JWT_SECRET is set before starting server
if (!config.jwtSecret) {
  console.error('\n❌ FATAL ERROR: JWT_SECRET environment variable is not set!');
  console.error('This is required for authentication to work securely.');
  console.error('Please set JWT_SECRET in your .env file.\n');
  process.exit(1);
}

// Validate JWT_SECRET length (minimum 32 characters recommended)
if (config.jwtSecret.length < 32) {
  console.warn('\n⚠️  WARNING: JWT_SECRET is too short!');
  console.warn('For security, use at least 32 characters.');
  console.warn('Generate a strong secret: node -e "console.log(require(\'crypto\').randomBytes(32).toString(\'hex\'))"\n');
}

// ========================================
// Server Startup
// ========================================
app.listen(port, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Library Management System API`);
  console.log(`========================================`);
  console.log(`📡 Server: http://localhost:${port}`);
  console.log(`🌍 Environment: ${config.nodeEnv}`);
  console.log(`📁 Uploads: ${uploadsDir}`);
  console.log(`✅ JWT Secret: Configured`);
  console.log(`========================================\n`);

  // Check admin user existence
  ensureAdminUserExists();

  // Schedule cron job to check for overdue loans if enabled
  if (config.overdueChecksEnabled) {
    const cronPattern = `*/${config.overdueCheckInterval} * * * *`;
    schedule(cronPattern, () => {
      console.log('[CRON JOB] Checking for overdue loans...');
      checkOverdueLoans();
    });
    console.log(`⏰ Overdue checks scheduled (every ${config.overdueCheckInterval} minutes)\n`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

export default app; // Export for testing

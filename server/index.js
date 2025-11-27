/**
 * Main server entry point
 * Refactored with modular architecture for better maintainability
 */

const express = require('express');
const cors = require('cors');
const path = require('path');
const fs = require('fs');
require('dotenv').config(); // Load environment variables

const { schedule } = require('node-cron');
const db = require('./db');

// Import middleware
const { errorHandler, notFound } = require('./middleware/errorHandler');

// Import routes
const authRoutes = require('./routes/auth');
const booksRoutes = require('./routes/books');
const membersRoutes = require('./routes/members');
const loansRoutes = require('./routes/loans');
const categoriesRoutes = require('./routes/categories');
const usersRoutes = require('./routes/users');
const dashboardRoutes = require('./routes/dashboard');
const exportRoutes = require('./routes/export');
const systemRoutes = require('./routes/system');

const app = express();
const port = process.env.PORT || 3001;

// ========================================
// CORS Configuration
// ========================================
const corsOptions = {
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);

    const allowedOrigins = [
      'http://localhost:3000',
      'http://localhost:5173',
      'https://local.test',
      process.env.CLIENT_URL || ''
    ].filter(Boolean); // Remove empty strings

    if (allowedOrigins.indexOf(origin) !== -1) {
      callback(null, true);
    } else {
      console.warn(`CORS blocked origin: ${origin}`);
      callback(null, true); // Allow anyway for development
      // In production, use: callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true,
  optionsSuccessStatus: 200
};

// ========================================
// Middleware Setup
// ========================================
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors(corsOptions));

// Serve static files from uploads directory
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  console.log(`Creating uploads directory: ${uploadsDir}`);
  fs.mkdirSync(uploadsDir, { recursive: true });
}
app.use('/uploads', express.static(uploadsDir));

// ========================================
// Routes
// ========================================
app.get('/', (req, res) => {
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
      export: '/api/export'
    }
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
app.use('/api/members', membersRoutes);
app.use('/api/loans', loansRoutes);
app.use('/api/categories', categoriesRoutes);
app.use('/api/users', usersRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/system', systemRoutes);

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

// Function to check and ensure at least one admin user exists
const ensureAdminUserExists = async () => {
  try {
    const { rows } = await db.query("SELECT COUNT(*) FROM users WHERE role = 'admin'");
    const adminCount = parseInt(rows[0].count, 10);

    if (adminCount === 0) {
      console.log('No admin user found. Initial setup via frontend is required.');
    } else {
      console.log(`Found ${adminCount} admin user(s).`);
    }
  } catch (err) {
    console.error('Error checking for admin user on startup:', err.stack);
  }
};

// Function to check for overdue loans
const checkOverdueLoans = async () => {
  try {
    const { rows } = await db.query(
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
  } catch (err) {
    console.error('[OVERDUE REMINDER ERROR]', err.stack);
  }
};

// ========================================
// Server Startup
// ========================================
app.listen(port, () => {
  console.log(`\n========================================`);
  console.log(`🚀 Library Management System API`);
  console.log(`========================================`);
  console.log(`📡 Server: http://localhost:${port}`);
  console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`📁 Uploads: ${uploadsDir}`);
  console.log(`========================================\n`);

  // Check admin user existence
  ensureAdminUserExists();

  // Schedule cron job to check for overdue loans (every minute)
  schedule('* * * * *', () => {
    console.log('[CRON JOB] Checking for overdue loans...');
    checkOverdueLoans();
  });
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  db.pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  db.pool.end(() => {
    console.log('Database pool closed');
    process.exit(0);
  });
});

module.exports = app; // Export for testing

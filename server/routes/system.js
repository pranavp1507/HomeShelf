/**
 * System information routes
 * Provides system status and configuration info
 */

const express = require('express');
const router = express.Router();
const db = require('../db');
const authUtils = require('../authUtils');
const { asyncHandler } = require('../middleware/errorHandler');

// Get system information (admin only)
router.get('/info', authUtils.authenticateToken, authUtils.checkAdmin, asyncHandler(async (req, res) => {
  // Check database connection
  let databaseConnected = false;
  try {
    await db.query('SELECT 1');
    databaseConnected = true;
  } catch (err) {
    console.error('Database connection check failed:', err);
  }

  // Check email configuration
  const emailEnabled = process.env.ENABLE_EMAIL_NOTIFICATIONS === 'true' &&
                       !!process.env.SMTP_HOST &&
                       !!process.env.SMTP_USER;

  // Check overdue checks configuration
  const overdueChecksEnabled = process.env.ENABLE_OVERDUE_CHECKS !== 'false';

  res.json({
    version: '1.0.0',
    nodeEnv: process.env.NODE_ENV || 'development',
    databaseConnected,
    emailEnabled,
    overdueChecksEnabled,
    emailConfiguration: emailEnabled ? {
      host: process.env.SMTP_HOST,
      port: process.env.SMTP_PORT,
      from: process.env.SMTP_FROM,
      secure: process.env.SMTP_SECURE === 'true',
    } : null,
  });
}));

module.exports = router;

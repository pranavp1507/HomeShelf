/**
 * System information routes
 * Provides system status and configuration info
 */

import express, { Response } from 'express';
import { query } from '../db';
import * as authUtils from '../utils/authUtils';
import { asyncHandler } from '../middleware/errorHandler';
import { AuthRequest } from '../types/express';
import config from '../config';

const router = express.Router();

// Get system information (admin only)
router.get('/info',
  authUtils.authenticateToken,
  authUtils.checkAdmin,
  asyncHandler(async (req: AuthRequest, res: Response) => {
    // Check database connection
    let databaseConnected = false;
    try {
      await query('SELECT 1');
      databaseConnected = true;
    } catch (err) {
      console.error('Database connection check failed:', err);
    }

    // Check email configuration
    const emailEnabled = config.emailNotificationsEnabled &&
                        !!config.smtpHost &&
                        !!config.smtpUser;

    res.json({
      version: '1.0.0',
      nodeEnv: config.nodeEnv,
      databaseConnected,
      emailEnabled,
      overdueChecksEnabled: config.overdueChecksEnabled,
      emailConfiguration: emailEnabled ? {
        host: config.smtpHost,
        port: config.smtpPort,
        from: config.smtpFrom,
        secure: config.smtpSecure,
      } : null,
    });
  })
);

export default router;

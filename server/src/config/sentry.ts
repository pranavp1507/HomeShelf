/**
 * Sentry Error Monitoring Configuration
 *
 * Integrates Sentry for error tracking, performance monitoring, and profiling.
 *
 * Setup:
 *   1. Install dependencies:
 *      pnpm add @sentry/node @sentry/profiling-node
 *
 *   2. Set environment variable:
 *      SENTRY_DSN=https://your-key@sentry.io/project-id
 *
 *   3. Initialize in server/src/index.ts:
 *      import { initSentry } from './config/sentry';
 *      const Sentry = initSentry(app);
 *
 * Features:
 *   - Automatic error reporting
 *   - Performance tracing (10% sample rate)
 *   - Profiling (10% sample rate)
 *   - Request context tracking
 *   - User context tracking
 */

import config from './index';

// Types (will be available after installing @sentry/node)
type Express = any;
type SentryInstance = any;

/**
 * Initialize Sentry for error monitoring and performance tracking
 *
 * @param app - Express application instance
 * @returns Sentry instance for use in error handlers
 */
export const initSentry = (app: Express): SentryInstance | null => {
  // Only initialize in production or when explicitly enabled
  if (config.nodeEnv !== 'production' && !config.sentryDsn) {
    console.log('⚠️  Sentry disabled (not production or no DSN configured)');
    return null;
  }

  if (!config.sentryDsn) {
    console.log('⚠️  Sentry disabled (SENTRY_DSN not set)');
    return null;
  }

  try {
    // Dynamic import to avoid errors if @sentry/node is not installed
    const Sentry = require('@sentry/node');
    const { nodeProfilingIntegration } = require('@sentry/profiling-node');

    Sentry.init({
      dsn: config.sentryDsn,
      environment: config.nodeEnv,

      // Performance Monitoring
      integrations: [
        // Profiling integration
        nodeProfilingIntegration(),

        // HTTP integration for tracing
        new Sentry.Integrations.Http({
          tracing: true,
        }),

        // Express integration for automatic instrumentation
        new Sentry.Integrations.Express({
          app,
        }),
      ],

      // Tracing
      tracesSampleRate: 0.1, // Capture 10% of transactions for performance monitoring

      // Profiling
      profilesSampleRate: 0.1, // Profile 10% of transactions

      // Release tracking (optional - set via CI/CD)
      release: process.env.SENTRY_RELEASE || undefined,

      // Filter sensitive data
      beforeSend(event: any, hint: any) {
        // Remove sensitive headers
        if (event.request?.headers) {
          delete event.request.headers['authorization'];
          delete event.request.headers['cookie'];
        }

        // Remove sensitive POST data
        if (event.request?.data) {
          const data = event.request.data;
          if (typeof data === 'object') {
            delete data.password;
            delete data.token;
            delete data.reset_token;
          }
        }

        return event;
      },
    });

    console.log('✅ Sentry initialized successfully');
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Tracing: 10% sample rate`);
    console.log(`   Profiling: 10% sample rate`);

    return Sentry;
  } catch (error) {
    console.error('❌ Failed to initialize Sentry:', error);
    console.error('   Install Sentry packages: pnpm add @sentry/node @sentry/profiling-node');
    return null;
  }
};

/**
 * Capture exception manually
 *
 * Usage:
 *   import { captureException } from './config/sentry';
 *   captureException(error, { extra: { userId: 123 } });
 */
export const captureException = (error: Error, context?: any): void => {
  try {
    const Sentry = require('@sentry/node');
    Sentry.captureException(error, context);
  } catch (err) {
    console.error('Sentry not available:', err);
  }
};

/**
 * Capture message manually
 *
 * Usage:
 *   import { captureMessage } from './config/sentry';
 *   captureMessage('Something unexpected happened', 'warning');
 */
export const captureMessage = (message: string, level: 'info' | 'warning' | 'error' = 'info'): void => {
  try {
    const Sentry = require('@sentry/node');
    Sentry.captureMessage(message, level);
  } catch (err) {
    console.error('Sentry not available:', err);
  }
};

/**
 * Set user context for Sentry
 *
 * Usage:
 *   import { setUser } from './config/sentry';
 *   setUser({ id: 123, username: 'john', email: 'john@example.com' });
 */
export const setUser = (user: { id?: number; username?: string; email?: string }): void => {
  try {
    const Sentry = require('@sentry/node');
    Sentry.setUser(user);
  } catch (err) {
    console.error('Sentry not available:', err);
  }
};

/**
 * Clear user context
 */
export const clearUser = (): void => {
  try {
    const Sentry = require('@sentry/node');
    Sentry.setUser(null);
  } catch (err) {
    console.error('Sentry not available:', err);
  }
};

/**
 * Add breadcrumb for debugging context
 *
 * Usage:
 *   import { addBreadcrumb } from './config/sentry';
 *   addBreadcrumb({ message: 'User clicked button', category: 'ui' });
 */
export const addBreadcrumb = (breadcrumb: { message: string; category?: string; level?: string; data?: any }): void => {
  try {
    const Sentry = require('@sentry/node');
    Sentry.addBreadcrumb(breadcrumb);
  } catch (err) {
    console.error('Sentry not available:', err);
  }
};

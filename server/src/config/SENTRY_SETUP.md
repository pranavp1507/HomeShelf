# Sentry Error Monitoring Setup Guide

This guide walks you through setting up Sentry for error monitoring and performance tracking.

---

## What is Sentry?

Sentry provides:
- **Error Tracking**: Automatic capture of all errors with stack traces
- **Performance Monitoring**: Track slow API endpoints and database queries
- **Profiling**: Identify performance bottlenecks in production
- **User Context**: See which users are affected by errors
- **Release Tracking**: Track errors by deployment version

---

## Step 1: Create Sentry Account

1. Go to https://sentry.io/signup/
2. Create a free account (100k events/month)
3. Create a new project:
   - Platform: **Node.js**
   - Project name: `library-management-system`
4. Copy your DSN (looks like: `https://abc123@o123.ingest.sentry.io/456`)

---

## Step 2: Install Packages

```bash
cd server
pnpm add @sentry/node @sentry/profiling-node
```

---

## Step 3: Configure Environment

Add to `server/.env`:

```bash
# Sentry Error Monitoring
SENTRY_DSN=https://your-key-here@sentry.io/your-project-id

# Optional: Set release version for tracking deployments
SENTRY_RELEASE=1.0.0
```

**Example**:
```bash
SENTRY_DSN=https://abc123def456@o123456.ingest.sentry.io/789012
SENTRY_RELEASE=v1.0.0
```

---

## Step 4: Initialize in Server

The Sentry configuration is already created in `server/src/config/sentry.ts`.

Update `server/src/index.ts` to initialize Sentry:

```typescript
import { init Sentry } from './config/sentry';

const app = express();

// Initialize Sentry (do this BEFORE other middleware)
const Sentry = initSentry(app);

// Sentry request handler (captures request context)
if (Sentry) {
  app.use(Sentry.Handlers.requestHandler());
  app.use(Sentry.Handlers.tracingHandler());
}

// ... your existing middleware
app.use(helmet(...));
app.use(express.json(...));
// ... etc

// ... your routes
app.use('/api/auth', authRoutes);
app.use('/api/books', booksRoutes);
// ... etc

// Sentry error handler (BEFORE other error handlers)
if (Sentry) {
  app.use(Sentry.Handlers.errorHandler());
}

// Your error handlers
app.use(errorHandler);
```

---

## Step 5: Update Error Handler

Update `server/src/middleware/errorHandler.ts` to report errors to Sentry:

```typescript
import { captureException } from '../config/sentry';
import config from '../config';

export const errorHandler = (
  err: Error | AppError,
  req: any,
  res: Response,
  next: NextFunction
): void => {
  // Report to Sentry in production
  if (config.nodeEnv === 'production') {
    captureException(err, {
      extra: {
        requestId: req.id,
        userId: req.user?.userId,
        path: req.path,
        method: req.method,
      },
    });
  }

  // ... rest of your error handling
  console.error('Error:', err);

  if (err instanceof AppError) {
    res.status(err.statusCode).json({
      error: err.message,
      requestId: req.id,
    });
  } else {
    res.status(500).json({
      error: 'Internal server error',
      requestId: req.id,
    });
  }
};
```

---

## Step 6: Test Sentry Integration

### Test Error Capture

Create a test endpoint:

```typescript
// server/src/index.ts
app.get('/api/test-sentry', (req, res) => {
  throw new Error('Test Sentry error - this is intentional!');
});
```

Then:
1. Start your server: `pnpm run dev`
2. Trigger the error: `curl http://localhost:3001/api/test-sentry`
3. Check Sentry dashboard - you should see the error appear within seconds

### Test Performance Monitoring

Performance is automatically tracked for all requests. Check:
- **Performance** tab in Sentry dashboard
- See slow transactions (endpoints that took > 1s)
- View transaction details with database query times

---

## Optional: Advanced Features

### 1. Set User Context

Track which users encounter errors:

```typescript
import { setUser } from '../config/sentry';

// In your auth middleware after verifying token
if (req.user) {
  setUser({
    id: req.user.userId,
    username: req.user.username,
    email: req.user.email, // if available
  });
}
```

### 2. Add Breadcrumbs

Add debugging context:

```typescript
import { addBreadcrumb } from '../config/sentry';

// Before critical operations
addBreadcrumb({
  message: 'User attempting to borrow book',
  category: 'loan',
  level: 'info',
  data: {
    bookId: book_id,
    memberId: member_id,
  },
});
```

### 3. Capture Custom Messages

Report non-error events:

```typescript
import { captureMessage } from '../config/sentry';

// Warn about unusual activity
if (failedLoginAttempts > 5) {
  captureMessage(`High failed login attempts for user: ${username}`, 'warning');
}
```

### 4. Release Tracking

Track errors by deployment version:

```bash
# In CI/CD pipeline, set SENTRY_RELEASE
export SENTRY_RELEASE=$(git rev-parse --short HEAD)

# Or use semantic versioning
export SENTRY_RELEASE=v1.2.3
```

---

## Sentry Dashboard Overview

### Issues Tab
- View all errors grouped by type
- See frequency, affected users, and stack traces
- Mark issues as resolved
- Set up alerts for critical errors

### Performance Tab
- See slow API endpoints
- View database query performance
- Identify bottlenecks
- Track improvements over time

### Releases Tab
- See errors by deployment version
- Track if new deployments introduce issues
- Compare error rates between releases

---

## Sample Rates

**Current Configuration** (`server/src/config/sentry.ts`):

- **Traces Sample Rate**: 10% (1 in 10 transactions tracked)
  - Reduces performance overhead
  - Still provides good coverage for issues
  - Can increase to 100% if needed

- **Profiles Sample Rate**: 10% (1 in 10 traces profiled)
  - CPU profiling to find bottlenecks
  - Minimal performance impact
  - Useful for production debugging

**To Change Sample Rates**:

Edit `server/src/config/sentry.ts`:

```typescript
Sentry.init({
  // ... other config
  tracesSampleRate: 1.0,   // 100% for staging/testing
  profilesSampleRate: 0.5, // 50% profiling
});
```

---

## Cost & Limits

### Free Tier (Good for Small Projects)
- 100,000 errors per month
- 10,000 performance units per month
- 30-day retention
- 1 user

### Team Plan ($26/month)
- 500,000 errors per month
- 100,000 performance units
- 90-day retention
- Unlimited users

**Recommendation**: Start with free tier, upgrade if you exceed limits.

---

## Alerts & Notifications

### Set Up Alerts

1. Go to **Settings** → **Alerts**
2. Create alert rules:
   - **Error Spike**: Alert if error rate > 1% for 5 minutes
   - **Critical Error**: Alert on any 500 error
   - **Performance Degradation**: Alert if p95 > 1s

3. Configure notifications:
   - Email
   - Slack (recommended)
   - PagerDuty (for on-call)

---

## Troubleshooting

### Sentry Not Capturing Errors

**Check**:
1. SENTRY_DSN is set correctly in `.env`
2. Server is running in production mode or SENTRY_DSN is set
3. Packages are installed: `pnpm list @sentry/node`
4. No errors in console during Sentry initialization

### Too Many Events

**Solutions**:
1. Lower sample rates (tracesSampleRate: 0.05 for 5%)
2. Filter out noisy errors:
   ```typescript
   beforeSend(event, hint) {
     // Ignore 404 errors
     if (event.exception?.values?.[0]?.type === 'NotFoundError') {
       return null;
     }
     return event;
   }
   ```
3. Set up rate limiting in Sentry dashboard

### Performance Impact

**Optimizations**:
- Use low sample rates (10% is good default)
- Enable Sentry only in production
- Use async error reporting (Sentry does this automatically)
- Monitor server CPU/memory usage

---

## Security Best Practices

### 1. Filter Sensitive Data

Already configured in `server/src/config/sentry.ts`:

```typescript
beforeSend(event, hint) {
  // Remove auth headers
  if (event.request?.headers) {
    delete event.request.headers['authorization'];
    delete event.request.headers['cookie'];
  }

  // Remove sensitive POST data
  if (event.request?.data) {
    delete event.request.data.password;
    delete event.request.data.token;
  }

  return event;
}
```

### 2. Scrub PII

Add to Sentry init:

```typescript
Sentry.init({
  // ... other config
  beforeSend(event) {
    // Remove email addresses from error messages
    if (event.message) {
      event.message = event.message.replace(/[\w.-]+@[\w.-]+\.\w+/g, '[email]');
    }
    return event;
  },
});
```

### 3. Control Access

- Use separate Sentry projects for dev/staging/production
- Limit team access to production project
- Review Sentry audit logs regularly

---

## Next Steps

1. ✅ Create Sentry account
2. ✅ Install packages: `pnpm add @sentry/node @sentry/profiling-node`
3. ✅ Add SENTRY_DSN to `.env`
4. ✅ Initialize in `server/src/index.ts`
5. ✅ Update error handler
6. ✅ Test with `/api/test-sentry` endpoint
7. ⚠️ Set up alerts in Sentry dashboard
8. ⚠️ Configure Slack notifications
9. ⚠️ Monitor for 1 week, adjust sample rates if needed

---

## Resources

- **Sentry Docs**: https://docs.sentry.io/platforms/node/
- **Express Integration**: https://docs.sentry.io/platforms/node/guides/express/
- **Performance Monitoring**: https://docs.sentry.io/platforms/node/performance/
- **Profiling**: https://docs.sentry.io/platforms/node/profiling/

---

**Questions?** See `docs/implementation_roadmap.md` for more details on Phase 1 monitoring setup.

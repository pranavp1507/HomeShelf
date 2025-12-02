# Load Testing Guide

This directory contains load testing scripts using **k6** - a modern load testing tool for developers.

---

## Installation

### Windows
```bash
choco install k6
```

### macOS
```bash
brew install k6
```

### Linux
```bash
# Debian/Ubuntu
sudo gpg -k
sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
sudo apt-get update
sudo apt-get install k6

# Fedora/CentOS
sudo dnf install https://dl.k6.io/rpm/repo.rpm
sudo dnf install k6
```

Verify installation:
```bash
k6 version
```

---

## Available Tests

### 1. Smoke Test (Quick Validation)
**File**: `smoke-test.js`
**Duration**: 30 seconds
**Users**: 5 concurrent users
**Purpose**: Quick validation that all endpoints work

```bash
k6 run smoke-test.js
```

**Use this**:
- Before deploying to production
- After making changes to verify nothing broke
- In CI/CD pipeline for quick validation

---

### 2. Load Test (Full Performance Test)
**File**: `k6-tests.js`
**Duration**: ~16 minutes
**Users**: Ramps up to 100 concurrent users
**Purpose**: Validate performance under realistic load

```bash
k6 run k6-tests.js
```

**Test Stages**:
1. Warm up: 1 min to 20 users
2. Ramp up: 3 min to 50 users
3. Sustained: 5 min at 50 users
4. Spike: 2 min to 100 users
5. Peak: 3 min at 100 users
6. Ramp down: 2 min to 0 users

**Use this**:
- Before production launch
- After major changes
- Monthly performance validation
- When planning for scale

---

## Running Tests

### NPM Scripts (Recommended)

#### For Local Development (localhost:3001)
```bash
# Start server first
pnpm run dev

# Then in another terminal:
pnpm test:smoke      # Quick smoke test
pnpm test:load       # Full load test
```

#### For Traefik/Docker Setup (https://local.test)
```bash
# Start Docker stack first
docker-compose up -d

# Then run tests:
pnpm test:smoke:traefik      # Smoke test against Traefik (uses username: pranav)
pnpm test:load:traefik       # Load test against Traefik (uses username: pranav)
```

**Note**: Tests are configured to use username `pranav`. Set the password when prompted or via environment variable (see Custom Credentials below).

### Direct k6 Commands

```bash
# Local development
k6 run smoke-test.js
k6 run k6-tests.js

# Custom URL (Traefik, staging, production)
API_URL=https://local.test k6 run smoke-test.js
API_URL=https://staging.example.com k6 run k6-tests.js
API_URL=https://api.yoursite.com k6 run k6-tests.js
```

### Custom Credentials

The tests use environment variables for authentication. You can override them:

```bash
# Using your own admin credentials
TEST_USERNAME=pranav TEST_PASSWORD=yourpassword pnpm test:smoke:traefik

# Or with direct k6 command
API_URL=https://local.test TEST_USERNAME=pranav TEST_PASSWORD=yourpassword k6 run smoke-test.js

# Default credentials (if not specified):
# - Username: admin
# - Password: admin123
```

### Custom Configuration
```bash
# Custom users and duration
k6 run --vus 50 --duration 60s smoke-test.js

# Output results to file
k6 run --out json=results.json k6-tests.js

# Run with cloud output (requires k6 cloud account)
k6 run --out cloud k6-tests.js
```

---

## Performance Thresholds

### Smoke Test
- 95th percentile: < 1000ms (1 second)
- Error rate: < 5%

### Load Test
- 95th percentile: < 500ms
- 99th percentile: < 1000ms (1 second)
- Error rate: < 1%
- Search queries: < 200ms (95th percentile)
- Dashboard: < 300ms (95th percentile)

---

## Interpreting Results

### Successful Test Output
```
✓ search status is 200
✓ search has data array
✓ search duration < 200ms

checks.........................: 100.00% ✓ 5000 ✗ 0
http_req_duration..............: avg=145ms min=45ms med=120ms max=480ms p(95)=350ms p(99)=450ms
http_reqs......................: 5000    83.33/s
vus............................: 50      min=50  max=50
```

**What to look for**:
- ✅ All checks passing (100%)
- ✅ p(95) < threshold (500ms)
- ✅ Error rate < 1%
- ✅ Request rate stable

### Failed Test Output
```
✗ search duration < 200ms
  ↳ 85% — ✓ 4250 / ✗ 750

http_req_duration..............: avg=680ms p(95)=1200ms p(99)=2500ms
http_req_failed................: 2.5%    ✓ 125 / ✗ 4875
```

**Issues detected**:
- ❌ 15% of searches took > 200ms
- ❌ 95th percentile is 1200ms (target: 500ms)
- ❌ 2.5% error rate (target: < 1%)

**Action**: Investigate slow queries, add database indexes, optimize code

---

## Test Scenarios Covered

### 1. Search Books
- Tests search functionality with various terms
- Validates pagination
- Checks response time < 200ms

### 2. Dashboard Statistics
- Tests aggregate queries
- Validates all stats returned
- Checks response time < 300ms

### 3. List Books
- Tests pagination with random pages
- Validates data structure
- Checks consistent performance

### 4. List Members
- Tests member listing
- Validates pagination
- Checks database query performance

### 5. Active Loans
- Tests loan filtering
- Validates complex joins
- Checks query optimization

### 6. Filter by Availability
- Tests filtered queries
- Validates index usage
- Checks filter performance

### 7. List Categories
- Tests simple queries
- Validates caching (if implemented)
- Baseline performance check

---

## Troubleshooting

### Test Fails: Connection refused (Traefik/Docker)
**Issue**: `dial tcp 127.0.0.1:3001: connectex: No connection could be made`
**Cause**: Tests are trying to connect to localhost:3001 but server is running in Docker with Traefik

**Fix**:
```bash
# Use the Traefik-specific scripts
pnpm test:smoke:traefik      # Instead of pnpm test:smoke
pnpm test:load:traefik       # Instead of pnpm test:load

# Or set the API_URL manually
API_URL=https://local.test k6 run smoke-test.js
```

**Note**: Make sure your Docker stack is running first:
```bash
docker-compose up -d  # or docker-compose -f compose.dev.yml up -d
```

### Test Fails: SSL/TLS certificate errors (Traefik)
**Issue**: `x509: certificate signed by unknown authority`
**Cause**: Self-signed certificates from Traefik

**Fix Option 1** - Disable SSL verification (testing only):
```bash
# Add --insecure-skip-tls-verify flag
k6 run --insecure-skip-tls-verify smoke-test.js
```

**Fix Option 2** - Update k6 test to skip verification:
Add to your test file:
```javascript
export const options = {
  insecureSkipTLSVerify: true,
  // ... other options
};
```

### Test Fails: "Unable to login"
**Issue**: Cannot authenticate
**Fix**:
1. Ensure server is running: `pnpm run dev`
2. Check admin credentials exist
3. Verify DATABASE_URL is set
4. Check server logs for errors

### Test Fails: Connection refused
**Issue**: Cannot connect to server
**Fix**:
1. Start server: `cd server && pnpm run dev`
2. Verify port 3001 is accessible
3. Check firewall settings
4. Use correct API_URL

### High Error Rates
**Issue**: > 1% requests failing
**Possible Causes**:
- Database connection pool exhausted
- Rate limiting triggered
- Server out of memory
- Database queries timing out

**Fix**:
1. Check server logs
2. Increase connection pool size
3. Add database indexes
4. Optimize slow queries

### Slow Response Times
**Issue**: p(95) > 500ms
**Possible Causes**:
- Missing database indexes
- N+1 query problem
- No caching
- Slow disk I/O

**Fix**:
1. Run `EXPLAIN ANALYZE` on slow queries
2. Add indexes to frequently queried columns
3. Implement query result caching
4. Optimize JOIN operations

---

## CI/CD Integration

### GitHub Actions Example
```yaml
name: Load Test

on:
  pull_request:
    branches: [main]

jobs:
  smoke-test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v3

      - name: Setup k6
        run: |
          sudo gpg -k
          sudo gpg --no-default-keyring --keyring /usr/share/keyrings/k6-archive-keyring.gpg --keyserver hkp://keyserver.ubuntu.com:80 --recv-keys C5AD17C747E3415A3642D57D77C6C491D6AC1D69
          echo "deb [signed-by=/usr/share/keyrings/k6-archive-keyring.gpg] https://dl.k6.io/deb stable main" | sudo tee /etc/apt/sources.list.d/k6.list
          sudo apt-get update
          sudo apt-get install k6

      - name: Start server
        run: |
          docker-compose -f compose.dev.yml up -d
          sleep 10

      - name: Run smoke test
        run: k6 run server/__tests__/load/smoke-test.js

      - name: Run load test
        run: k6 run server/__tests__/load/k6-tests.js
        if: github.event_name == 'push' && github.ref == 'refs/heads/main'
```

---

## Best Practices

### Before Running Tests
1. ✅ Server is running in production mode
2. ✅ Database has realistic data volume
3. ✅ No other heavy processes running
4. ✅ Consistent network conditions

### During Tests
1. ✅ Monitor server CPU/memory usage
2. ✅ Watch database connection pool
3. ✅ Check for errors in server logs
4. ✅ Monitor response times in real-time

### After Tests
1. ✅ Review all threshold failures
2. ✅ Identify bottlenecks
3. ✅ Plan optimizations
4. ✅ Re-test after fixes

---

## Advanced Usage

### Custom Scenarios
Create custom test scripts for specific use cases:

```javascript
import http from 'k6/http';
import { check } from 'k6';

export const options = {
  scenarios: {
    // Heavy read load
    readers: {
      executor: 'constant-vus',
      vus: 50,
      duration: '5m',
      exec: 'readScenario',
    },
    // Light write load
    writers: {
      executor: 'constant-vus',
      vus: 5,
      duration: '5m',
      exec: 'writeScenario',
    },
  },
};

export function readScenario() {
  // Read-heavy operations
}

export function writeScenario() {
  // Write operations
}
```

### Performance Profiling
Use k6 with other tools:

```bash
# Generate detailed metrics
k6 run --out json=metrics.json k6-tests.js

# Analyze with k6 dashboard
k6 run --out influxdb=http://localhost:8086/k6 k6-tests.js
```

---

## Expected Performance Benchmarks

### With Database Indexes (Current)
- Search queries: 50-150ms (avg)
- Dashboard stats: 80-200ms (avg)
- List operations: 30-100ms (avg)
- 100 concurrent users: ✅ Supported

### Without Database Indexes
- Search queries: 500-1500ms (avg)
- Dashboard stats: 300-800ms (avg)
- List operations: 200-500ms (avg)
- 100 concurrent users: ❌ High error rate

---

## Getting Help

### k6 Documentation
- Official docs: https://k6.io/docs/
- Examples: https://k6.io/docs/examples/
- Community: https://community.k6.io/

### Project-Specific Help
See `docs/implementation_roadmap.md` for:
- Troubleshooting guide
- Performance optimization tips
- Architecture documentation

---

## Next Steps

After running load tests:

1. **Review Results** - Check all metrics against thresholds
2. **Identify Bottlenecks** - Find slow queries and endpoints
3. **Optimize** - Add indexes, optimize queries, implement caching
4. **Re-test** - Verify improvements
5. **Monitor Production** - Set up continuous monitoring

See Phase 1 of `docs/implementation_roadmap.md` for full production validation workflow.

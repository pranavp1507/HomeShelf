/**
 * K6 Load Testing Script
 *
 * Tests the Library Management System API under load
 *
 * Usage:
 *   k6 run k6-tests.js
 *   k6 run --vus 100 --duration 30s k6-tests.js  # Custom config
 *
 * Install k6:
 *   Windows: choco install k6
 *   macOS: brew install k6
 *   Linux: sudo apt-get install k6
 */

import http from 'k6/http';
import { check, sleep, group } from 'k6';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const errorRate = new Rate('errors');
const searchDuration = new Trend('search_duration');
const dashboardDuration = new Trend('dashboard_duration');

// Test configuration
export const options = {
  stages: [
    { duration: '1m', target: 20 },   // Warm up to 20 users
    { duration: '3m', target: 50 },   // Ramp up to 50 users
    { duration: '5m', target: 50 },   // Stay at 50 users for 5 minutes
    { duration: '2m', target: 100 },  // Spike to 100 users
    { duration: '3m', target: 100 },  // Stay at 100 users
    { duration: '2m', target: 0 },    // Ramp down to 0
  ],
  insecureSkipTLSVerify: true,  // Skip TLS verification for self-signed certs (Traefik)
  thresholds: {
    http_req_duration: ['p(95)<500'],    // 95% of requests < 500ms
    http_req_duration: ['p(99)<1000'],   // 99% of requests < 1s
    http_req_failed: ['rate<0.01'],      // Error rate < 1%
    errors: ['rate<0.01'],               // Custom error rate < 1%
    search_duration: ['p(95)<200'],      // Search queries < 200ms
    dashboard_duration: ['p(95)<300'],   // Dashboard < 300ms
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const TEST_USERNAME = __ENV.TEST_USERNAME || 'admin';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'admin123';

/**
 * Setup function - runs once before tests
 * Logs in and retrieves auth token
 */
export function setup() {
  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      username: TEST_USERNAME,
      password: TEST_PASSWORD
    }),
    {
      headers: { 'Content-Type': 'application/json' },
      tags: { name: 'setup_login' }
    }
  );

  if (loginRes.status !== 200) {
    console.error('Setup failed: Unable to login');
    console.error('Response:', loginRes.body);
    return null;
  }

  const token = loginRes.json('token');

  if (!token) {
    console.error('Setup failed: No token received');
    return null;
  }

  console.log('✅ Setup complete - Auth token obtained');
  return { token };
}

/**
 * Main test function - runs for each virtual user
 */
export default function(data) {
  if (!data || !data.token) {
    console.error('No auth token available - skipping tests');
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`
  };

  // Test 1: Search books by title
  group('Search Books', () => {
    const searchTerms = ['gatsby', 'python', 'javascript', 'moby'];
    const term = searchTerms[Math.floor(Math.random() * searchTerms.length)];

    const res = http.get(
      `${BASE_URL}/api/books?search=${term}&page=1&limit=25`,
      {
        headers,
        tags: { name: 'search_books' }
      }
    );

    const success = check(res, {
      'search status is 200': (r) => r.status === 200,
      'search has data array': (r) => r.json('data') !== undefined,
      'search duration < 200ms': (r) => r.timings.duration < 200,
    });

    errorRate.add(!success);
    searchDuration.add(res.timings.duration);
  });

  sleep(1);

  // Test 2: Get dashboard statistics
  group('Dashboard Stats', () => {
    const res = http.get(
      `${BASE_URL}/api/dashboard`,
      {
        headers,
        tags: { name: 'dashboard_stats' }
      }
    );

    const success = check(res, {
      'dashboard status is 200': (r) => r.status === 200,
      'dashboard has totalBooks': (r) => r.json('totalBooks') !== undefined,
      'dashboard duration < 300ms': (r) => r.timings.duration < 300,
    });

    errorRate.add(!success);
    dashboardDuration.add(res.timings.duration);
  });

  sleep(1);

  // Test 3: List books with pagination
  group('List Books', () => {
    const page = Math.floor(Math.random() * 5) + 1; // Random page 1-5

    const res = http.get(
      `${BASE_URL}/api/books?page=${page}&limit=25`,
      {
        headers,
        tags: { name: 'list_books' }
      }
    );

    const success = check(res, {
      'list status is 200': (r) => r.status === 200,
      'list has pagination': (r) => r.json('page') !== undefined,
    });

    errorRate.add(!success);
  });

  sleep(1);

  // Test 4: Get members list
  group('List Members', () => {
    const res = http.get(
      `${BASE_URL}/api/members?page=1&limit=25`,
      {
        headers,
        tags: { name: 'list_members' }
      }
    );

    const success = check(res, {
      'members status is 200': (r) => r.status === 200,
      'members has data': (r) => r.json('data') !== undefined,
    });

    errorRate.add(!success);
  });

  sleep(1);

  // Test 5: Get active loans
  group('Active Loans', () => {
    const res = http.get(
      `${BASE_URL}/api/loans?status=active&page=1&limit=25`,
      {
        headers,
        tags: { name: 'active_loans' }
      }
    );

    const success = check(res, {
      'loans status is 200': (r) => r.status === 200,
    });

    errorRate.add(!success);
  });

  sleep(2);

  // Test 6: Filter books by availability
  group('Filter Books by Availability', () => {
    const res = http.get(
      `${BASE_URL}/api/books?availableStatus=true&page=1&limit=25`,
      {
        headers,
        tags: { name: 'filter_available_books' }
      }
    );

    const success = check(res, {
      'filter status is 200': (r) => r.status === 200,
    });

    errorRate.add(!success);
  });

  sleep(1);

  // Test 7: Get categories
  group('List Categories', () => {
    const res = http.get(
      `${BASE_URL}/api/categories`,
      {
        headers,
        tags: { name: 'list_categories' }
      }
    );

    const success = check(res, {
      'categories status is 200': (r) => r.status === 200,
    });

    errorRate.add(!success);
  });

  sleep(2);
}

/**
 * Teardown function - runs once after all tests complete
 */
export function teardown(data) {
  console.log('');
  console.log('=== Load Test Summary ===');
  console.log('Test configuration:');
  console.log('  - Max concurrent users: 100');
  console.log('  - Total duration: ~16 minutes');
  console.log('  - Target endpoints: 7 API routes');
  console.log('');
  console.log('✅ Load test complete!');
  console.log('');
  console.log('Check the summary above for performance metrics.');
}

/**
 * Handle summary - custom report formatting
 */
export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: '  ', enableColors: true }),
  };
}

function textSummary(data, options = {}) {
  const indent = options.indent || '';
  const enableColors = options.enableColors || false;

  let summary = '\n';
  summary += indent + '=================================\n';
  summary += indent + '    LOAD TEST RESULTS\n';
  summary += indent + '=================================\n\n';

  // Request stats
  summary += indent + 'HTTP Requests:\n';
  summary += indent + `  Total: ${data.metrics.http_reqs.values.count}\n`;
  summary += indent + `  Failed: ${data.metrics.http_req_failed.values.passes} (${(data.metrics.http_req_failed.values.rate * 100).toFixed(2)}%)\n`;
  summary += indent + `  Rate: ${data.metrics.http_reqs.values.rate.toFixed(2)} req/s\n\n`;

  // Response time stats
  summary += indent + 'Response Times:\n';
  summary += indent + `  Avg: ${data.metrics.http_req_duration.values.avg.toFixed(2)}ms\n`;
  summary += indent + `  Min: ${data.metrics.http_req_duration.values.min.toFixed(2)}ms\n`;
  summary += indent + `  Max: ${data.metrics.http_req_duration.values.max.toFixed(2)}ms\n`;
  summary += indent + `  p(50): ${data.metrics.http_req_duration.values['p(50)'].toFixed(2)}ms\n`;
  summary += indent + `  p(95): ${data.metrics.http_req_duration.values['p(95)'].toFixed(2)}ms\n`;
  summary += indent + `  p(99): ${data.metrics.http_req_duration.values['p(99)'].toFixed(2)}ms\n\n`;

  // Custom metrics
  if (data.metrics.search_duration) {
    summary += indent + 'Search Performance:\n';
    summary += indent + `  Avg: ${data.metrics.search_duration.values.avg.toFixed(2)}ms\n`;
    summary += indent + `  p(95): ${data.metrics.search_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  if (data.metrics.dashboard_duration) {
    summary += indent + 'Dashboard Performance:\n';
    summary += indent + `  Avg: ${data.metrics.dashboard_duration.values.avg.toFixed(2)}ms\n`;
    summary += indent + `  p(95): ${data.metrics.dashboard_duration.values['p(95)'].toFixed(2)}ms\n\n`;
  }

  // Virtual users
  summary += indent + 'Virtual Users:\n';
  summary += indent + `  Max: ${data.metrics.vus_max.values.max}\n\n`;

  // Thresholds
  summary += indent + 'Threshold Results:\n';
  const thresholds = data.root_group.checks || [];
  let passedThresholds = 0;
  let totalThresholds = 0;

  for (const [name, result] of Object.entries(data.thresholds || {})) {
    totalThresholds++;
    if (result.ok) {
      passedThresholds++;
      summary += indent + `  ✓ ${name}\n`;
    } else {
      summary += indent + `  ✗ ${name}\n`;
    }
  }

  summary += indent + `\n  Passed: ${passedThresholds}/${totalThresholds}\n\n`;

  summary += indent + '=================================\n\n';

  return summary;
}

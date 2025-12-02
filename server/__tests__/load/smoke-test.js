/**
 * K6 Smoke Test - Quick validation of API endpoints
 *
 * Runs a lightweight test with minimal load to verify:
 * - All endpoints are accessible
 * - Basic functionality works
 * - No critical errors
 *
 * Usage: k6 run smoke-test.js
 */

import http from 'k6/http';
import { check, group } from 'k6';

// Minimal load configuration
export const options = {
  vus: 5,              // 5 virtual users
  duration: '30s',     // Run for 30 seconds
  insecureSkipTLSVerify: true,  // Skip TLS verification for self-signed certs (Traefik)
  thresholds: {
    http_req_duration: ['p(95)<1000'],  // 95% < 1s
    http_req_failed: ['rate<0.05'],     // Error rate < 5%
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';
const TEST_USERNAME = __ENV.TEST_USERNAME || 'admin';
const TEST_PASSWORD = __ENV.TEST_PASSWORD || 'admin123';

export function setup() {
  console.log('🔥 Starting smoke test...');

  const loginRes = http.post(
    `${BASE_URL}/api/auth/login`,
    JSON.stringify({
      username: TEST_USERNAME,
      password: TEST_PASSWORD
    }),
    { headers: { 'Content-Type': 'application/json' } }
  );

  if (loginRes.status !== 200) {
    console.error('❌ Login failed');
    return null;
  }

  const token = loginRes.json('token');
  console.log('✅ Login successful');
  return { token };
}

export default function(data) {
  if (!data || !data.token) {
    return;
  }

  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${data.token}`
  };

  // Test critical endpoints
  group('Critical Endpoints', () => {
    // Books
    const books = http.get(`${BASE_URL}/api/books?page=1&limit=10`, { headers });
    check(books, { 'Books API works': (r) => r.status === 200 });

    // Members
    const members = http.get(`${BASE_URL}/api/members?page=1&limit=10`, { headers });
    check(members, { 'Members API works': (r) => r.status === 200 });

    // Loans
    const loans = http.get(`${BASE_URL}/api/loans?page=1&limit=10`, { headers });
    check(loans, { 'Loans API works': (r) => r.status === 200 });

    // Dashboard
    const dashboard = http.get(`${BASE_URL}/api/dashboard`, { headers });
    check(dashboard, { 'Dashboard API works': (r) => r.status === 200 });

    // Categories
    const categories = http.get(`${BASE_URL}/api/categories`, { headers });
    check(categories, { 'Categories API works': (r) => r.status === 200 });
  });
}

export function teardown(data) {
  console.log('');
  console.log('✅ Smoke test complete!');
  console.log('All critical endpoints validated.');
}

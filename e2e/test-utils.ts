import { Page, expect } from '@playwright/test';

/**
 * Test utilities for E2E tests
 */

export const TEST_USER = {
  username: 'admin',
  password: 'admin123',
};

export const TEST_BOOK = {
  title: 'Test Book',
  author: 'Test Author',
  isbn: '9780123456789',
};

export const TEST_MEMBER = {
  name: 'Test Member',
  email: 'test@example.com',
  phone: '1234567890',
};

/**
 * Login as admin user
 */
export async function loginAsAdmin(page: Page) {
  await page.goto('/');

  // Check if we're already logged in
  const isLoggedIn = await page.locator('text=Dashboard').isVisible().catch(() => false);

  if (!isLoggedIn) {
    // Fill in login form
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("Login")');

    // Wait for navigation to dashboard
    await page.waitForURL('**/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
  }
}

/**
 * Logout
 */
export async function logout(page: Page) {
  await page.click('button:has-text("Logout")');
  await page.waitForURL('**/login');
}

/**
 * Navigate to a specific page
 */
export async function navigateTo(page: Page, section: string) {
  await page.click(`text=${section}`);
  await page.waitForLoadState('networkidle');
}

/**
 * Wait for toast notification
 */
export async function waitForToast(page: Page, message?: string) {
  if (message) {
    await expect(page.locator(`.Toastify__toast:has-text("${message}")`)).toBeVisible();
  } else {
    await expect(page.locator('.Toastify__toast')).toBeVisible();
  }
}

/**
 * Clear all data (for test isolation)
 */
export async function clearTestData(page: Page) {
  // This would require backend API endpoints for clearing test data
  // For now, we'll rely on test database reset between test runs
}

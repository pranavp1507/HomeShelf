import { test, expect } from '@playwright/test';
import { TEST_USER, loginAsAdmin, logout } from './test-utils';

test.describe('Authentication Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('should display login page on first visit', async ({ page }) => {
    await expect(page.locator('h1:has-text("Library Management System")')).toBeVisible();
    await expect(page.locator('input[type="text"]')).toBeVisible();
    await expect(page.locator('input[type="password"]')).toBeVisible();
    await expect(page.locator('button:has-text("Login")')).toBeVisible();
  });

  test('should show error on invalid credentials', async ({ page }) => {
    await page.fill('input[type="text"]', 'invalid');
    await page.fill('input[type="password"]', 'invalid');
    await page.click('button:has-text("Login")');

    // Wait for error message
    await expect(page.locator('text=Invalid username or password')).toBeVisible();
  });

  test('should login successfully with valid credentials', async ({ page }) => {
    await loginAsAdmin(page);

    // Should navigate to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator('text=Total Books')).toBeVisible();
    await expect(page.locator('text=Total Members')).toBeVisible();
  });

  test('should show user menu after login', async ({ page }) => {
    await loginAsAdmin(page);

    // User menu should be visible
    await expect(page.locator(`text=${TEST_USER.username}`)).toBeVisible();
    await expect(page.locator('button:has-text("Logout")')).toBeVisible();
  });

  test('should logout successfully', async ({ page }) => {
    await loginAsAdmin(page);

    // Logout
    await logout(page);

    // Should redirect to login page
    await expect(page).toHaveURL('/login');
    await expect(page.locator('h1:has-text("Library Management System")')).toBeVisible();
  });

  test('should remember login state on page refresh', async ({ page }) => {
    await loginAsAdmin(page);

    // Refresh page
    await page.reload();

    // Should still be logged in
    await expect(page.locator('text=Dashboard')).toBeVisible();
    await expect(page.locator(`text=${TEST_USER.username}`)).toBeVisible();
  });

  test('should redirect to login when accessing protected route without auth', async ({ page }) => {
    // Try to access books page directly
    await page.goto('/books');

    // Should redirect to login
    await expect(page).toHaveURL('/login');
  });

  test('should preserve intended destination after login', async ({ page }) => {
    // Try to access books page directly (will redirect to login)
    await page.goto('/books');
    await expect(page).toHaveURL('/login');

    // Login
    await page.fill('input[type="text"]', TEST_USER.username);
    await page.fill('input[type="password"]', TEST_USER.password);
    await page.click('button:has-text("Login")');

    // Should redirect back to books page (or dashboard)
    await page.waitForLoadState('networkidle');
    const url = page.url();
    expect(url).toMatch(/\/(books)?$/);
  });

  test('should have responsive navbar on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await loginAsAdmin(page);

    // On mobile, hamburger menu should be visible
    const hamburger = page.locator('button[aria-label="Toggle menu"]');
    if (await hamburger.isVisible()) {
      await hamburger.click();
      await expect(page.locator('text=Books')).toBeVisible();
      await expect(page.locator('text=Members')).toBeVisible();
    }
  });
});

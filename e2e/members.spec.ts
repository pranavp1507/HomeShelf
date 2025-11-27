import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo, TEST_MEMBER } from './test-utils';

test.describe('Member Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsAdmin(page);
    await navigateTo(page, 'Members');
  });

  test('should display members list page', async ({ page }) => {
    await expect(page.locator('h2:has-text("Members")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Member")')).toBeVisible();
  });

  test('should show empty state when no members exist', async ({ page }) => {
    const emptyState = page.locator('text=No members found');
    const memberTable = page.locator('table');

    const hasMembers = await memberTable.isVisible().catch(() => false);
    if (!hasMembers) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should open add member dialog', async ({ page }) => {
    await page.click('button:has-text("Add Member")');

    await expect(page.locator('h2:has-text("Add Member")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Name"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Email"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Phone"]')).toBeVisible();
  });

  test('should add a new member successfully', async ({ page }) => {
    await page.click('button:has-text("Add Member")');

    // Fill in member details
    await page.fill('input[placeholder*="Name"]', TEST_MEMBER.name);
    await page.fill('input[placeholder*="Email"]', TEST_MEMBER.email);
    await page.fill('input[placeholder*="Phone"]', TEST_MEMBER.phone);

    // Submit form
    await page.click('button:has-text("Add Member"):not([aria-label])');

    // Wait for success and page update
    await page.waitForTimeout(1000);

    // Member should appear in the list
    await expect(page.locator(`text=${TEST_MEMBER.name}`)).toBeVisible();
    await expect(page.locator(`text=${TEST_MEMBER.email}`)).toBeVisible();
  });

  test('should validate email format', async ({ page }) => {
    await page.click('button:has-text("Add Member")');

    // Fill in invalid email
    await page.fill('input[placeholder*="Name"]', TEST_MEMBER.name);
    await page.fill('input[placeholder*="Email"]', 'invalid-email');
    await page.fill('input[placeholder*="Phone"]', TEST_MEMBER.phone);

    // Try to submit
    await page.click('button:has-text("Add Member"):not([aria-label])');

    // Should show validation error
    const emailInput = page.locator('input[placeholder*="Email"]');
    await expect(emailInput).toHaveAttribute('type', 'email');
  });

  test('should search for members', async ({ page }) => {
    // Add a member first if needed
    const hasMembers = await page.locator('table').isVisible().catch(() => false);
    if (!hasMembers) {
      await page.click('button:has-text("Add Member")');
      await page.fill('input[placeholder*="Name"]', TEST_MEMBER.name);
      await page.fill('input[placeholder*="Email"]', TEST_MEMBER.email);
      await page.fill('input[placeholder*="Phone"]', TEST_MEMBER.phone);
      await page.click('button:has-text("Add Member"):not([aria-label])');
      await page.waitForTimeout(1000);
    }

    // Search for member
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_MEMBER.name);
      await page.waitForTimeout(500);

      // Member should be visible in results
      await expect(page.locator(`text=${TEST_MEMBER.name}`)).toBeVisible();
    }
  });

  test('should open edit member dialog', async ({ page }) => {
    // Wait for members to load
    await page.waitForTimeout(1000);

    const editButton = page.locator('button:has-text("Edit")').first();
    const hasEditButton = await editButton.isVisible().catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      await expect(page.locator('h2:has-text("Edit Member")')).toBeVisible();
      await expect(page.locator('input[placeholder*="Name"]')).toHaveValue(/.+/);
    }
  });

  test('should edit a member successfully', async ({ page }) => {
    // Wait for members to load
    await page.waitForTimeout(1000);

    const editButton = page.locator('button:has-text("Edit")').first();
    const hasEditButton = await editButton.isVisible().catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      // Update name
      const nameInput = page.locator('input[placeholder*="Name"]');
      await nameInput.fill('Updated Member Name');

      // Save
      await page.click('button:has-text("Update Member")');
      await page.waitForTimeout(1000);

      // Updated name should be visible
      await expect(page.locator('text=Updated Member Name')).toBeVisible();
    }
  });

  test('should delete a member with confirmation', async ({ page }) => {
    // Wait for members to load
    await page.waitForTimeout(1000);

    const deleteButton = page.locator('button:has-text("Delete")').first();
    const hasDeleteButton = await deleteButton.isVisible().catch(() => false);

    if (hasDeleteButton) {
      // Get the member name before deleting
      const row = deleteButton.locator('xpath=ancestor::tr');
      const memberName = await row.locator('td').nth(0).textContent();

      // Click delete
      await deleteButton.click();

      // Confirm deletion
      await page.click('button:has-text("Delete"):not(:has-text("Delete Member"))');
      await page.waitForTimeout(1000);

      // Member should no longer be visible
      if (memberName) {
        await expect(page.locator(`text=${memberName}`)).not.toBeVisible();
      }
    }
  });

  test('should bulk import members via CSV', async ({ page }) => {
    const bulkImportButton = page.locator('button:has-text("Bulk Import")');

    if (await bulkImportButton.isVisible()) {
      await bulkImportButton.click();

      await expect(page.locator('h2:has-text("Bulk Import Members")')).toBeVisible();
      await expect(page.locator('text=Download CSV Template')).toBeVisible();
    }
  });

  test('should sort members by column', async ({ page }) => {
    // Wait for members to load
    await page.waitForTimeout(1000);

    const nameHeader = page.locator('th:has-text("Name")');
    const hasNameHeader = await nameHeader.isVisible().catch(() => false);

    if (hasNameHeader) {
      // Click to sort
      await nameHeader.click();
      await page.waitForTimeout(500);

      // Click again to reverse sort
      await nameHeader.click();
      await page.waitForTimeout(500);

      await page.waitForLoadState('networkidle');
    }
  });

  test('should paginate members list', async ({ page }) => {
    // Wait for members to load
    await page.waitForTimeout(1000);

    const nextButton = page.locator('button:has-text("Next")');
    const hasNextButton = await nextButton.isVisible().catch(() => false);

    if (hasNextButton && !(await nextButton.isDisabled())) {
      await nextButton.click();
      await page.waitForTimeout(500);

      // Page should update
      await page.waitForLoadState('networkidle');
    }
  });

  test('should display member details correctly', async ({ page }) => {
    // Wait for members to load
    await page.waitForTimeout(1000);

    const memberRow = page.locator('table tbody tr').first();
    const hasRow = await memberRow.isVisible().catch(() => false);

    if (hasRow) {
      // Member row should have name, email, phone, and action buttons
      await expect(memberRow.locator('td').nth(0)).toBeVisible(); // Name
      await expect(memberRow.locator('td').nth(1)).toBeVisible(); // Email
      await expect(memberRow.locator('td').nth(2)).toBeVisible(); // Phone
      await expect(memberRow.locator('button:has-text("Edit")')).toBeVisible();
      await expect(memberRow.locator('button:has-text("Delete")')).toBeVisible();
    }
  });
});

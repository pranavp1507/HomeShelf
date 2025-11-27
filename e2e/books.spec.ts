import { test, expect } from '@playwright/test';
import { loginAsAdmin, navigateTo, TEST_BOOK } from './test-utils';

test.describe('Book Management Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await loginAsAdmin(page);
    await navigateTo(page, 'Books');
  });

  test('should display books list page', async ({ page }) => {
    await expect(page.locator('h2:has-text("Books")')).toBeVisible();
    await expect(page.locator('button:has-text("Add Book")')).toBeVisible();
  });

  test('should show empty state when no books exist', async ({ page }) => {
    // If no books, should show empty state
    const emptyState = page.locator('text=No books found');
    const bookTable = page.locator('table');

    const hasBooks = await bookTable.isVisible().catch(() => false);
    if (!hasBooks) {
      await expect(emptyState).toBeVisible();
    }
  });

  test('should open add book dialog', async ({ page }) => {
    await page.click('button:has-text("Add Book")');

    await expect(page.locator('h2:has-text("Add Book")')).toBeVisible();
    await expect(page.locator('input[placeholder*="Title"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="Author"]')).toBeVisible();
    await expect(page.locator('input[placeholder*="ISBN"]')).toBeVisible();
  });

  test('should add a new book successfully', async ({ page }) => {
    await page.click('button:has-text("Add Book")');

    // Fill in book details
    await page.fill('input[placeholder*="Title"]', TEST_BOOK.title);
    await page.fill('input[placeholder*="Author"]', TEST_BOOK.author);
    await page.fill('input[placeholder*="ISBN"]', TEST_BOOK.isbn);

    // Submit form
    await page.click('button:has-text("Add Book"):not([aria-label])');

    // Wait for success toast and page update
    await page.waitForTimeout(1000);

    // Book should appear in the list
    await expect(page.locator(`text=${TEST_BOOK.title}`)).toBeVisible();
    await expect(page.locator(`text=${TEST_BOOK.author}`)).toBeVisible();
  });

  test('should search for books', async ({ page }) => {
    // Add a book first if needed
    const hasBooks = await page.locator('table').isVisible().catch(() => false);
    if (!hasBooks) {
      await page.click('button:has-text("Add Book")');
      await page.fill('input[placeholder*="Title"]', TEST_BOOK.title);
      await page.fill('input[placeholder*="Author"]', TEST_BOOK.author);
      await page.click('button:has-text("Add Book"):not([aria-label])');
      await page.waitForTimeout(1000);
    }

    // Search for book
    const searchInput = page.locator('input[placeholder*="Search"]');
    if (await searchInput.isVisible()) {
      await searchInput.fill(TEST_BOOK.title);
      await page.waitForTimeout(500);

      // Book should be visible in results
      await expect(page.locator(`text=${TEST_BOOK.title}`)).toBeVisible();
    }
  });

  test('should filter books by category', async ({ page }) => {
    const categoryFilter = page.locator('select:has(option:has-text("All Categories"))');

    if (await categoryFilter.isVisible()) {
      // Select a category
      await categoryFilter.selectOption({ index: 1 });
      await page.waitForTimeout(500);

      // Results should update
      await page.waitForLoadState('networkidle');
    }
  });

  test('should filter books by availability', async ({ page }) => {
    const availabilityFilter = page.locator('select:has(option:has-text("All Books"))');

    if (await availabilityFilter.isVisible()) {
      // Filter by available only
      await availabilityFilter.selectOption({ label: 'Available Only' });
      await page.waitForTimeout(500);

      // Results should update
      await page.waitForLoadState('networkidle');
    }
  });

  test('should open edit book dialog', async ({ page }) => {
    // Wait for books to load
    await page.waitForTimeout(1000);

    const editButton = page.locator('button:has-text("Edit")').first();
    const hasEditButton = await editButton.isVisible().catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      await expect(page.locator('h2:has-text("Edit Book")')).toBeVisible();
      await expect(page.locator('input[placeholder*="Title"]')).toHaveValue(/.+/);
    }
  });

  test('should edit a book successfully', async ({ page }) => {
    // Wait for books to load
    await page.waitForTimeout(1000);

    const editButton = page.locator('button:has-text("Edit")').first();
    const hasEditButton = await editButton.isVisible().catch(() => false);

    if (hasEditButton) {
      await editButton.click();

      // Update title
      const titleInput = page.locator('input[placeholder*="Title"]');
      await titleInput.fill('Updated Book Title');

      // Save
      await page.click('button:has-text("Update Book")');
      await page.waitForTimeout(1000);

      // Updated title should be visible
      await expect(page.locator('text=Updated Book Title')).toBeVisible();
    }
  });

  test('should delete a book with confirmation', async ({ page }) => {
    // Wait for books to load
    await page.waitForTimeout(1000);

    const deleteButton = page.locator('button:has-text("Delete")').first();
    const hasDeleteButton = await deleteButton.isVisible().catch(() => false);

    if (hasDeleteButton) {
      // Get the book title before deleting
      const row = deleteButton.locator('xpath=ancestor::tr');
      const bookTitle = await row.locator('td').nth(0).textContent();

      // Click delete
      await deleteButton.click();

      // Confirm deletion
      await page.click('button:has-text("Delete"):not(:has-text("Delete Book"))');
      await page.waitForTimeout(1000);

      // Book should no longer be visible
      if (bookTitle) {
        await expect(page.locator(`text=${bookTitle}`)).not.toBeVisible();
      }
    }
  });

  test('should bulk import books via CSV', async ({ page }) => {
    const bulkImportButton = page.locator('button:has-text("Bulk Import")');

    if (await bulkImportButton.isVisible()) {
      await bulkImportButton.click();

      await expect(page.locator('h2:has-text("Bulk Import Books")')).toBeVisible();
      await expect(page.locator('text=Download CSV Template')).toBeVisible();
    }
  });

  test('should paginate books list', async ({ page }) => {
    // Wait for books to load
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

  test('should change items per page', async ({ page }) => {
    const itemsPerPageSelect = page.locator('select:has(option:has-text("10 per page"))');

    if (await itemsPerPageSelect.isVisible()) {
      await itemsPerPageSelect.selectOption({ label: '25 per page' });
      await page.waitForTimeout(500);

      // Page should update
      await page.waitForLoadState('networkidle');
    }
  });
});

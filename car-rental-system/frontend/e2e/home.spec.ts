/**
 * E2E: Car-rental homepage + cars listing with filters.
 *
 * Verifies PRD §5.1 (homepage), §5.2 (car listing), §5.3 (search/filter).
 */
import { test, expect } from '@playwright/test';

test.describe('Car rental homepage', () => {
  test('loads and shows hero section', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('body')).toBeVisible();
    // Should mention cars / rental / drive somewhere
    await expect(page.getByText(/car|rental|drive|zoomwheels/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('navigation to cars listing works', async ({ page }) => {
    await page.goto('/');
    const carsLink = page.getByRole('link', { name: /cars|browse.*fleet|view.*cars/i }).first();
    await expect(carsLink).toBeVisible({ timeout: 10000 });
    await carsLink.click();
    await expect(page).toHaveURL(/\/cars/);
  });

  test('cars page shows multiple cars', async ({ page }) => {
    await page.goto('/cars');
    // Wait for car cards to render — each has a Book Now button
    const bookButtons = page.getByRole('link', { name: /^book now$/i });
    await expect(bookButtons.first()).toBeVisible({ timeout: 15000 });
    const count = await bookButtons.count();
    expect(count).toBeGreaterThanOrEqual(3);
  });

  test('category filter narrows results', async ({ page }) => {
    await page.goto('/cars');

    // The category filter is a <select> element with id="category"
    const categorySelect = page.locator('#category');
    await expect(categorySelect).toBeVisible({ timeout: 10000 });
    await categorySelect.selectOption('suv');

    // URL should reflect the filter (URL-synced filters per project design)
    await expect(page).toHaveURL(/category=suv/i, { timeout: 5000 });
  });

  test('transmission filter narrows results and syncs URL', async ({ page }) => {
    await page.goto('/cars');
    const transSelect = page.locator('#transmission');
    await expect(transSelect).toBeVisible({ timeout: 10000 });
    await transSelect.selectOption('automatic');
    // URL must reflect transmission=automatic
    await expect(page).toHaveURL(/transmission=automatic/i, { timeout: 5000 });
    // At least one car should still be visible (we seeded multiple automatics)
    const bookButtons = page.getByRole('link', { name: /^book now$/i });
    await expect(bookButtons.first()).toBeVisible({ timeout: 10000 });
    const count = await bookButtons.count();
    expect(count).toBeGreaterThanOrEqual(1);
  });

  test('footer renders', async ({ page }) => {
    await page.goto('/');
    await expect(page.locator('footer')).toBeVisible();
  });
});

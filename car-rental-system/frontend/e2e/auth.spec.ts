/**
 * E2E: Car-rental auth + car detail flow.
 *
 * Verifies PRD §5.4 (booking form access requires auth) and the car
 * detail page renders specifications correctly.
 */
import { test, expect } from '@playwright/test';

const TEST_EMAIL = `e2e_car_${Date.now()}@example.com`;
const TEST_PASSWORD = 'secret123';

test.describe('Car rental auth + detail flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
    await page.evaluate(() => window.localStorage.clear());
  });

  test('user can register and view car detail', async ({ page }) => {
    // 1. Register
    await page.goto('/register');
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible({
      timeout: 10000,
    });

    await page.getByLabel(/name/i).fill('E2E Car User');
    await page.getByLabel(/email/i).fill(TEST_EMAIL);
    await page.getByLabel(/password/i).fill(TEST_PASSWORD);
    // Phone is optional but if present, fill it
    const phoneField = page.getByLabel(/phone/i);
    if (await phoneField.isVisible().catch(() => false)) {
      await phoneField.fill('9999999999');
    }
    await page.getByRole('button', { name: /create.*account|sign.*up|register/i }).click();

    await expect(page).not.toHaveURL(/\/register/, { timeout: 10000 });

    // 2. Go to cars listing
    await page.goto('/cars');
    await expect(page.getByRole('link', { name: /view details/i }).first()).toBeVisible({
      timeout: 15000,
    });

    // 3. Click View Details on the first car
    await page.getByRole('link', { name: /view details/i }).first().click();
    await expect(page).toHaveURL(/\/cars\/[^/]+$/);

    // 4. Detail page should show specifications
    await expect(page.getByText(/specifications|features|fuel/i).first()).toBeVisible({
      timeout: 10000,
    });
  });

  test('booking page redirects to login when unauthenticated', async ({ page }) => {
    // localStorage already cleared in beforeEach
    await page.goto('/book?carId=maruti-swift');
    await expect(page).toHaveURL(/\/login/, { timeout: 10000 });
  });

  test('car detail page shows price per day', async ({ page }) => {
    await page.goto('/cars/maruti-swift');
    // Should show ₹ somewhere (price)
    await expect(page.locator('text=₹').first()).toBeVisible({ timeout: 10000 });
  });
});

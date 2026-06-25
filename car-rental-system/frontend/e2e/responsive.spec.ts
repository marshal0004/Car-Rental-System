/**
 * Non-functional E2E: Responsive design verification for car-rental frontend.
 * Verifies PRD §5.5 (responsive design) across mobile, tablet, desktop.
 */
import { test, expect } from '@playwright/test';

const VIEWPORTS = [
  { name: 'mobile', width: 375, height: 667 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
];

for (const vp of VIEWPORTS) {
  test.describe(`Viewport: ${vp.name} (${vp.width}×${vp.height})`, () => {
    test.use({ viewport: { width: vp.width, height: vp.height } });

    test('homepage renders without horizontal overflow', async ({ page }) => {
      await page.goto('/');
      await page.waitForLoadState('networkidle');
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 5);
    });

    test('cars listing renders', async ({ page }) => {
      await page.goto('/cars');
      await expect(page.getByRole('link', { name: /^book now$/i }).first()).toBeVisible({
        timeout: 15000,
      });
    });

    test('filters remain accessible', async ({ page }) => {
      await page.goto('/cars');
      // Filter UI (chip or button) should be visible at all viewport sizes
      await expect(page.locator('button, a').filter({ hasText: /suv|sedan|hatchback|luxury/i }).first()).toBeVisible({
        timeout: 10000,
      });
    });

    test('navigation is accessible', async ({ page }) => {
      await page.goto('/');
      const nav = page.locator('nav').first();
      await expect(nav).toBeVisible();
    });
  });
}

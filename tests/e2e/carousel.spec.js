import { test, expect } from '@playwright/test';
import { WelcomePage } from '../pages/WelcomePage.js';

test('carousel arrows visible on hover when overflow', async ({ page }) => {
  await page.setViewportSize({ width: 350, height: 900 });
  const welcome = new WelcomePage(page);
  await welcome.goto();
  await welcome.selectOccasion('Wedding (guest)');
  await welcome.selectGender('Man');

  const carousel = page.locator('.carousel').first();
  await page.waitForTimeout(300);
  await carousel.hover();
  const arrow = page.locator('.carousel-arrow').first();
  await expect(arrow).toBeVisible();
});

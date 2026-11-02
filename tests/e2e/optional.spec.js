import { test, expect } from '@playwright/test';
import { WelcomePage } from '../pages/WelcomePage.js';

test('optional garments can be excluded', async ({ page }) => {
  const welcome = new WelcomePage(page);
  await welcome.goto();
  await welcome.selectOccasion('Wedding (guest)');
  await welcome.selectGender('Man');

  for (const name of ['Belt', 'Watch']) {
    const card = page.locator('.card').filter({ hasText: name });
    const include = card.locator('input[type="checkbox"]');
    if (await include.count()) {
      await include.uncheck();
      await expect(card.getByText('Garment excluded.')).toBeVisible();
    }
  }
});

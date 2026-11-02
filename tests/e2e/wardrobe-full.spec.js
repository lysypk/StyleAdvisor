import { test, expect } from '@playwright/test';
import { WelcomePage } from '../pages/WelcomePage.js';
import { WardrobePage } from '../pages/WardrobePage.js';

test('wardrobe full flow', async ({ page }) => {
  const welcome = new WelcomePage(page);
  const wardrobe = new WardrobePage(page);

  await welcome.goto();
  await welcome.selectOccasion('Wedding (guest)');
  await welcome.selectGender('Man');
  await wardrobe.goFromOutfit();
  await wardrobe.openAddForm();
  await wardrobe.selectGender('man');
  await wardrobe.saveItem();
  await wardrobe.enterCustomName('TestShirt');
  await wardrobe.backToOutfit();

  await page.locator('.card').filter({ hasText: 'Shirt' }).locator('button.svg').click();
  await expect(page.getByText('Shirt details')).toBeVisible();
  await page.locator('input[type="checkbox"]').check();
  await expect(page.getByText('Colour')).toHaveCount(0);
});

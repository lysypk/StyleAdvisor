import { test, expect } from '@playwright/test';
import { WelcomePage } from '../pages/WelcomePage.js';
import { OutfitPage } from '../pages/OutfitPage.js';
import { WardrobePage } from '../pages/WardrobePage.js';

test('welcome -> select occasion and gender -> garments screen', async ({ page }) => {
  const welcome = new WelcomePage(page);
  const outfit = new OutfitPage(page);

  await welcome.goto();
  await welcome.selectOccasion('Wedding (guest)');
  await welcome.selectGender('Man');
  await outfit.expectGarmentVisible('Shirt');
});

test('wardrobe basic flow', async ({ page }) => {
  const welcome = new WelcomePage(page);
  const wardrobe = new WardrobePage(page);

  await welcome.goto();
  await welcome.selectOccasion('Wedding (guest)');
  await welcome.selectGender('Man');
  await wardrobe.goFromOutfit();
  await wardrobe.openAddForm();
  await wardrobe.selectGender('man');
  await expect(page.getByRole('button', { name: 'Save item', exact: true })).toBeEnabled();
});

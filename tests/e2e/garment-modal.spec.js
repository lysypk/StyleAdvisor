import { test } from '@playwright/test';
import { WelcomePage } from '../pages/WelcomePage.js';
import { OutfitPage } from '../pages/OutfitPage.js';
import { GarmentModal } from '../pages/GarmentModal.js';

test('garment modal: colour, pattern, secondary, save', async ({ page }) => {
  const welcome = new WelcomePage(page);
  const outfit = new OutfitPage(page);
  const modal = new GarmentModal(page);

  await welcome.goto();
  await welcome.selectOccasion('Wedding (guest)');
  await welcome.selectGender('Man');
  await outfit.openGarment('Shirt');

  await modal.selectColourByProbability();
  await modal.selectPattern(/^Stripes/);
  await modal.selectSecondaryColour();
  await modal.expectSaveEnabled();
  await modal.save();
  await modal.expectSavedSummary();
});

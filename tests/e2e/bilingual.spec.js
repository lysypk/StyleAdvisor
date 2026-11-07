import { test, expect } from '@playwright/test';
import { WelcomePage } from '../pages/WelcomePage.js';
import { OutfitPage } from '../pages/OutfitPage.js';
import { GarmentModal } from '../pages/GarmentModal.js';
import { WardrobePage } from '../pages/WardrobePage.js';

const LANGS = {
  en: {
    switchLabel: null,
    occ: 'Wedding (guest)',
    gender: 'Man',
    wardrobe: 'Wardrobe',
    add: 'Add item',
    saveItem: 'Save item',
    remove: 'Remove',
    garment: 'Shirt',
    garmentDetail: 'Shirt details',
    belt: 'Belt',
    watch: 'Watch',
    exclusion: 'Garment excluded.',
    search: 'Search',
    manCard: 'Shirt',
  },
  pl: {
    switchLabel: 'PL',
    occ: 'Ślub jako gość',
    gender: 'Mężczyzna',
    wardrobe: 'Garderoba',
    add: 'Dodaj element',
    saveItem: 'Zapisz element',
    remove: 'Usuń',
    garment: 'Koszula',
    garmentDetail: 'Koszula szczegóły',
    belt: 'Pasek',
    watch: 'Zegarek',
    exclusion: 'Element wyłączony.',
    search: 'Wyszukaj',
    manCard: 'Koszula',
  },
};

for (const [code, L] of Object.entries(LANGS)) {
  test(`${code}: scenario1 welcome selection`, async ({ page }) => {
    await page.goto('/');
    if (L.switchLabel) await page.getByRole('button', { name: L.switchLabel, exact: true }).click();
    await page.getByRole('button', { name: L.occ }).click();
    await page.getByRole('button', { name: L.gender, exact: true }).click();
    await expect(page.getByText(L.garment)).toBeVisible();
  });

  test(`${code}: scenario2 outfit happy path`, async ({ page }) => {
    const welcome = new WelcomePage(page);
    const modal = new GarmentModal(page);
    await welcome.goto();
    if (L.switchLabel) await page.getByRole('button', { name: L.switchLabel, exact: true }).click();
    await welcome.selectOccasion(L.occ);
    await welcome.selectGender(L.gender);
    await page.locator('.card').filter({ hasText: L.garment }).locator('button.svg').click();
    await expect(page.getByText(L.garmentDetail)).toBeVisible();
    await modal.selectColourByProbability();
    await modal.selectPattern(/Stripes|Paski/);
    await modal.selectSecondaryColour();
    await modal.expectSaveEnabled();
    await modal.save();
    await modal.expectSavedSummary();
  });

  test(`${code}: scenario3 optional garment exclusion`, async ({ page }) => {
    const welcome = new WelcomePage(page);
    await welcome.goto();
    if (L.switchLabel) await page.getByRole('button', { name: L.switchLabel, exact: true }).click();
    await welcome.selectOccasion(L.occ);
    await welcome.selectGender(L.gender);
    for (const name of [L.belt, L.watch]) {
      const card = page.locator('.card').filter({ hasText: name });
      const include = card.locator('input[type="checkbox"]');
      if (await include.count()) {
        await include.uncheck();
        await expect(card.getByText(L.exclusion)).toBeVisible();
      }
    }
  });

  test(`${code}: scenario4 wardrobe CRUD`, async ({ page }) => {
    const welcome = new WelcomePage(page);
    const wardrobe = new WardrobePage(page);
    await welcome.goto();
    if (L.switchLabel) await page.getByRole('button', { name: L.switchLabel, exact: true }).click();
    await welcome.selectOccasion(L.occ);
    await welcome.selectGender(L.gender);
    await wardrobe.goFromOutfit();
    await wardrobe.openAddForm();
    await wardrobe.selectGender('man');
    await page.locator('.wardrobe-form .dropdown-trigger').nth(1).click();
    await page.getByRole('button', { name: L.garment, exact: true }).click();
    await wardrobe.saveItem();
    await wardrobe.enterCustomName('TestItem');
    await expect(page.getByText('TestItem')).toBeVisible();
    const search = page.locator('input[type="search"]');
    await search.fill('TestItem');
    await expect(page.getByText('TestItem')).toBeVisible();
    await page.getByRole('button', { name: L.remove }).first().click();
    await expect(page.getByText('TestItem')).toHaveCount(0);
  });

  test(`${code}: scenario5 language switch mid-flow keeps selection`, async ({ page }) => {
    await page.goto('/');
    // start EN
    await page.getByRole('button', { name: 'Wedding (guest)' }).click();
    await page.getByRole('button', { name: 'Man', exact: true }).click();
    await expect(page.getByText('Shirt')).toBeVisible();
    // switch to PL
    await page.getByRole('button', { name: 'PL', exact: true }).click();
    await expect(page.getByText('Koszula')).toBeVisible();
    // switch back to EN
    await page.getByRole('button', { name: 'EN', exact: true }).click();
    await expect(page.getByText('Shirt')).toBeVisible();
  });
  test(`${code}: scenario6 belt/shoes colour mismatch warning`, async ({ page }) => {
    const cfg = code === 'en'
      ? { occ: 'Funeral', gender: 'Man', belt: 'Belt', shoes: 'Shoes', blue: /Blue/, yellow: /Yellow/, warning: /Belt and shoes should usually match in colour/ }
      : { occ: 'Pogrzeb', gender: 'Mężczyzna', belt: 'Pasek', shoes: 'Buty', blue: /Niebieski/, yellow: /Żółty/, warning: /Pasek i buty powinny zwykle pasować kolorem/ };

    await page.goto('/');
    if (code === 'pl') await page.getByRole('button', { name: 'PL', exact: true }).click();
    await page.getByRole('button', { name: cfg.occ }).click();
    await page.getByRole('button', { name: cfg.gender, exact: true }).click();

    await page.locator('.card').filter({ hasText: cfg.belt }).locator('button.svg').click();
    await page.locator('.modal .dropdown-trigger').nth(0).click();
    await expect(page.locator('.modal .dropdown-panel')).not.toContainText(/Loading|Ładowanie/, { timeout: 45000 });
    const beltLow = page.locator('.modal .dropdown-panel', { hasText: /Lower % options|Niższy % dopasowania/ }).locator('button').first();
    const beltColorBtn = page.locator('.modal .dropdown-panel .dropdown-option', { hasText: cfg.blue }).first();
    await Promise.race([
      beltLow.waitFor({ state: 'visible', timeout: 45000 }).catch(() => {}),
      beltColorBtn.waitFor({ state: 'visible', timeout: 45000 }).catch(() => {}),
    ]);
    if (await beltLow.isVisible({ timeout: 1000 }).catch(() => false)) await beltLow.click();
    await beltColorBtn.waitFor({ state: 'visible', timeout: 45000 });
    await beltColorBtn.click();
    await page.locator('.modal .primary').first().click();
    await expect(page.locator('.modal')).toHaveCount(0);

    await page.locator('.card').filter({ hasText: cfg.shoes }).locator('button.svg').click();
    await page.locator('.modal .dropdown-trigger').nth(0).click();
    await expect(page.locator('.modal .dropdown-panel')).not.toContainText(/Loading|Ładowanie/, { timeout: 45000 });
    const shoeLow = page.locator('.modal .dropdown-panel', { hasText: /Lower % options|Niższy % dopasowania/ }).locator('button').first();
    const shoeColorBtn = page.locator('.modal .dropdown-panel .dropdown-option', { hasText: cfg.yellow }).first();
    await Promise.race([
      shoeLow.waitFor({ state: 'visible', timeout: 45000 }).catch(() => {}),
      shoeColorBtn.waitFor({ state: 'visible', timeout: 45000 }).catch(() => {}),
    ]);
    if (await shoeLow.isVisible({ timeout: 1000 }).catch(() => false)) await shoeLow.click();
    await shoeColorBtn.waitFor({ state: 'visible', timeout: 45000 });
    await shoeColorBtn.click();
    await page.locator('.modal .dropdown-trigger').filter({ hasText: /Wybierz|Select/ }).click();
    await expect(page.locator('.modal .dropdown-panel')).not.toContainText(/Loading|Ładowanie/, { timeout: 45000 });
    const typeLow = page.locator('.modal .dropdown-panel', { hasText: /Lower % options|Niższy % dopasowania/ }).locator('button').first();
    if (await typeLow.isVisible({ timeout: 1000 }).catch(() => false)) await typeLow.click();
    await page.locator('.modal .dropdown-panel .dropdown-option').filter({ hasNotText: /Lower % options|Niższy % dopasowania/ }).first().waitFor({ state: 'visible', timeout: 30000 });
    await page.locator('.modal .dropdown-panel .dropdown-option').filter({ hasNotText: /Lower % options|Niższy % dopasowania/ }).first().click();
    await expect(page.locator('.modal .primary').first()).toBeEnabled({ timeout: 30000 });
    await page.locator('.modal .primary').first().click();
    await expect(page.locator('.modal')).toHaveCount(0);

    await page.waitForTimeout(500);
    await expect(page.getByText(cfg.warning)).toBeVisible({ timeout: 15000 });
  });

}

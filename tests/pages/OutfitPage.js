import { expect } from '@playwright/test';

export class OutfitPage {
  constructor(page) {
    this.page = page;
  }

  async expectGarmentVisible(name) {
    await expect(this.page.getByText(name)).toBeVisible();
  }

  async openGarment(name) {
    await this.page.locator('.card').filter({ hasText: name }).locator('button.svg').click();
    await expect(this.page.getByText(`${name} details`)).toBeVisible();
  }

  async goToWardrobe() {
    await this.page.getByRole('button', { name: 'Wardrobe' }).click();
  }

  async openOptionalGarment(name) {
    return this.page.locator('.card').filter({ hasText: name });
  }
}

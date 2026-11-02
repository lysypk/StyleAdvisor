import { expect } from '@playwright/test';

export class WardrobePage {
  constructor(page) {
    this.page = page;
  }

  async goFromOutfit() {
    await this.page.getByRole('button', { name: 'Wardrobe' }).click();
    await expect(this.page.getByText('Wardrobe')).toBeVisible();
  }

  async openAddForm() {
    await this.page.getByRole('button', { name: 'Add item' }).click();
    await expect(this.page.locator('.wardrobe-form')).toBeVisible();
  }

  async selectGender(label) {
    const display = label === 'man' ? 'Man' : label === 'woman' ? 'Woman' : label;
    await this.page.locator('.wardrobe-form .dropdown-trigger').first().click();
    await this.page.getByRole('button', { name: display, exact: true }).click();
  }

  async saveItem() {
    await expect(this.page.getByRole('button', { name: 'Save item', exact: true })).toBeEnabled();
    await this.page.getByRole('button', { name: 'Save item', exact: true }).click();
  }

  async enterCustomName(name) {
    await this.page.locator('.modal input, input[type="text"]').first().fill(name);
    await this.page.getByRole('button', { name: /Save item/ }).last().click();
  }

  async backToOutfit() {
    await this.page.getByRole('button', { name: 'Outfit' }).click();
  }
}

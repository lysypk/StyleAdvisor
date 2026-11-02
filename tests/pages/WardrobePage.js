import { expect } from '@playwright/test';

export class WardrobePage {
  constructor(page) {
    this.page = page;
  }

  async goFromOutfit() {
    await this.page.getByRole('button', { name: 'Wardrobe' }).or(this.page.getByRole('button', { name: 'Garderoba' })).click();
    await expect(this.page.getByText('Wardrobe').or(this.page.getByText('Garderoba'))).toBeVisible();
  }

  async openAddForm() {
    await this.page.getByRole('button', { name: 'Add item' }).or(this.page.getByRole('button', { name: 'Dodaj element' })).click();
    await expect(this.page.locator('.wardrobe-form')).toBeVisible();
  }

  async selectGender(label) {
    await this.page.locator('.wardrobe-form .dropdown-trigger').first().click();
    const labels = label === 'man'
      ? ['Man', 'Mężczyzna']
      : label === 'woman'
        ? ['Woman', 'Kobieta']
        : [label];
    let clicked = false;
    for (const name of labels) {
      const btn = this.page.getByRole('button', { name, exact: true });
      if (await btn.count()) { await btn.click(); clicked = true; break; }
    }
    if (!clicked) throw new Error(`Gender option not found for ${label}`);
  }

  async saveItem() {
    const saveBtn = this.page.getByRole('button', { name: 'Save item', exact: true }).or(this.page.getByRole('button', { name: 'Zapisz element', exact: true }));
    await expect(saveBtn).toBeEnabled();
    await saveBtn.click();
  }

  async enterCustomName(name) {
    await this.page.locator('.modal input, input[type="text"]').first().fill(name);
    await this.page.getByRole('button', { name: /Save item|Zapisz element|Save|Zapisz/ }).last().click();
  }

  async backToOutfit() {
    await this.page.getByRole('button', { name: 'Outfit' }).or(this.page.getByRole('button', { name: 'Stylizacja' })).click();
  }
}

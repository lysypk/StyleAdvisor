import { expect } from '@playwright/test';

export class GarmentModal {
  constructor(page) {
    this.page = page;
  }

  colourTrigger() { return this.page.locator('.modal .dropdown-trigger').nth(0); }
  patternTrigger() { return this.page.locator('.modal .dropdown-trigger').nth(1); }
  secondaryTrigger() { return this.page.locator('.modal .dropdown-trigger').nth(2); }

  async selectColourByProbability() {
    await this.colourTrigger().click();
    await this.page.locator('.dropdown-option').first().click();
  }

  async selectPattern(nameRegex) {
    await this.patternTrigger().click();
    await this.page.locator('.dropdown-option').filter({ hasText: nameRegex }).click();
  }

  async selectSecondaryColour() {
    await this.secondaryTrigger().click();
    await this.page.waitForTimeout(2000);
    await this.page.locator('.dropdown-option').first().click();
  }

  async expectSaveEnabled() {
    const saveBtn = this.page.locator('.modal .primary').filter({ hasText: 'Save' }).first();
    await expect(saveBtn).toBeEnabled();
  }

  async save() {
    const saveBtn = this.page.locator('.modal .primary').filter({ hasText: 'Save' }).first();
    await saveBtn.click();
  }

  async expectSavedSummary() {
    await expect(this.page.locator('.summary').first()).toContainText('Color:');
  }
}

export class WelcomePage {
  constructor(page) {
    this.page = page;
  }
  async goto() {
    await this.page.goto('/');
  }
  async selectOccasion(label) {
    await this.page.getByRole('button', { name: label }).click();
  }
  async selectGender(label) {
    await this.page.getByRole('button', { name: label, exact: true }).click();
  }
}

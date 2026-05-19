import { Page, Locator } from '@playwright/test';
import { config } from '../test.config';

/**
 * Base Page Object with reusable methods for all pages
 * Tailored to the Power Plant app's custom components
 */
export class BasePage {
  readonly page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  // ==================== NAVIGATION ====================

  /**
   * Navigate to a route under the Angular bundle. Builds the full URL from
   * {@link config.frontendUrl} + {@link config.angularBasePath} + path so it
   * works against both:
   *  - Spring-Boot-served prod build (8082 + /angular/browser)
   *  - `ng serve` dev server (4200 + /, when overridden via env)
   *
   * Leading slash on `path` is optional — both `goto('/home')` and
   * `goto('home')` work.
   */
  async goto(path: string) {
    const host = config.frontendUrl.replace(/\/+$/, '');
    const base = config.angularBasePath.replace(/\/+$/, '');
    const route = path.startsWith('/') ? path : '/' + path;
    await this.page.goto(`${host}${base}${route}`);
  }

  async waitForPageLoad() {
    await this.page.waitForLoadState('networkidle');
  }

  async skipOnboarding() {
    const skipButton = this.page.getByRole('button', { name: 'Skip for now' });
    if (await skipButton.isVisible({ timeout: 2000 }).catch(() => false)) {
      await skipButton.click();
    }
  }

  // ==================== FORM INPUTS ====================

  /** All form inputs with .form-input-element class */
  get formInputs(): Locator {
    return this.page.locator('.form-input-element');
  }

  /** Fill the next untouched input field */
  async fillNextUntouchedInput(value: string) {
    const input = this.page.locator('.ng-untouched > .form-input > .form-input-element').first();
    await input.click();
    await input.fill(value);
  }

  /** Fill input by its index (0-based) */
  async fillInputByIndex(index: number, value: string) {
    const input = this.formInputs.nth(index);
    await input.click();
    await input.clear();
    await input.fill(value);
  }

  /** Fill input by formControl name */
  async fillFormControl(name: string, value: string) {
    const input = this.page.locator(`[formcontrolname="${name}"], [name="${name}"]`).first();
    await input.click();
    await input.clear();
    await input.fill(value);
  }

  // ==================== DROPDOWNS ====================

  /** Select from custom dropdown by option text */
  async selectDropdownOption(optionText: string) {
    await this.page.getByText('Select an option').first().click();
    await this.page.getByText(optionText, { exact: true }).click();
  }

  /** Select from custom dropdown by index (1-based) */
  async selectDropdownByIndex(index: number) {
    await this.page.getByText('Select an option').first().click();
    await this.page.locator(`.dropdown-options > div:nth-child(${index})`).click();
  }

  /** Select from value-select component */
  async selectValueOption(optionText: string) {
    await this.page.getByText('Select an option').first().click();
    await this.page.getByText(optionText, { exact: true }).click();
  }

  // ==================== BUTTONS ====================

  async clickButton(name: string | RegExp) {
    await this.page.getByRole('button', { name }).click();
  }

  async clickSave() {
    await this.page.getByRole('button', { name: /save/i }).click();
    await this.waitForLoadingToFinish();
  }

  async clickDelete() {
    await this.page.getByRole('button', { name: /delete/i }).click();
  }

  async confirmDelete() {
    await this.page.getByRole('button', { name: /confirm|yes|ok|delete/i }).last().click();
    await this.waitForLoadingToFinish();
  }

  // ==================== LOADING ====================

  async waitForLoadingToFinish() {
    await this.page.locator('.loading, .processing-overlay, mat-spinner, .spinner').waitFor({ state: 'hidden', timeout: 30000 }).catch(() => {});
    await this.page.waitForTimeout(300);
  }

  // ==================== TABLE ====================

  async getTableRowCount(): Promise<number> {
    return await this.page.locator('table tbody tr, .table-row, .data-row').count();
  }

  async clickTableRow(text: string) {
    await this.page.getByRole('row', { name: new RegExp(text, 'i') }).click();
  }

  async doubleClickTableRow(text: string) {
    await this.page.getByRole('row', { name: new RegExp(text, 'i') }).dblclick();
  }

  async rightClickTableRow(text: string) {
    await this.page.getByRole('row', { name: new RegExp(text, 'i') }).click({ button: 'right' });
  }

  async isRowVisible(text: string): Promise<boolean> {
    return await this.page.getByRole('row', { name: new RegExp(text, 'i') }).isVisible();
  }

  // ==================== CONTEXT MENU ====================

  async clickContextMenuItem(name: string) {
    await this.page.locator('.context-menu, app-context-menu, .cdk-overlay-container').getByText(name, { exact: true }).click();
  }

  // ==================== SEARCH ====================

  async search(text: string) {
    const searchInput = this.page.getByPlaceholder(/search/i);
    await searchInput.clear();
    await searchInput.fill(text);
    await this.waitForLoadingToFinish();
  }

  // ==================== NAVIGATION LINKS ====================

  async clickNavLink(name: string) {
    // Use first() to avoid strict mode violation when multiple links match
    await this.page.getByRole('link', { name: new RegExp(name, 'i') }).first().click();
    await this.waitForPageLoad();
  }

  // ==================== DEBUG ====================

  async screenshot(name: string) {
    await this.page.screenshot({ path: `screenshots/${name}.png`, fullPage: true });
  }

  async pause() {
    await this.page.pause();
  }
}

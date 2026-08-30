import { Page, Locator, expect } from '@playwright/test';

export class LocationPage {
  readonly page: Page;
  
  // Create Location Elements
  readonly createNameInput: Locator;
  readonly createLatInput: Locator;
  readonly createLngInput: Locator;
  readonly createTypeSelect: Locator;
  readonly createBtn: Locator;
  readonly successBadge: Locator;

  // Search Elements
  readonly p1Input: Locator;
  readonly p2Input: Locator;
  readonly searchBtn: Locator;
  readonly searchResultRows: Locator;

  constructor(page: Page) {
    this.page = page;
    
    // Locators mapped to typical form fields (adjust CSS selectors if the actual app differs)
    this.createNameInput = page.getByRole('textbox', { name: 'Name', exact: true });
this.createLatInput = page.getByRole('textbox', { name: 'Latitude', exact: true });
this.createLngInput = page.getByRole('textbox', { name: 'Longitude', exact: true });
    this.createTypeSelect = page.getByRole('combobox').first();
    this.createBtn = page.getByRole('button', { name: 'Create' });
    this.successBadge = page.locator('text=/Created:/i');

    // Bounding Box Search Locators based on the provided screenshot
    this.p1Input = page.getByPlaceholder('e.g. 48.85,2.34');
    this.p2Input = page.getByPlaceholder('e.g. 48.87,2.36');
    this.searchBtn = page.getByRole('button', { name: 'Search' });
    this.searchResultRows = page.locator('table tbody tr');
  }

  async gotoMapTab() {
    await this.page.goto('/');
  }

  async createLocation(name: string, lat: string, lng: string, type: 'STANDARD' | 'PREMIUM') {
    await this.createNameInput.fill(name);
    await this.createLatInput.fill(lat);
    await this.createLngInput.fill(lng);
    await this.createTypeSelect.selectOption(type);
    await this.createBtn.click();
  }

  async searchBoundingBox(p1: string, p2: string) {
    await this.p1Input.fill(p1);
    await this.p2Input.fill(p2);
    await this.searchBtn.click();
  }
}
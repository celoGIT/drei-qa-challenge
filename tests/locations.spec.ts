import { test, expect } from '@playwright/test';
import { LocationPage } from './pages/LocationPage';

test.describe('Geographic Location Service - Core E2E Journeys', () => {
  let locationPage: LocationPage;

  test.beforeEach(async ({ page }) => {
    locationPage = new LocationPage(page);
    await locationPage.gotoMapTab();
  });

  test('CUJ-1: User can create a new standard location', async ({ page }) => {
    const uniqueName = `Test-Node-${Date.now()}`;
    
    // Act: Fill out the creation form
    await locationPage.createLocation(uniqueName, '48.2082', '16.3738', 'STANDARD');
    
    // Assert: Verify the green success badge appears with the UUID
    await expect(locationPage.successBadge).toBeVisible({ timeout: 5000 });
  });

  test('CUJ-2: User can execute a bounding box spatial search', async ({ page }) => {
    // Act: Input diagonal coordinates for the search area
    await locationPage.searchBoundingBox('48.18,16.35', '48.21,16.38');
    
    // Assert: Verify the table populates with at least one result
    await expect(locationPage.searchResultRows.first()).toBeVisible({ timeout: 5000 });
    
    // Assert: Check that the table actually rendered data, not an empty state
    const rowCount = await locationPage.searchResultRows.count();
    expect(rowCount).toBeGreaterThan(0);
  });
});
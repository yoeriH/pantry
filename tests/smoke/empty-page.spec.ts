import { test, expect } from '@playwright/test';

test('page loads and shows the Pantry navigation shell', async ({ page }) => {
  await page.goto('/');

  // Wait for all scripts to finish loading.
  await page.waitForLoadState('networkidle');

  // The root element must be attached.
  const appRoot = page.locator('meal-app-root');
  await expect(appRoot).toBeAttached();

  // The navigation tabs for the main sections must be visible.
  // sl-tab exposes role="tab" — use getByRole so we target the tab buttons specifically.
  const tabTimeout = { timeout: 10_000 };
  await expect(page.getByRole('tab', { name: 'Boodschappen' })).toBeVisible(tabTimeout);
  await expect(page.getByRole('tab', { name: 'Weekmenu' })).toBeVisible(tabTimeout);
  await expect(page.getByRole('tab', { name: 'Voorraad' })).toBeVisible(tabTimeout);
  await expect(page.getByRole('tab', { name: 'Recepten' })).toBeVisible(tabTimeout);
  await expect(page.getByRole('tab', { name: 'Vriezer' })).toBeVisible(tabTimeout);
  await expect(page.getByRole('tab', { name: 'Producten' })).toBeVisible(tabTimeout);
});

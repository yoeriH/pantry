import { test, expect } from '@playwright/test';

test('page loads and shows an empty white shell', async ({ page }) => {
  await page.goto('/');

  const bgColor = await page.evaluate(() => {
    return window.getComputedStyle(document.body).backgroundColor;
  });
  expect(bgColor).toBe('rgb(255, 255, 255)');

  const appRoot = page.locator('meal-app-root');
  await expect(appRoot).toBeAttached();

  const featureKeywords = [
    'meals',
    'pantry',
    'voorraad',
    'boodschappen',
    'shopping list',
    'recipes',
    'weekmenu',
  ];
  for (const keyword of featureKeywords) {
    await expect(page.getByText(keyword, { exact: false })).not.toBeVisible();
  }
});

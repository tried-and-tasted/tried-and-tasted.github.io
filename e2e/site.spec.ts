// Browser smoke tests: the fallback that checks the built site works end to end.
// The logic and recipe data are covered by the unit tests in tests/.
import { readdirSync } from 'node:fs';
import { test as base, devices, expect, type Page } from '@playwright/test';

const recipeIds = readdirSync('recipes').filter((f) => f.endsWith('.yaml')).map((f) => f.replace(/\.yaml$/, ''));

// Fail any test whose page logs a JavaScript error. Font requests are ignored so a
// flaky network to Google Fonts can't fail the build.
const test = base.extend<{ page: Page }>({
  page: async ({ page }, use) => {
    const errors: string[] = [];
    page.on('pageerror', (error) => errors.push(error.message));
    page.on('console', (message) => {
      if (message.type() === 'error' && !/fonts\.(googleapis|gstatic)\.com/.test(message.text())) errors.push(message.text());
    });
    await use(page);
    expect(errors, 'browser console errors').toEqual([]);
  },
});

const cards = (page: Page) => page.locator('.grid li:visible');

test('home page lists every recipe, and search and filters respond', async ({ page }) => {
  await page.goto('/');
  await expect(cards(page)).toHaveCount(recipeIds.length);

  await page.getByPlaceholder('Search by name or ingredient…').fill('kidney beans');
  await expect(cards(page).filter({ hasText: 'Rajma' })).toHaveCount(1);
  await page.getByPlaceholder('Search by name or ingredient…').fill('');

  await page.locator('.chip[data-tag="Soup"]').click();
  const soups = await cards(page).count();
  expect(soups).toBeGreaterThan(0);
  expect(soups).toBeLessThan(recipeIds.length);
});

test('every recipe page is published', async ({ request }) => {
  const missing: string[] = [];
  for (const id of recipeIds) {
    const response = await request.get(`/recipes/${id}/`);
    if (response.status() !== 200 || !(await response.text()).includes('class="ingredients"')) missing.push(id);
  }
  expect(missing).toEqual([]);
});

test('recipe page controls work', async ({ page }) => {
  await page.goto('/recipes/rajma-kidney-bean-curry/');
  const oil = page.locator('.ingredients li', { hasText: 'vegetable oil' });
  await expect(oil.locator('.amount')).toHaveText('30');
  await expect(oil.locator('.equiv')).toHaveText('2 tbsp · 33 ml');

  await page.getByRole('button', { name: 'More servings' }).click();
  await expect(page.locator('#servings')).toHaveText('5');
  await expect(oil.locator('.amount')).toHaveText('38');
  await expect(oil.locator('.equiv')).toHaveText('2½ tbsp · 41 ml');

  const tick = page.locator('.ingredients input[type="checkbox"]').first();
  await tick.check();
  await expect(tick).toBeChecked();

  await page.getByRole('link', { name: '← All recipes' }).click();
  await expect(cards(page)).toHaveCount(recipeIds.length);
});

test('an unknown recipe is a 404', async ({ page }) => {
  // The browser logs the 404 itself as a console error; that is expected here
  page.removeAllListeners('console');
  const response = await page.goto('/recipes/no-such-recipe/');
  expect(response?.status()).toBe(404);
});

test.describe('on a phone', () => {
  // A phone's screen and touch settings; the browser type can't be switched inside a file
  const { defaultBrowserType: _, ...phone } = devices['Pixel 7'];
  test.use(phone);

  test('pages do not scroll sideways', async ({ page }) => {
    for (const path of ['/', '/recipes/butter-chicken/']) {
      await page.goto(path);
      const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
      expect(overflow, `${path} scrolls sideways`).toBeLessThanOrEqual(0);
    }
  });
});

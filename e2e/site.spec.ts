import { readdirSync } from 'node:fs';
import { test as base, expect, type Page } from '@playwright/test';

const recipeFiles = readdirSync('recipes').filter((f) => f.endsWith('.yaml'));

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

async function expectNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth);
  expect(overflow, 'page scrolls sideways').toBeLessThanOrEqual(0);
}

const cards = (page: Page) => page.locator('.grid li:visible');

test.describe('home page', () => {
  test('lists every recipe in the recipes folder', async ({ page }) => {
    await page.goto('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    await expect(cards(page)).toHaveCount(recipeFiles.length);
    await expect(page.locator('#count')).toHaveText(`${recipeFiles.length} recipes`);
    await expectNoHorizontalScroll(page);
  });

  test('search matches titles and ingredients', async ({ page }) => {
    await page.goto('/');
    await page.getByPlaceholder('Search by name or ingredient…').fill('kidney beans');
    await expect(cards(page).filter({ hasText: 'Rajma' })).toHaveCount(1);
    await page.getByPlaceholder('Search by name or ingredient…').fill('zzz no such dish');
    await expect(cards(page)).toHaveCount(0);
    await expect(page.locator('#empty')).toBeVisible();
  });

  test('filters narrow across groups and widen within a group', async ({ page }) => {
    await page.goto('/');
    await page.locator('.chip[data-tag="South Indian"]').click();
    await page.locator('.chip[data-tag="Curry"]').click();
    const southIndianCurries = await cards(page).count();
    expect(southIndianCurries).toBeGreaterThan(0);
    for (const tags of await cards(page).evaluateAll((els) => els.map((el) => JSON.parse((el as HTMLElement).dataset.tags!)))) {
      expect(tags).toEqual(expect.arrayContaining(['South Indian', 'Curry']));
    }
    await page.locator('.chip[data-tag="North Indian"]').click();
    expect(await cards(page).count()).toBeGreaterThan(southIndianCurries);
    await page.locator('.chip[data-tag="South Indian"]').click();
    await page.locator('.chip[data-tag="North Indian"]').click();
    await page.locator('.chip[data-tag="Curry"]').click();
    await expect(cards(page)).toHaveCount(recipeFiles.length);
  });
});

test.describe('recipe pages', () => {
  // One test per recipe file, so a broken recipe is named in the report
  for (const file of recipeFiles) {
    const id = file.replace(/\.yaml$/, '');
    test(`${id} loads`, async ({ page }) => {
      const response = await page.goto(`/recipes/${id}/`);
      expect(response?.status()).toBe(200);
      await expect(page.getByRole('heading', { level: 1 })).not.toBeEmpty();
      expect(await page.locator('.ingredients li').count()).toBeGreaterThan(0);
      expect(await page.locator('.steps li').count()).toBeGreaterThan(0);
      for (const amount of await page.locator('.amount').allTextContents()) {
        expect(amount).toMatch(/^\d*[⅛¼⅓½⅔¾]?(\.\d+)?$/);
        expect(amount).not.toBe('');
      }
    });
  }

  test('servings scaler rescales amounts', async ({ page }) => {
    await page.goto('/recipes/banana-protein-pancakes/');
    const servings = page.locator('#servings');
    const skyr = page.locator('.ingredients li', { hasText: 'Skyr' }).locator('.amount');
    const banana = page.locator('.ingredients li', { hasText: 'banana' }).locator('.amount');
    await expect(servings).toHaveText('1');
    await expect(skyr).toHaveText('60');

    const more = page.getByRole('button', { name: 'More servings' });
    await more.click();
    await more.click();
    await expect(servings).toHaveText('2');
    await expect(skyr).toHaveText('120');
    await expect(banana).toHaveText('2');

    const fewer = page.getByRole('button', { name: 'Fewer servings' });
    await fewer.click();
    await fewer.click();
    await fewer.click();
    await expect(servings).toHaveText('½');
    await expect(skyr).toHaveText('30');
    await expect(banana).toHaveText('½');
    await fewer.click();
    await expect(servings).toHaveText('½');
  });

  // A 1-serving recipe can't tell "× original" from "÷ original", so check one that isn't
  test('servings scaler works from a multi-serving recipe', async ({ page }) => {
    await page.goto('/recipes/butter-chicken/');
    const chicken = page.locator('.ingredients li', { hasText: 'chicken thighs' }).locator('.amount');
    const chilli = page.locator('.ingredients li', { hasText: 'Kashmiri red chilli powder (marinade)' }).locator('.amount');
    await expect(page.locator('#servings')).toHaveText('2');
    await expect(chicken).toHaveText('300');
    await page.getByRole('button', { name: 'More servings' }).click();
    await page.getByRole('button', { name: 'More servings' }).click();
    await expect(page.locator('#servings')).toHaveText('4');
    await expect(chicken).toHaveText('600');
    await expect(chilli).toHaveText('2');
    await page.getByRole('button', { name: 'Fewer servings' }).click();
    await page.getByRole('button', { name: 'Fewer servings' }).click();
    await page.getByRole('button', { name: 'Fewer servings' }).click();
    await expect(page.locator('#servings')).toHaveText('1½');
    await expect(chicken).toHaveText('225');
    await expect(chilli).toHaveText('¾');
  });

  test('oil shows grams, spoons and ml, and rescales', async ({ page }) => {
    await page.goto('/recipes/rajma-kidney-bean-curry/');
    const oil = page.locator('.ingredients li', { hasText: 'vegetable oil' });
    await expect(oil.locator('.amount')).toHaveText('30');
    await expect(oil.locator('.equiv')).toHaveText('2 tbsp · 33 ml');
    await page.getByRole('button', { name: 'Fewer servings' }).click();
    await page.getByRole('button', { name: 'Fewer servings' }).click();
    await page.getByRole('button', { name: 'Fewer servings' }).click();
    await expect(page.locator('#servings')).toHaveText('1½');
    await expect(oil.locator('.amount')).toHaveText('11');
    await expect(oil.locator('.equiv')).toHaveText('2½ tsp · 12 ml');
    // Butter and ghee stay grams-only
    await page.goto('/recipes/butter-chicken/');
    await expect(page.locator('.ingredients li', { hasText: 'butter (gravy)' }).locator('.equiv')).toHaveCount(0);
  });

  test('ingredients can be ticked off', async ({ page }) => {
    await page.goto('/recipes/butter-chicken/');
    const first = page.locator('.ingredients input[type="checkbox"]').first();
    await first.check();
    await expect(first).toBeChecked();
    await first.uncheck();
    await expect(first).not.toBeChecked();
  });

  test('back link returns to the list', async ({ page }) => {
    await page.goto('/recipes/rajma-kidney-bean-curry/');
    await expectNoHorizontalScroll(page);
    await page.getByRole('link', { name: '← All recipes' }).click();
    await expect(cards(page)).toHaveCount(recipeFiles.length);
  });

  test('an unknown recipe is a 404', async ({ page }) => {
    // The browser logs the 404 itself as a console error; that is expected here
    page.removeAllListeners('console');
    const response = await page.goto('/recipes/no-such-recipe/');
    expect(response?.status()).toBe(404);
  });
});

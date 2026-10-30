// @ts-check
import { expect, test } from '@playwright/test';

/**
 * Wait for fonts and already-loaded images so layout assertions reflect the
 * settled page. Lazy covers below the fold are handled by the tests that need
 * them.
 *
 * @param {import('@playwright/test').Page} page
 */
const settle = async (page) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    await Promise.all(
      Array.from(document.images, (image) =>
        image.complete ? image.decode().catch(() => undefined) : Promise.resolve()
      )
    );
  });
};

/**
 * @param {import('@playwright/test').Page} page
 * @returns {string[]}
 */
const consoleErrors = (page) => {
  /** @type {string[]} */
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error') errors.push(message.text());
  });
  page.on('pageerror', (error) => errors.push(error.message));
  return errors;
};

test('home presents the selected project', async ({ page }) => {
  const errors = consoleErrors(page);
  await page.goto('./');
  await settle(page);

  await expect(page).toHaveTitle(/Yutthana/);
  await expect(page.locator('h1')).toContainText('Selected');
  await expect(page.locator('h1')).toContainText('work');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('meta[name="googlebot"]')).toHaveAttribute('content', /noindex/);
  await expect(page.getByRole('heading', { name: 'Selected projects' })).toBeVisible();
  await expect(page.locator('.section-count')).toHaveText('01');
  await expect(page.locator('.project')).toHaveCount(1);

  const covers = page.locator('.project-cover img');
  await expect(covers).toHaveCount(1);
  await expect(covers.nth(0)).toHaveAttribute('loading', 'eager');
  await expect(covers.nth(0)).toHaveAttribute('fetchpriority', 'high');
  await expect(covers.nth(0)).toHaveAttribute('alt', /ครัวตำย่า/);
  await expect(covers.nth(0)).toHaveJSProperty('complete', true);

  const demoLinks = page.getByRole('link', { name: /View the live demo/i });
  await expect(demoLinks).toHaveCount(1);
  await expect(demoLinks.nth(0)).toHaveAttribute('href', '/fastwork-portfolio/krua-tumya/');
  await expect(page.getByRole('link', { name: /Fastwork/i }).first()).toHaveAttribute(
    'href',
    'https://fastwork.com/user/yutna'
  );
  expect(errors).toEqual([]);
});

test('home has no horizontal overflow at the active viewport', async ({ page }) => {
  await page.goto('./');
  await settle(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

test('the home link reaches the ครัวตำย่า project', async ({ page }) => {
  await page.goto('./');
  await settle(page);
  await page.getByRole('link', { name: /View the live demo/i }).first().click();
  await expect(page).toHaveURL(/\/fastwork-portfolio\/krua-tumya\/$/);
  await expect(page.locator('h1')).toContainText('ตำให้');
  await expect(page.locator('.portfolio-return')).toBeVisible();
});

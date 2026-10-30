// @ts-check
import { expect, test } from '@playwright/test';

/**
 * Wait for fonts and already-loaded images so layout assertions reflect the
 * settled page. Lazy images below the fold are handled by the tests that need
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

test('home presents the Krua Tumya work', async ({ page }) => {
  const errors = consoleErrors(page);
  await page.goto('./');
  await settle(page);

  await expect(page).toHaveTitle(/Yutthana/);
  await expect(page.locator('h1')).toContainText('I build fast');
  await expect(page.locator('h1')).toContainText('accessible web apps');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('meta[name="googlebot"]')).toHaveAttribute('content', /noindex/);

  await expect(page.locator('.capabilities .row')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Krua Tumya', exact: true })).toBeVisible();
  await expect(page.locator('.work__cover img')).toHaveAttribute('alt', /Krua Tumya/);
  await expect(page.locator('.work__spec > div')).toHaveCount(3);
  await expect(page.locator('.work__gallery img')).toHaveCount(2);
  await expect(page.locator('.note')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Need a front-end developer?' })).toBeVisible();

  const live = page.getByRole('link', { name: 'Open the live site', exact: true });
  await expect(live).toHaveAttribute('href', '/fastwork-portfolio/krua-tumya/');

  const fastwork = page.getByRole('link', { name: 'Hire me on Fastwork', exact: true }).first();
  await expect(fastwork).toHaveAttribute('href', 'https://fastwork.com/user/yutna');
  await expect(fastwork).toHaveAttribute('target', '_blank');
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

test('the home link reaches the Krua Tumya project', async ({ page }) => {
  await page.goto('./');
  await settle(page);
  await page.getByRole('link', { name: 'Open the live site', exact: true }).click();
  await expect(page).toHaveURL(/\/fastwork-portfolio\/krua-tumya\/$/);
  await expect(page.locator('h1')).toContainText('ตำให้');
  await expect(page.locator('.portfolio-return')).toBeVisible();
});

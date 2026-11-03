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

test('home presents the Krua Tumya work and open-source projects', async ({ page }) => {
  const errors = consoleErrors(page);
  await page.goto('./');
  await settle(page);

  await expect(page).toHaveTitle(/Yutthana/);
  await expect(page.locator('h1')).toContainText('I build web apps');
  await expect(page.locator('h1')).toContainText('that hold up');
  await expect(page.locator('.masthead__role')).toHaveText('Software craftsmanship');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('meta[name="googlebot"]')).toHaveAttribute('content', /noindex/);

  await expect(page.locator('.capabilities .row')).toHaveCount(4);
  await expect(page.getByRole('heading', { name: 'Krua Tumya', exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'What you get' })).toBeVisible();
  await expect(page.locator('.work__shot img')).toHaveAttribute('alt', /Krua Tumya/);
  await expect(page.locator('.work__shot a')).toHaveAttribute('href', '/fastwork-portfolio/krua-tumya/');
  await expect(page.locator('.work__shot a')).toHaveAttribute('target', '_blank');
  await expect(page.locator('.work__shot-overlay')).toHaveText('Open live site');
  await expect(page.locator('.work__spec > div')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'Open source', exact: true })).toBeVisible();
  await expect(page.locator('.open-source__intro')).toContainText('rulebook for code');
  await expect(page.locator('.open-source__group')).toHaveCount(3);
  await expect(page.locator('.open-source .row')).toHaveCount(5);
  await expect(page.locator('.about__body p').nth(1)).toContainText('missing layer');
  await expect(page.locator('.note')).toHaveCount(3);
  await expect(page.getByRole('heading', { name: 'What are you trying to ship?' })).toBeVisible();

  const live = page.getByRole('link', { name: 'View the live project', exact: true });
  await expect(live).toHaveAttribute('href', '/fastwork-portfolio/krua-tumya/');

  const fastwork = page.getByRole('link', { name: 'Hire me on Fastwork', exact: true });
  await expect(fastwork).toHaveCount(2);
  await expect(fastwork.nth(0)).toHaveAttribute('href', 'https://fastwork.com/user/yutna');
  await expect(fastwork.nth(0)).toHaveAttribute('target', '_blank');
  await expect(fastwork.nth(1)).toHaveAttribute('href', 'https://fastwork.com/user/yutna');

  await expect(page.locator('a[href="https://fastwork.com/user/yutna"]')).toHaveCount(3);
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
  await page.getByRole('link', { name: 'View the live project', exact: true }).click();
  await expect(page).toHaveURL(/\/fastwork-portfolio\/krua-tumya\/$/);
  await expect(page.locator('h1')).toContainText('ตำให้');
  await expect(page.locator('.portfolio-return')).toBeVisible();
});

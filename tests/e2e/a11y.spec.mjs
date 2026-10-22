// @ts-check
import AxeBuilder from '@axe-core/playwright';
import { expect, test } from '@playwright/test';

/**
 * @param {import('@playwright/test').Page} page
 */
const settle = async (page) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} path
 */
const analyze = async (page, path) => {
  await page.goto(path);
  await settle(page);
  return analyzeCurrent(page);
};

/**
 * @param {import('@playwright/test').Page} page
 */
const analyzeCurrent = async (page) =>
  new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();

/**
 * @param {import('axe-core').AxeResults['violations']} violations
 */
const seriousViolations = (violations) =>
  violations.filter((violation) => violation.impact === 'serious' || violation.impact === 'critical');

test('home has no serious or critical WCAG A/AA violations', async ({ page }) => {
  const results = await analyze(page, './');
  expect(seriousViolations(results.violations), JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test('the project page keeps only the demo palette contrast exceptions', async ({ page }) => {
  const results = await analyze(page, 'krua-tumya/');
  const serious = seriousViolations(results.violations);

  // The source demo fixes its chili/paper palette. Six small labels land at
  // 4.42:1 instead of 4.5:1. Changing those colours would break the "exact
  // demo" constraint, so we allow only those known targets and fail on any new
  // contrast issue or any other serious/critical violation.
  const allowedSelectors = ['.section-num', '.closed-stamp', '.footer-tagline'];
  const contrast = serious.find((violation) => violation.id === 'color-contrast');
  const unexpected = contrast
    ? contrast.nodes.filter(
        (node) =>
          !allowedSelectors.some((selector) =>
            node.target.some((target) => String(target).includes(selector))
          )
      )
    : [];

  expect(unexpected, JSON.stringify(contrast?.nodes ?? [], null, 2)).toEqual([]);

  const otherSerious = serious.filter((violation) => violation.id !== 'color-contrast');
  expect(otherSerious, JSON.stringify(otherSerious, null, 2)).toEqual([]);
});

test('the Chiang Khan page has no WCAG A/AA exceptions', async ({ page }) => {
  const results = await analyze(page, 'chiang-khan/');
  expect(seriousViolations(results.violations), JSON.stringify(results.violations, null, 2)).toEqual([]);
});

test('the completed Chiang Khan passport and a selected plan have no WCAG A/AA exceptions', async ({ page }) => {
  await page.goto('chiang-khan/');
  await settle(page);
  for (const id of ['alms', 'street', 'coffee', 'temple', 'kaeng']) {
    await page.locator(`[data-stamp="${id}"]`).click();
  }
  await expect(page.locator('#ckPassportComplete')).toBeVisible();
  await expect
    .poll(async () =>
      page
        .locator('.ck-stamp--passport')
        .evaluateAll((elements) => elements.every((element) => getComputedStyle(element).opacity === '1'))
    )
    .toBe(true);

  for (const id of ['alms', 'coffee', 'temple']) {
    await page.locator(`[data-plan-chip="${id}"]`).click();
  }
  await expect(page.locator('#ckSummary')).toBeVisible();
  // Let the stamp and chip colour transitions settle before auditing.
  await page.waitForTimeout(400);

  const results = await analyzeCurrent(page);
  expect(seriousViolations(results.violations), JSON.stringify(results.violations, null, 2)).toEqual([]);
});

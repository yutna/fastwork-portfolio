// @ts-check
import { expect, test } from '@playwright/test';

/**
 * @param {import('@playwright/test').Page} page
 */
const openFresh = async (page) => {
  await page.goto('krua-tumya/');
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
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

test('the project is the demo plus a portfolio return link', async ({ page }) => {
  const errors = consoleErrors(page);
  await openFresh(page);

  await expect(page).toHaveTitle('ครัวตำย่า — ตำให้ตำใจ ตั้งแต่ปี 2515');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('meta[name="googlebot"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('.portfolio-return')).toBeVisible();
  await expect(page.locator('.portfolio-return')).toHaveAttribute('href', '/fastwork-portfolio/');
  await expect(page.locator('.portfolio-return')).toHaveText('← Portfolio');

  await expect(page.locator('#heatName')).toHaveText('แซ่บจริง');
  await expect(page.locator('#shuValue')).toHaveText('12,000');
  await expect(page.locator('#chiliCount')).toHaveText('5');
  await expect(page.locator('#buildDishName')).toHaveText('ตำไทย');
  await expect(page.locator('#buildTotal')).toHaveText('฿60');
  await expect(page.locator('#gaugeNeedle')).toHaveAttribute('style', /rotate\(0deg\)/);
  expect(errors).toEqual([]);
});

test('the heat meter, chili stepper, and standard preset stay in sync', async ({ page }) => {
  await openFresh(page);

  await page.locator('.heat-btn[data-heat="5"]').click();
  await expect(page.locator('#heatName')).toHaveText('ย่าห้ามไว้');
  await expect(page.locator('#shuValue')).toHaveText('80,000');
  await expect(page.locator('#chiliCount')).toHaveText('10');
  await expect(page.locator('#heatRange')).toHaveAttribute('aria-valuetext', /ระดับ 5/);

  await page.locator('#chiliPlus').click();
  await expect(page.locator('#chiliCount')).toHaveText('11');
  await page.locator('#chiliMinus').click();
  await expect(page.locator('#chiliCount')).toHaveText('10');

  await page.locator('#grandmaStandard').click();
  await expect(page.locator('#heatName')).toHaveText('แซ่บจริง');
  await expect(page.locator('#chiliCount')).toHaveText('5');
  await expect(page.locator('#toast')).toContainText('ย่าจัดชุดมาตรฐานให้แล้ว');
});

test('dish, taste, toppings, quantity, and the confirmation flow update the order', async ({ page }) => {
  await openFresh(page);

  await page.locator('label.pick-card:has(input[name="dish"][value="crab"])').click();
  await expect(page.locator('#buildDishName')).toHaveText('ตำปูปลาร้า');
  await expect(page.locator('#buildTotal')).toHaveText('฿75');

  await page.locator('label.topping-row:has(input[name="topping"][value="egg"])').click();
  await expect(page.locator('#buildExtrasLine')).toHaveText('+ ไข่เค็ม');
  await expect(page.locator('#buildToppingsPrice')).toHaveText('฿20');
  await expect(page.locator('#buildTotal')).toHaveText('฿95');

  await page.locator('#qtyPlus').click();
  await page.locator('#qtyPlus').click();
  await expect(page.locator('#qtyValue')).toHaveText('3');
  await expect(page.locator('#orderQtyLine')).toHaveText('3 จาน');
  await expect(page.locator('#orderTotal')).toHaveText('฿285');

  await page.locator('#confirmPlate').click();
  await expect(page.locator('#confirmDialog')).toHaveAttribute('open', '');
  await expect(page.locator('#confirmDish')).toHaveText('ตำปูปลาร้า · ฿75');
  await expect(page.locator('#confirmTotal')).toHaveText('฿285');
  await page.locator('#confirmSubmit').click();
  await expect(page.locator('#confirmDialog')).not.toHaveAttribute('open', '');
  await expect(page.locator('#successDialog')).toHaveAttribute('open', '');
  await page.locator('#successClose').click();
});

test('the chosen plate survives a reload', async ({ page }) => {
  await openFresh(page);

  await page.locator('.heat-btn[data-heat="4"]').click();
  await page.locator('label.pick-card:has(input[name="dish"][value="larb"])').click();
  await page.locator('label.topping-row:has(input[name="topping"][value="plara"])').click();
  await page.locator('#qtyPlus').click();

  await page.reload();
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#heatName')).toHaveText('น้ำตาซึม');
  await expect(page.locator('#buildDishName')).toHaveText('ลาบหมู');
  await expect(page.locator('#buildExtrasLine')).toHaveText('+ น้ำปลาร้าเพิ่ม');
  await expect(page.locator('#qtyValue')).toHaveText('2');
});

test('the project has no horizontal overflow at the active viewport', async ({ page }) => {
  await openFresh(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

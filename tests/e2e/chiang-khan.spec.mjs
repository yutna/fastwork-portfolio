// @ts-check
import { expect, test } from '@playwright/test';

const STOP_IDS = ['alms', 'street', 'coffee', 'temple', 'kaeng'];

/**
 * @param {import('@playwright/test').Page} page
 */
const openFresh = async (page) => {
  await page.goto('chiang-khan/');
  await page.evaluate(() => {
    localStorage.clear();
    history.replaceState(null, '', location.pathname);
  });
  await page.reload({ waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 */
const stamp = (page, id) => page.locator(`[data-stamp="${id}"]`);

/**
 * @param {import('@playwright/test').Page} page
 */
const stampAll = async (page) => {
  for (const id of STOP_IDS) await stamp(page, id).click();
};

/**
 * @param {import('@playwright/test').Page} page
 * @param {string} id
 */
const planChip = (page, id) => page.locator(`[data-plan-chip="${id}"]`);

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

test('the page presents the campaign, five stops, planner, passport, and six answers', async ({ page }) => {
  const errors = consoleErrors(page);
  await openFresh(page);

  await expect(page).toHaveTitle('เชียงคาน — ตื่นเช้าให้ทัน');
  await expect(page.locator('meta[name="robots"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('meta[name="googlebot"]')).toHaveAttribute('content', /noindex/);
  await expect(page.locator('h1')).toContainText('ตื่นเช้า');
  await expect(page.locator('h1')).toContainText('ให้ทัน');
  await expect(page.locator('#ckStampStatus')).toHaveText('ประทับแล้ว 0/5');
  await expect(page.locator('#ckPlanCount')).toHaveText('0/5');
  await expect(page.locator('#ckPassportCount')).toHaveText('0/5');
  await expect(page.locator('.ck-stop')).toHaveCount(5);
  await expect(page.locator('.ck-stamp-btn')).toHaveCount(5);
  await expect(page.locator('.ck-passport__slot')).toHaveCount(5);
  await expect(page.locator('.ck-travel-card')).toHaveCount(3);
  await expect(page.locator('.ck-faq__item')).toHaveCount(6);
  await expect(page.locator('#ckPassportComplete')).toBeHidden();
  await expect(page.locator('#ckPassportEmptyNote')).toBeVisible();
  await expect(page.locator('#ckSavePlan')).toBeDisabled();
  await expect(page.locator('.portfolio-return')).toHaveAttribute('href', '/fastwork-portfolio/');
  await expect(page.locator('.portfolio-return')).toContainText('Portfolio');

  const fonts = await page.evaluate(() => ({
    kanit: document.fonts.check('800 48px Kanit'),
    anuphan: document.fonts.check('400 16px Anuphan'),
    mali: document.fonts.check('400 16px Mali')
  }));
  expect(fonts).toEqual({ kanit: true, anuphan: true, mali: true });
  expect(errors).toEqual([]);
});

test('stamps update the header, card, passport, storage, and share hash', async ({ page }) => {
  await openFresh(page);

  await stamp(page, 'alms').click();
  await expect(page.locator('#ckStampStatus')).toHaveText('ประทับแล้ว 1/5');
  await expect(stamp(page, 'alms')).toHaveAttribute('aria-pressed', 'true');
  await expect(stamp(page, 'alms')).toHaveAccessibleName(/ยกเลิกตราประทับ/);
  await expect(page.locator('.ck-stop[data-stop="alms"] [data-stamp-mark="alms"]')).toBeVisible();
  await expect(page.locator('[data-passport-slot="alms"]')).toHaveAttribute('data-stamped', 'true');
  await expect(page.locator('[data-passport-slot="alms"] [data-slot-status]')).toHaveText('ประทับแล้ว');
  await expect(page).toHaveURL(/#stamps=alms$/);

  await stamp(page, 'street').click();
  await stamp(page, 'coffee').click();
  await expect(page.locator('#ckStampStatus')).toHaveText('ประทับแล้ว 3/5');
  await expect(page.locator('.ck-passport__slot[data-stamped="true"]')).toHaveCount(3);
  await expect(page.locator('#ckPassportComplete')).toBeHidden();
  await expect(page).toHaveURL(/#stamps=alms,street,coffee$/);

  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('chiangKhan.demo.v1') ?? 'null')
  );
  expect(stored).toMatchObject({ version: 1, stamps: ['alms', 'street', 'coffee'], saved: null });

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#ckStampStatus')).toHaveText('ประทับแล้ว 3/5');
  await expect(page.locator('.ck-passport__slot[data-stamped="true"]')).toHaveCount(3);

  await stamp(page, 'alms').click();
  await expect(page.locator('#ckStampStatus')).toHaveText('ประทับแล้ว 2/5');
  await expect(page.locator('[data-passport-slot="alms"]')).toHaveAttribute('data-stamped', 'false');
  await expect(page.locator('[data-passport-slot="alms"] [data-slot-status]')).toHaveText('ยังไม่ได้ประทับ');
  await expect(page).toHaveURL(/#stamps=street,coffee$/);
});

test('the planner requires three stops and saves an explicit snapshot', async ({ page }) => {
  await openFresh(page);
  await page.locator('#planner').scrollIntoViewIfNeeded();

  await planChip(page, 'alms').click();
  await expect(page.locator('#ckPlanCount')).toHaveText('1/5');
  await expect(page.locator('#ckSavePlan')).toBeDisabled();
  await expect(page.locator('#ckPlanMessage')).toContainText('เลือกอีก 2 หมุด');
  await expect(page.locator('#ckSummary')).toBeVisible();
  await expect(page.locator('#ckSummaryTotal')).toHaveText('430 บาท / คน');

  await planChip(page, 'coffee').click();
  await expect(page.locator('#ckPlanCount')).toHaveText('2/5');
  await expect(page.locator('#ckSavePlan')).toBeDisabled();
  await expect(page.locator('#ckPlanMessage')).toContainText('เลือกอีก 1 หมุด');
  await expect(page.locator('#ckSummaryTotal')).toHaveText('610 บาท / คน');

  await planChip(page, 'temple').click();
  await expect(page.locator('#ckPlanCount')).toHaveText('3/5');
  await expect(page.locator('#ckSavePlan')).toBeEnabled();
  await expect(page.locator('#ckPlanMessage')).toContainText('เลือกแล้ว 3 จาก 5 หมุด');
  await expect(page.locator('#ckSummaryTime')).toHaveText('เวลารวมโดยประมาณ 2 ชม. 30 น.');
  await expect(page.locator('#ckSummaryTotal')).toHaveText('630 บาท / คน');
  await expect(page.locator('.ck-day')).toHaveCount(2);
  await expect(page.locator('.ck-day__slots > li')).toHaveCount(6);
  await expect(page.locator('.ck-slot--note')).toHaveCount(3);
  await expect(page.locator('#ckSaveNote')).toHaveText('ยังไม่มีแผนที่บันทึก — กดบันทึกเพื่อเก็บไว้');

  await page.locator('#ckSavePlan').click();
  await expect(page.locator('#ckPlanMessage')).toContainText('บันทึกแผนนี้แล้ว');
  await expect(page.locator('#ckSaveNote')).toHaveText('บันทึกแล้ว · แผนนี้จะอยู่ต่อหลังรีเฟรช');
  const stored = await page.evaluate(() =>
    JSON.parse(localStorage.getItem('chiangKhan.demo.v1') ?? 'null')
  );
  expect(stored.saved).toEqual(['alms', 'coffee', 'temple']);

  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#ckPlanCount')).toHaveText('3/5');
  await expect(page.locator('input[data-plan-stop][value="alms"]')).toBeChecked();
  await expect(page.locator('input[data-plan-stop][value="coffee"]')).toBeChecked();
  await expect(page.locator('input[data-plan-stop][value="temple"]')).toBeChecked();
  await expect(page.locator('#ckSummaryTotal')).toHaveText('630 บาท / คน');
  await expect(page.locator('#ckSaveNote')).toHaveText('บันทึกแล้ว · แผนนี้จะอยู่ต่อหลังรีเฟรช');

  await planChip(page, 'kaeng').click();
  await expect(page.locator('#ckPlanCount')).toHaveText('4/5');
  await expect(page.locator('#ckSaveNote')).toHaveText('มีการเปลี่ยนแปลงที่ยังไม่บันทึก');
  await page.reload({ waitUntil: 'networkidle' });
  await expect(page.locator('#ckPlanCount')).toHaveText('3/5');
  await expect(page.locator('input[data-plan-stop][value="kaeng"]')).not.toBeChecked();
});

test('the random plan picks a valid three-to-five stop draft', async ({ page }) => {
  await openFresh(page);
  await page.locator('#planner').scrollIntoViewIfNeeded();
  await page.locator('#ckRandomPlan').click();
  await expect(page.locator('#ckPlanCount')).toHaveText(/^[3-5]\/5$/);
  const count = await page.locator('input[data-plan-stop]:checked').count();
  expect(count).toBeGreaterThanOrEqual(3);
  expect(count).toBeLessThanOrEqual(5);
  await expect(page.locator('#ckSavePlan')).toBeEnabled();
  await expect(page.locator('#ckSummary')).toBeVisible();
  await expect(page.locator('.ck-day')).toHaveCount(2);
});

test('a share URL restores stamps in a fresh context and copies the link', async ({ page, browser }) => {
  await openFresh(page);
  await stampAll(page);

  await expect(page.locator('#ckStampStatus')).toHaveText('ประทับแล้ว 5/5');
  await expect(page.locator('#ckPassportComplete')).toBeVisible();
  await expect(page.locator('#ckPassportEmptyNote')).toBeHidden();
  await expect(page.locator('.ck-passport__slot[data-stamped="true"]')).toHaveCount(5);
  await expect(page).toHaveURL(/#stamps=alms,street,coffee,temple,kaeng$/);

  await page.context().grantPermissions(['clipboard-read', 'clipboard-write']);
  await page.locator('#ckShare').click();
  await expect(page.locator('#ckShareStatus')).toHaveText('คัดลอกลิงก์แชร์แล้ว');
  const copied = await page.evaluate(() => navigator.clipboard.readText());
  expect(copied).toContain('#stamps=alms,street,coffee,temple,kaeng');

  const viewport = page.viewportSize();
  const sharedContext = await browser.newContext(viewport ? { viewport } : {});
  const sharedPage = await sharedContext.newPage();
  await sharedPage.goto(page.url(), { waitUntil: 'networkidle' });
  await sharedPage.evaluate(() => document.fonts.ready);
  await expect(sharedPage.locator('#ckStampStatus')).toHaveText('ประทับแล้ว 5/5');
  await expect(sharedPage.locator('.ck-passport__slot[data-stamped="true"]')).toHaveCount(5);
  await expect(sharedPage.locator('#ckPassportComplete')).toBeVisible();
  await expect(sharedPage).toHaveURL(/#stamps=alms,street,coffee,temple,kaeng$/);
  const sharedStored = await sharedPage.evaluate(() =>
    JSON.parse(localStorage.getItem('chiangKhan.demo.v1') ?? 'null')
  );
  expect(sharedStored.stamps).toEqual(STOP_IDS);
  await sharedContext.close();
});

test('print media keeps the completed passport and hides site chrome', async ({ page }) => {
  await openFresh(page);
  await stampAll(page);
  await page.emulateMedia({ media: 'print' });

  await expect(page.locator('.ck-header')).toBeHidden();
  await expect(page.locator('.ck-hero')).toBeHidden();
  await expect(page.locator('.ck-stops')).toBeHidden();
  await expect(page.locator('.ck-planner')).toBeHidden();
  await expect(page.locator('.ck-travel')).toBeHidden();
  await expect(page.locator('.ck-faq')).toBeHidden();
  await expect(page.locator('.ck-footer')).toBeHidden();
  await expect(page.locator('.portfolio-return')).toBeHidden();
  await expect(page.locator('.ck-passport')).toBeVisible();
  await expect(page.locator('.ck-passport__cover')).toBeVisible();
  await expect(page.locator('.ck-passport__complete')).toBeVisible();
  await expect(page.locator('.ck-passport__complete-actions')).toBeHidden();
  await expect(page.locator('.ck-passport__empty-note')).toBeHidden();
});

test('reduced motion stops the ticker and leaves one static line', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await openFresh(page);
  const ticker = await page.locator('.ck-ticker__track').evaluate((element) => ({
    animation: getComputedStyle(element).animationName,
    display: getComputedStyle(element).display
  }));
  expect(ticker.animation).toBe('none');
  await expect(page.locator('.ck-ticker__track > span').nth(1)).toBeHidden();
});

test('the skip link lands below the sticky header', async ({ page }) => {
  await openFresh(page);
  await page.keyboard.press('Tab');
  await expect(page.locator('.ck-skip')).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#main$/);

  const headerHeight = await page
    .locator('.ck-header')
    .evaluate((element) => element.getBoundingClientRect().height);
  await expect
    .poll(async () =>
      page.locator('#main').evaluate((element) => element.getBoundingClientRect().top)
    )
    .toBeGreaterThanOrEqual(headerHeight - 1);

  await page.keyboard.press('Tab');
  await expect(page.locator('.ck-hero .ck-btn--gold')).toBeFocused();
});

test('the fixed return link clears the passport share action', async ({ page }) => {
  await openFresh(page);
  await stampAll(page);
  await page.locator('#ckShare').scrollIntoViewIfNeeded();
  await page.evaluate(() => {
    const share = document.querySelector('#ckShare');
    if (share === null) return;
    const rect = share.getBoundingClientRect();
    window.scrollBy(0, rect.bottom - window.innerHeight + 8);
  });

  const boxes = await page.evaluate(() => {
    const back = document.querySelector('.portfolio-return')?.getBoundingClientRect();
    const share = document.querySelector('#ckShare')?.getBoundingClientRect();
    return {
      back: back ? { x: back.x, y: back.y, width: back.width, height: back.height } : null,
      share: share ? { x: share.x, y: share.y, width: share.width, height: share.height } : null
    };
  });

  expect(boxes.back).not.toBeNull();
  expect(boxes.share).not.toBeNull();
  if (boxes.back === null || boxes.share === null) return;

  const overlaps =
    boxes.back.x < boxes.share.x + boxes.share.width &&
    boxes.back.x + boxes.back.width > boxes.share.x &&
    boxes.back.y < boxes.share.y + boxes.share.height &&
    boxes.back.y + boxes.back.height > boxes.share.y;
  expect(overlaps).toBe(false);
});

test('the page has no horizontal overflow at the active viewport', async ({ page }) => {
  await openFresh(page);
  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth
  );
  expect(overflow).toBeLessThanOrEqual(1);
});

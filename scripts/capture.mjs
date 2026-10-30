// @ts-check
/**
 * Capture the desktop and mobile audit screenshots for every page.
 *
 * The script starts its own static preview on the production base path so it
 * works without a separate terminal. Output stays under artifacts/, which is
 * ignored by git.
 */

import { spawn } from 'node:child_process';
import { mkdir, writeFile } from 'node:fs/promises';
import { resolve } from 'node:path';
import { chromium } from 'playwright';

const PORT = 4011;
const BASE = `http://127.0.0.1:${PORT}/fastwork-portfolio`;
const OUTPUT = resolve('artifacts/screenshots');

/**
 * @param {string} url
 * @returns {Promise<boolean>}
 */
const reachable = async (url) => {
  try {
    const response = await fetch(url);
    return response.ok;
  } catch {
    return false;
  }
};

/**
 * @returns {Promise<import('node:child_process').ChildProcess | null>}
 */
const startPreview = async () => {
  if (await reachable(`${BASE}/`)) return null;

  const server = spawn(
    process.execPath,
    ['scripts/serve-site.mjs', '--port', String(PORT), '--root', '_site', '--base', '/fastwork-portfolio'],
    { stdio: 'ignore' }
  );

  for (let attempt = 0; attempt < 60; attempt += 1) {
    await new Promise((resolveDelay) => setTimeout(resolveDelay, 100));
    if (await reachable(`${BASE}/`)) return server;
  }

  server.kill('SIGTERM');
  throw new Error('The preview server did not start. Run `npm run build` first.');
};

/**
 * @param {import('playwright').Page} page
 */
const settle = async (page) => {
  await page.waitForLoadState('networkidle');
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(async () => {
    const step = Math.max(window.innerHeight, 320);
    for (let y = 0; y < document.body.scrollHeight; y += step) {
      window.scrollTo(0, y);
      await new Promise((resolve) => setTimeout(resolve, 80));
    }
    window.scrollTo(0, 0);
  });
  await page.waitForLoadState('networkidle');
  await page.evaluate(async () => {
    await Promise.all(Array.from(document.images, (image) => image.decode().catch(() => undefined)));
  });
  await page.waitForTimeout(250);
};

const server = await startPreview();
const browser = await chromium.launch();

try {
  await mkdir(OUTPUT, { recursive: true });
  const captures = [];
  /** @type {ReadonlyArray<readonly [string, number, number]>} */
  const viewports = [
    ['desktop', 1440, 1000],
    ['mobile', 390, 844]
  ];

  for (const [name, width, height] of viewports) {
    const context = await browser.newContext({
      viewport: { width, height },
      deviceScaleFactor: 1,
      reducedMotion: 'reduce',
      isMobile: name === 'mobile',
      hasTouch: name === 'mobile'
    });
    const page = await context.newPage();

    for (const [pageName, path] of [
      ['home', ''],
      ['krua-tumya', 'krua-tumya/']
    ]) {
      await page.goto(`${BASE}/${path}`, { waitUntil: 'networkidle' });
      await settle(page);

      const viewportPath = `${OUTPUT}/${pageName}-${name}.png`;
      const fullPath = `${OUTPUT}/${pageName}-${name}-full.png`;
      await page.screenshot({ path: viewportPath, animations: 'disabled' });
      await page.screenshot({ path: fullPath, fullPage: true, animations: 'disabled' });
      captures.push({ page: pageName, viewport: name, width, height, viewportPath, fullPath });
      console.log(`captured ${viewportPath}`);
      console.log(`captured ${fullPath}`);
    }

    await context.close();
  }

  await writeFile(`${OUTPUT}/manifest.json`, `${JSON.stringify(captures, null, 2)}\n`);
} finally {
  await browser.close();
  server?.kill('SIGTERM');
}

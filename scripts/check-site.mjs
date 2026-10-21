// @ts-check
/**
 * Production checks that do not need a browser:
 * - every page carries a noindex directive
 * - titles, descriptions, language, and image alt text are present
 * - every internal link, stylesheet, script, image, and srcset target exists
 * - robots.txt and .nojekyll are in the artifact
 * - no unresolved Liquid or PHP reaches the output
 */

import { readdir, readFile, stat } from 'node:fs/promises';
import { extname, join, relative, resolve } from 'node:path';
import { load } from 'cheerio';

const SITE = resolve('_site');
const BASE = '/fastwork-portfolio';
const ORIGIN = 'https://yutna.github.io';
/** @type {string[]} */
const failures = [];
/** @type {string[]} */
const pages = [];

/**
 * @param {string} directory
 * @returns {Promise<string[]>}
 */
const walk = async (directory) => {
  /** @type {string[]} */
  const files = [];
  const entries = await readdir(directory, { withFileTypes: true });
  for (const entry of entries) {
    const path = join(directory, entry.name);
    if (entry.isDirectory()) files.push(...(await walk(path)));
    else files.push(path);
  }
  return files;
};

/**
 * @param {string} message
 */
const fail = (message) => {
  failures.push(message);
};

/**
 * @param {string} path
 * @returns {Promise<boolean>}
 */
const exists = async (path) => {
  try {
    const info = await stat(path);
    return info.isFile();
  } catch {
    return false;
  }
};

/**
 * Resolve an internal URL to a file in _site. Returns null for external URLs
 * and anchors, and marks the target missing when it does not exist.
 *
 * @param {string} raw
 * @param {string} pageFile
 * @param {string} label
 * @returns {Promise<void>}
 */
const checkInternalUrl = async (raw, pageFile, label) => {
  const value = raw.trim();
  if (!value || value.startsWith('#') || value.startsWith('mailto:') || value.startsWith('tel:')) return;
  if (value.startsWith('data:') || value.startsWith('//')) return;

  const pageUrl = new URL(`${BASE}/${relative(SITE, pageFile).replaceAll('\\', '/')}`, ORIGIN);
  let url;
  try {
    url = new URL(value, pageUrl);
  } catch {
    fail(`${label}: invalid URL ${value}`);
    return;
  }

  if (url.origin !== ORIGIN) {
    if (url.protocol === 'http:') fail(`${label}: mixed-content URL ${value}`);
    return;
  }

  if (!url.pathname.startsWith(`${BASE}/`) && url.pathname !== BASE) {
    fail(`${label}: internal URL escapes the project base: ${value}`);
    return;
  }

  const relativePath = decodeURIComponent(url.pathname.slice(BASE.length));
  let target = join(SITE, relativePath);
  if (url.pathname.endsWith('/')) target = join(target, 'index.html');

  if (!(await exists(target)) && extname(target) === '') {
    if (await exists(`${target}.html`)) target = `${target}.html`;
  }

  if (!(await exists(target))) {
    fail(`${label}: missing target ${value}`);
  }
};

/**
 * @param {string} file
 */
const checkPage = async (file) => {
  const raw = await readFile(file, 'utf8');
  const $ = load(raw);
  const label = relative(SITE, file);

  if (raw.includes('{{') || raw.includes('{%') || raw.includes('<?php') || raw.includes('<?=')) {
    fail(`${label}: unresolved template or PHP syntax`);
  }

  if ($('meta[name="robots"]').attr('content')?.includes('noindex') !== true) {
    fail(`${label}: missing noindex robots meta`);
  }

  if (!$('title').text().trim()) fail(`${label}: missing title`);
  if (!$('meta[name="description"]').attr('content')?.trim()) fail(`${label}: missing description`);
  if (!$('html').attr('lang')?.trim()) fail(`${label}: missing html lang`);

  const ids = new Map();
  $('[id]').each((_, element) => {
    const id = $(element).attr('id');
    if (!id) return;
    if (ids.has(id)) fail(`${label}: duplicate id #${id}`);
    ids.set(id, true);
  });

  $('img').each((_, element) => {
    const src = $(element).attr('src');
    if (!src) fail(`${label}: image without src`);
    if ($(element).attr('alt') === undefined) fail(`${label}: image without alt: ${src ?? '(unknown)'}`);
  });

  const targets = [
    ...$('a[href]').map((_, element) => ({ value: $(element).attr('href'), kind: 'link' })).get(),
    ...$('link[href]').map((_, element) => ({ value: $(element).attr('href'), kind: 'link' })).get(),
    ...$('script[src]').map((_, element) => ({ value: $(element).attr('src'), kind: 'script' })).get(),
    ...$('img[src]').map((_, element) => ({ value: $(element).attr('src'), kind: 'image' })).get(),
    ...$('source[src]').map((_, element) => ({ value: $(element).attr('src'), kind: 'source' })).get()
  ];
  /** @type {string[]} */
  const srcsetTargets = [];

  for (const target of targets) {
    if (target.value) await checkInternalUrl(target.value, file, `${label} ${target.kind}`);
  }

  $('img[srcset], source[srcset]').each((_, element) => {
    const srcset = $(element).attr('srcset') ?? '';
    for (const candidate of srcset.split(',')) {
      const value = candidate.trim().split(/\s+/)[0];
      if (value) srcsetTargets.push(value);
    }
  });

  for (const value of srcsetTargets) await checkInternalUrl(value, file, `${label} srcset`);

  $('a[target="_blank"]').each((_, element) => {
    const rel = $(element).attr('rel') ?? '';
    if (!rel.split(/\s+/).includes('noopener')) {
      fail(`${label}: target=_blank without rel=noopener: ${$(element).attr('href') ?? '(no href)'}`);
    }
  });

  pages.push(label);
};

const allFiles = await walk(SITE);
const htmlFiles = allFiles.filter((file) => file.endsWith('.html'));
await Promise.all(htmlFiles.map(checkPage));

if (pages.length === 0) fail('no HTML pages were built');
if (!(await exists(join(SITE, 'robots.txt')))) {
  fail('missing robots.txt');
} else {
  const robots = await readFile(join(SITE, 'robots.txt'), 'utf8');
  if (!/User-agent:\s*\*/i.test(robots) || !/Disallow:\s*\//i.test(robots)) {
    fail('robots.txt does not disallow every crawler');
  }
}
if (!(await exists(join(SITE, '.nojekyll')))) fail('missing .nojekyll');

if (failures.length) {
  console.error(`Static checks failed (${failures.length}):`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}

console.log(`Static checks passed: ${pages.length} pages, ${allFiles.length} files.`);

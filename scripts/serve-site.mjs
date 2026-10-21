// @ts-check
/**
 * Preview the built site at its production base path.
 *
 * GitHub Pages serves this project from /fastwork-portfolio/, so the local
 * preview must do the same. A plain static file server at the root would make
 * every absolute URL in the build point at the wrong place.
 */

import { createServer } from 'node:http';
import { createReadStream } from 'node:fs';
import { stat } from 'node:fs/promises';
import { extname, join, normalize, resolve, sep } from 'node:path';

/** @param {string[]} argv */
const readArgs = (argv) => {
  /** @type {{ port: number, root: string, base: string, host: string }} */
  const options = { port: 4001, root: '_site', base: '/fastwork-portfolio', host: '127.0.0.1' };
  for (let index = 0; index < argv.length; index += 1) {
    const flag = argv[index];
    const value = argv[index + 1];
    if (!value) continue;
    if (flag === '--port') options.port = Number(value);
    if (flag === '--root') options.root = value;
    if (flag === '--base') options.base = value;
    if (flag === '--host') options.host = value;
  }
  return options;
};

const options = readArgs(process.argv.slice(2));
const root = resolve(options.root);
const base = options.base.endsWith('/') ? options.base.slice(0, -1) : options.base;

const MIME = Object.freeze({
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.xml': 'application/xml; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
});

/**
 * @param {string} pathname
 * @returns {string}
 */
const insideRoot = (pathname) => {
  const candidate = resolve(pathname);
  return candidate === root || candidate.startsWith(`${root}${sep}`) ? candidate : root;
};

/**
 * @param {string} pathname
 * @returns {Promise<string | null>}
 */
const findFile = async (pathname) => {
  const direct = insideRoot(pathname);
  try {
    const info = await stat(direct);
    if (info.isDirectory()) {
      const index = join(direct, 'index.html');
      const indexInfo = await stat(index);
      return indexInfo.isFile() ? index : null;
    }
    return info.isFile() ? direct : null;
  } catch {
    if (extname(direct) === '') {
      const html = `${direct}.html`;
      try {
        const htmlInfo = await stat(html);
        return htmlInfo.isFile() ? html : null;
      } catch {
        return null;
      }
    }
    return null;
  }
};

const server = createServer(async (request, response) => {
  const url = new URL(request.url ?? '/', `http://${request.headers.host ?? 'localhost'}`);
  let pathname = decodeURIComponent(url.pathname);

  if (pathname === '/') {
    response.writeHead(302, { Location: `${base}/` });
    response.end();
    return;
  }

  if (pathname === base) {
    response.writeHead(302, { Location: `${base}/` });
    response.end();
    return;
  }

  if (!pathname.startsWith(`${base}/`)) {
    response.writeHead(404, { 'Content-Type': MIME['.html'] });
    response.end('Not found');
    return;
  }

  pathname = pathname.slice(base.length);
  const file = await findFile(join(root, normalize(pathname)));

  if (!file) {
    const notFound = await findFile(join(root, '404.html'));
    response.writeHead(404, { 'Content-Type': MIME['.html'] });
    if (notFound) createReadStream(notFound).pipe(response);
    else response.end('Not found');
    return;
  }

  response.writeHead(200, {
    'Content-Type': MIME[/** @type {keyof typeof MIME} */ (extname(file))] ?? 'application/octet-stream',
    'Cache-Control': 'no-store'
  });

  if (request.method === 'HEAD') {
    response.end();
    return;
  }

  createReadStream(file).pipe(response);
});

server.listen(options.port, options.host, () => {
  console.log(`Preview: http://${options.host}:${options.port}${base}/`);
  console.log(`Serving: ${root}`);
});

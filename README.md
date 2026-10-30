# fastwork-portfolio

[![ci](https://github.com/yutna/fastwork-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/yutna/fastwork-portfolio/actions/workflows/ci.yml)
[![pages](https://github.com/yutna/fastwork-portfolio/actions/workflows/pages.yml/badge.svg)](https://github.com/yutna/fastwork-portfolio/actions/workflows/pages.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Selected web work by **Yutthana Siphuengchai** — a small, hand-built
portfolio for GitHub Pages.

**Live site:** <https://yutna.github.io/fastwork-portfolio/>

## What this is

A public portfolio for selected front-end and design work. It pairs an
editorial project index with one interactive demo — a preserved
restaurant site — built as a Jekyll project site and deployed with
GitHub Actions.

## Who it's for

- **Clients and collaborators** — see the live site and the ครัวตำย่า
  demo.
- **Developers** — read the source, run it locally, or reuse the structure
  for another small Jekyll project.

## What's inside

- `/` — an editorial project index with its own paper, ink, and cobalt
  identity.
- `/krua-tumya/` — a Jekyll port of the ครัวตำย่าปากซอย restaurant demo,
  with its original markup, palette, fonts, copy, and interactions, plus a
  floating return link to the index.
- `/404.html` — a matching not-found page.
- `robots.txt` and `noindex` metadata — best-effort exclusion from search
  and AI crawlers. GitHub Pages is public, so this cannot be guaranteed.

## Built with

- Ruby 4.0.7, Bundler, Jekyll 4.4.1, WEBrick
- Node.js 24.22.1, plain ESM with JSDoc types checked by TypeScript
- Playwright, axe-core, html-validate, and a Node static-site checker
- GitHub Actions for CI and Pages; mise pins the local toolchain

The site uses `baseurl: /fastwork-portfolio`. Internal links and assets go
through Liquid's `relative_url`, so the same build works at the project
Pages URL and in local preview.

## Run locally

The pinned toolchain is managed by [mise](https://mise.jdx.dev/). Install
Ruby, Node, and the project dependencies once:

```bash
mise install
mise exec -- bundle install
mise exec -- npm ci
```

Build and preview the site at its production base path:

```bash
mise exec -- bundle exec jekyll build
mise exec -- npm run preview
```

Open <http://127.0.0.1:4001/fastwork-portfolio/>. `preview` serves the
built `_site/` directory and does not watch for changes. For live
rebuilds, use:

```bash
mise exec -- bundle exec jekyll serve --host 127.0.0.1 --port 4001
```

## Checks

```bash
mise exec -- npm run test:all
```

This builds the site, typechecks every JavaScript file, validates the
generated HTML, checks internal links and assets plus the noindex
controls, runs the unit tests, then runs Playwright at 1440×1000 and
390×844. The browser suite covers the demo interactions, localStorage
persistence, reduced motion, horizontal overflow, and WCAG A/AA with
axe.

Individual checks:

```bash
mise exec -- npm run lint:js
mise exec -- npm run check:static   # after a build
mise exec -- npm run check:html     # after a build
mise exec -- npm run test:unit
mise exec -- npm run test:e2e
```

`mise exec -- npm run capture` saves full-page and viewport screenshots
under `artifacts/screenshots/` for visual review.

## Repository layout

```text
.
├── index.html, 404.html        # home and not-found pages
├── krua-tumya/                 # preserved restaurant demo
├── _layouts/, _includes/       # Jekyll templates
├── _data/projects.yml          # project index data
├── assets/css/                 # home styles
├── assets/krua-tumya/          # preserved demo assets and JavaScript
├── scripts/                    # preview, screenshots, and static checks
├── tests/                      # unit tests and Playwright specs
└── .github/workflows/          # CI, Pages, and release automation
```

## Notes

- No analytics, trackers, cookies, or third-party runtime dependencies.
  Google Fonts on the preserved demo page are part of the original
  design.
- Search indexing is intentionally disabled with `robots.txt` and
  `noindex` metadata. This is best-effort on GitHub Pages.
- Accessibility is tested with axe. The preserved demo has one documented
  palette exception; see
  [CONTRIBUTING.md](CONTRIBUTING.md#accessibility).
- All JavaScript — browser runtime, Node scripts, tests, and Playwright
  config — follows the vendored `functional-design-skills` pack. See
  [AGENTS.md](AGENTS.md) for the scope and rules.

## Contributing

Contributions are welcome. Read [CONTRIBUTING.md](CONTRIBUTING.md) for the
issue-first workflow and local checks. By participating, you agree to the
[Code of Conduct](CODE_OF_CONDUCT.md). Report security issues privately
through [SECURITY.md](SECURITY.md), never in a public issue. General
support is covered in [SUPPORT.md](SUPPORT.md).

## License

[MIT](LICENSE) © 2026 Yutthana Siphuengchai

# fastwork-portfolio

[![ci](https://github.com/yutna/fastwork-portfolio/actions/workflows/ci.yml/badge.svg)](https://github.com/yutna/fastwork-portfolio/actions/workflows/ci.yml)
[![pages](https://github.com/yutna/fastwork-portfolio/actions/workflows/pages.yml/badge.svg)](https://github.com/yutna/fastwork-portfolio/actions/workflows/pages.yml)
[![license: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)

Selected web work by Yutthana, built with Jekyll and GitHub Pages:
<https://yutna.github.io/fastwork-portfolio/>.

## What's here

- `/` — an editorial project index with its own paper/ink/cobalt identity.
- `/krua-tumya/` — a Jekyll port of the ครัวตำย่าปากซอย demo: its original
  markup, palette, fonts, copy, and interactions, plus a floating
  `← Portfolio` link.
- `/404.html` — a matching not-found page.
- `robots.txt` and `noindex` metadata — best-effort search and AI-crawler
  exclusion. GitHub Pages is public, so this cannot be guaranteed.

The project page is intentionally not a case study this round. It is the
working demo with one way back to the index.

## Stack

- Ruby 4.0.7, Bundler, Jekyll 4.4.1, WEBrick
- Node.js 24.22.1, plain ESM with JSDoc types checked by TypeScript
- Playwright, axe-core, html-validate, and a small Node production checker
- GitHub Actions for CI and Pages deployment; mise pins the local toolchain

The site uses `baseurl: /fastwork-portfolio`; every internal URL goes through
Liquid's `relative_url` so the same build works locally and on the project
Pages URL.

## Local development

```bash
mise install
mise exec -- bundle install
mise exec -- npm ci
mise exec -- bundle exec jekyll build
mise exec -- npm run preview
```

Then open <http://127.0.0.1:4001/fastwork-portfolio/>. `npm run preview`
serves the built `_site/` at the production base path; it does not watch or
rebuild. Use `mise exec -- bundle exec jekyll serve --host 127.0.0.1 --port 4001`
if you want live rebuilds.

## Checks

```bash
mise exec -- npm run test:all
```

This builds the site, typechecks every JavaScript file, validates the generated
HTML, checks internal links/assets and the noindex controls, runs the unit
tests, then runs Playwright at 1440×1000 and 390×844. The browser suite also
covers the project interactions, localStorage persistence, horizontal overflow,
and WCAG A/AA with axe.

`npm run capture` saves full-page and viewport screenshots for visual review
under `artifacts/screenshots/`. `npm run check:html` can be run separately after
a build.

### Known accessibility constraint

The original ครัวตำย่า palette puts six small labels at 4.42:1 against their
backgrounds; WCAG AA asks for 4.5:1. Those selectors are documented and allowed
by the accessibility test. The rest of the page is checked normally. Changing
the demo palette would break the “exact demo” requirement.

## Design rules

The repository vendors `functional-design-skills` 3.3.0 under
`vendor/functional-design-skills/` and exposes a small OpenCode bridge at
`.opencode/skills/functional-design/`. See `AGENTS.md` for the project rules,
commands, and the design-rule precedence.

## Contributing

Contributions are welcome. Please read [CONTRIBUTING.md](CONTRIBUTING.md) first.

## License

[MIT](LICENSE)

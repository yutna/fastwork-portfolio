# Contributing

Thanks for your interest. This project has a single maintainer, so the
process is small and the same for every change.

## How a change gets in

1. **Issue first.** Open or find an issue that describes the change. The
   maintainer triages it into a milestone.
2. **Branch** from `main` as `<type>/<issue>-<slug>`, for example
   `feat/12-login`.
3. **Open a draft pull request early.** CI runs on drafts too. Mark it
   *Ready for review* when the work is done.
4. **Title the pull request in [Conventional Commits](https://www.conventionalcommits.org/)
   form:** `<type>(<scope>)!: <summary>`, where type is one of `feat`, `fix`,
   `docs`, `chore`, `refactor`, `test`, `ci`, `build`, `perf`, `style`,
   `revert`. The scope is optional and lower-case; `!` marks a breaking change.
   The title becomes the commit on `main`.
5. **Link the issue** with `Closes #N` in the description. Set the pull
   request milestone to the issue's milestone; it can only be merged while
   it is in a version milestone (`vX.Y.Z`).
6. **CI must pass**: the `ci-ok` and `pr-check / check` checks.
7. **Squash merge only.** The branch is deleted after the merge.

A release is made when its version milestone is complete: closing the
milestone creates the GitHub Release with generated notes. The release notes
on GitHub are the changelog.

## Local development

```bash
mise install
mise exec -- bundle install
mise exec -- npm ci
mise exec -- bundle exec jekyll build
mise exec -- npm run test:all
mise exec -- npm run preview
```

The preview runs at <http://127.0.0.1:4001/fastwork-portfolio/>.

## Project pages

`/krua-tumya/` is a preserved port of the original demo. Do not redesign
it or change its palette, fonts, copy, or behaviour. The floating
`← Portfolio` link is the only visual addition. The `role="group"`
correction on `.hero-proof` is intentional and non-visual.

Four Thai copy corrections are approved and intentional: `แล้วค่อยไปรับคิวที่หน้าร้าน`,
`ชื่อ “ครัวตำย่า” เริ่มติดปาก`, `ร้านหัวมุม ตลาดสด ...`, and
`ที่อยู่สมมติ ใช้บอกทางในเดโม`. Do not change other copy.

## Accessibility

The original palette puts six small labels at 4.42:1 against their
backgrounds, below the 4.5:1 WCAG AA threshold. The accessibility test
(`tests/e2e/a11y.spec.mjs`) documents and allows only those selectors on
the preserved page. Any new contrast issue fails the suite. Do not change
the preserved demo palette to silence the exception.

## JavaScript

All JavaScript in the repository — browser code, Node scripts, tests,
and `playwright.config.mjs` — is plain ESM with JSDoc types checked by
`tsc`. Every tracked JavaScript file follows `functional-design-skills`:
read `AGENTS.md` and the vendored pack before changing it. Calibration
decides how much design each file needs; config and tooling usually take
the lightest row. Jekyll templates, HTML, CSS, docs, and CI are outside
FDS scope.

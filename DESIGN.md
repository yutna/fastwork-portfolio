---
name: Yutthana Portfolio
description: A monochrome software craftsmanship portfolio with one project and quiet engineering notes.
colors:
  paper: "#FFFFFF"
  ink: "#0A0A0A"
  body: "#4A4A4A"
  muted: "#6B6B6B"
  line: "#E4E4E4"
typography:
  display:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "clamp(3.2rem, 5.6vw, 4.25rem)"
    fontWeight: 500
    lineHeight: 0.98
    letterSpacing: "-0.05em"
  headline:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1.6rem"
    fontWeight: 600
    lineHeight: 1.2
    letterSpacing: "-0.025em"
  title:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "0.9rem"
    fontWeight: 600
    lineHeight: 1.45
  body:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.62
  label:
    fontFamily: "Schibsted Grotesk, Helvetica Neue, Helvetica, Arial, sans-serif"
    fontSize: "0.78rem"
    fontWeight: 400
    lineHeight: 1.45
rounded:
  sm: "6px"
spacing:
  xs: "12px"
  sm: "24px"
  md: "48px"
  lg: "66px"
  page: "760px"
components:
  button:
    backgroundColor: "{colors.ink}"
    textColor: "{colors.paper}"
    rounded: "{rounded.sm}"
    padding: "0 16px"
  text-link:
    textColor: "{colors.ink}"
    rounded: "0"
    padding: "0 0 2px"
---

# Design System: Yutthana Portfolio

## Overview

**Creative North Star: "The Ledger"**

The homepage is a single narrow column of evidence. It reads like a well-kept engineering ledger: a masthead, one strong statement, an index of capabilities, the project, open-source work, working notes, and a direct contact line. There is no rail, no card grid, and no color accent. The project screenshots carry the only color on the page.

The page is intentionally quiet. Hierarchy comes from type size, weight, and thin rules. The interface should never compete with the work or the writing.

**Key Characteristics:**

- One 760px column.
- Monochrome: white, black, and two greys.
- Schibsted Grotesk for every text role.
- Thin 1px rules instead of cards or shadows.
- Project screenshots are the only color.
- No design-role language in the interface.

## Colors

The palette is monochrome. There is no accent color and no green.

### Primary

- **Ink** (#0A0A0A): headings, body, buttons, rules that need emphasis.
- **Paper** (#FFFFFF): the page ground and button text.

### Neutral

- **Body** (#4A4A4A): running copy.
- **Muted** (#6B6B6B): metadata, captions, availability, secondary labels.
- **Line** (#E4E4E4): section and row rules.

### Named Rules

**The No-Accent Rule.** The interface has no brand color. The project artwork supplies the color; do not add an accent to the chrome.

**The No-Green Rule.** Green is excluded from the UI. Do not recolour the project artwork to remove its green; the work is evidence.

## Typography

**Display Font:** Schibsted Grotesk
**Body Font:** Schibsted Grotesk

**Character:** A neutral contemporary sans with a technical edge. One family carries the whole page; hierarchy comes from size and weight. No serif, no monospace labels, no all-caps.

### Hierarchy

- **Display** (500, clamp(3.2rem, 5.6vw, 4.25rem), 0.98): the homepage statement.
- **Headline** (600, 1.6rem, 1.2): the project title.
- **Title** (600, 0.9rem, 1.45): capability rows and working notes.
- **Body** (400, 1rem, 1.62): running copy, capped near 58ch.
- **Label** (400, 0.78rem, 1.45): metadata, captions, availability. Sentence case.

### Named Rules

**The One-Voice Rule.** One typeface, Schibsted Grotesk, for every role. Do not add a display face or a mono label font.

**The Sentence-Case Rule.** Labels and captions are sentence case. No eyebrow or all-caps label.

## Layout

A single 760px column centered on the page, with 24px side gutters on small screens. The masthead uses a name/role line on the left and availability on the right; there is no navigation row. Sections are separated by 58–72px. Capability rows, open-source rows, and working notes use a 210px label column and a flexible text column. The project uses one full-width hero screenshot that links to the live site, a three-column spec row, and a short note about the build. At 700px the label columns collapse and the spec becomes one column.

## Elevation & Depth

Flat. There are no shadows, gradients, or blurred surfaces. Depth is only the 1px line and the spacing between rows.

### Named Rules

**The Flat-By-Default Rule.** No shadow or gradient. Use a rule, a gap, or type weight.

## Shapes

Buttons use a 6px radius. Images use a 1px border and no radius. There are no cards, pills, or rounded panels.

## Components

### Buttons

- **Shape:** 6px radius.
- **Primary:** ink field, paper text, 42px minimum height, 16px side padding. Hover shifts to #2A2A2A.
- **Text link:** underline, 2px bottom offset, no fill.

### Masthead

- **Line:** name and role on the left, location on the right, 1px bottom rule.
- **Second row:** navigation, availability, Fastwork/GitHub links. Sentence case.

### Index Rows

- **Capability rows:** 210px label column, 1fr description, 1px rules between rows.
- **Working notes:** same row geometry, title and paragraph.

### Project

- **Hero screenshot:** one full-width cover image with a 1px line border, linked to the live site, with a short caption.
- **Spec:** three columns for Role, Stack, and Features, separated by top and bottom rules.

## Do's and Don'ts

- Do keep one 760px column and a lot of white space.
- Do use Schibsted Grotesk for every text role.
- Do keep the interface monochrome; the work supplies color.
- Do describe the work in web development terms.
- Do keep the 1px rules and flat surfaces.
- Do show one clear hero screenshot and link it to the live project.
- Don't add a face mark, accent color, cards, shadows, gradients, or a mono label font.
- Don't use design, designer, UX, or UI-role language in the interface.
- Don't add numbered section markers or arrows to every link.
- Don't invent projects, testimonials, metrics, or clients.
- Don't recolour the Krua Tumya artwork to remove its green.

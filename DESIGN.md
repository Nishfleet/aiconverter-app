---
name: AI Converter
colors:
  bg: "#f7f7f1"
  surface: "#fffef8"
  surface-2: "#ededdf"
  ink: "#12120f"
  muted: "#6e716a"
  line: "#deded2"
  line-strong: "#bdbfaf"
  green: "#bbff2c"
  green-dark: "#314d05"
  green-hot: "#9cff00"
  blue: "#2563eb"
  blue-soft: "#edf1ff"
typography:
  display:
    fontFamily: '"HK Grotesk", "HK Grotesk Fallback", "Suisse Intl", "Suisse Int''l", suisse, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(44px, 7.4vw, 86px)"
    lineHeight: 0.94
    letterSpacing: "0"
  display-sm:
    fontFamily: '"HK Grotesk", "HK Grotesk Fallback", "Suisse Intl", "Suisse Int''l", suisse, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(34px, 5vw, 56px)"
    lineHeight: 1.04
    letterSpacing: "0"
  heading:
    fontFamily: '"HK Grotesk", "HK Grotesk Fallback", "Suisse Intl", "Suisse Int''l", suisse, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(34px, 4.2vw, 58px)"
    lineHeight: 1
    letterSpacing: "0"
  formats-display:
    fontFamily: '"HK Grotesk", "HK Grotesk Fallback", "Suisse Intl", "Suisse Int''l", suisse, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(42px, 7vw, 76px)"
    lineHeight: 0.96
    letterSpacing: "0"
  lead:
    fontFamily: '"HK Grotesk", "HK Grotesk Fallback", "Suisse Intl", "Suisse Int''l", suisse, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "clamp(17px, 1.6vw, 20px)"
    lineHeight: 1.55
    letterSpacing: "0"
  body:
    fontFamily: '"HK Grotesk", "HK Grotesk Fallback", "Suisse Intl", "Suisse Int''l", suisse, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "16px"
    lineHeight: 1.5
    letterSpacing: "0"
  body-sm:
    fontFamily: '"HK Grotesk", "HK Grotesk Fallback", "Suisse Intl", "Suisse Int''l", suisse, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
    lineHeight: 1.5
    letterSpacing: "0"
  card-title:
    fontFamily: '"HK Grotesk", "HK Grotesk Fallback", "Suisse Intl", "Suisse Int''l", suisse, Inter, ui-sans-serif, system-ui, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'
    fontSize: "14px"
    lineHeight: 1.25
    letterSpacing: "0"
  eyebrow:
    fontFamily: '"SFMono-Regular", "SF Mono", Consolas, "Liberation Mono", monospace'
    fontSize: "11px"
    lineHeight: 1.4
    letterSpacing: "0.08em"
  meta:
    fontFamily: '"SFMono-Regular", "SF Mono", Consolas, "Liberation Mono", monospace'
    fontSize: "12px"
    lineHeight: 1.45
    letterSpacing: "0"
rounded:
  none: 0px
  xs: 4px
  sm: 6px
  md: 8px
  lg: 10px
  xl: 12px
  2xl: 16px
  3xl: 20px
  4xl: 9999px
spacing:
  xs: 4px
  sm: 8px
  md: 12px
  lg: 16px
  xl: 24px
  2xl: 34px
  3xl: 56px
components:
  button:
    radius: "{rounded.lg}"
    minHeight: 42px
    padding: "0 16px"
  card:
    radius: "{rounded.lg}"
    minHeight: 142px
    padding: 14px
  field:
    radius: "{rounded.md}"
    minHeight: 42px
    padding: "0 12px"
---

# Design brief — AI Converter

This captures the look the app ships today so new work stays inside it. It is a
record, not a proposal: nothing here is a redesign, and any change to these
values is a product decision, not an implementation detail.

The design system is one warm off-white canvas, near-black ink, a single lime
green accent, and quiet 1px rules. Everything is built from those four ideas.
The tokens below are the source of truth; `src/styles.css` holds the raw values
in `:root` and the `@theme` block aliases them for Tailwind and shadcn. The
drift test `tests/design-md-tokens.test.mjs` fails when the two disagree.

## Overview

- **One accent.** Lime green (`--green`) marks success, proof and the live
  state. Nothing else is coloured except blue for links and a rose wash for
  destructive actions.
- **Ink on paper.** Body copy is near-black (`--ink`) on a warm canvas
  (`--bg`), with cards one shade lighter (`--surface`).
- **Quiet structure.** Borders are 1px `--line`, never shadows on flat
  surfaces. Shadow (`--shadow`) is reserved for raised overlays.
- **Fast, plain, honest.** Copy says what the converter does and fails closed
  when it cannot read a file. The interface never promises a result it has not
  produced.

## Colors

| Token           | Value     | Use                                        |
| --------------- | --------- | ------------------------------------------ |
| `--bg`          | `#f7f7f1` | Page canvas                                |
| `--surface`     | `#fffef8` | Cards, panels, raised rows                 |
| `--surface-2`   | `#ededdf` | Secondary fills, inert chips               |
| `--ink`         | `#12120f` | Body and heading text, primary button fill |
| `--muted`       | `#6e716a` | Secondary text and labels                  |
| `--line`        | `#deded2` | Default 1px border                         |
| `--line-strong` | `#bdbfaf` | Section rules and emphasis borders         |
| `--green`       | `#bbff2c` | Accent, success, live proof                |
| `--green-dark`  | `#314d05` | Green text on light surfaces               |
| `--green-hot`   | `#9cff00` | Accent hover and pulse                     |
| `--blue`        | `#2563eb` | Links                                      |
| `--blue-soft`   | `#edf1ff` | Link wash                                  |

## Typography

HK Grotesk carries every screen; the mono stack is only for eyebrows, file
metadata and machine values. Headings are tight (`line-height` 0.94–1.04) and
mostly untracked. Eyebrows are 11px, uppercase, tracked at 0.08em.

## Layout and spacing

Spacing runs on a 4px base: 4, 8, 12, 16, 24, 34, 56. The landing hero is a
two-column grid above 1080px and stacks below. The formats grid and the
conversion workspace use the same 12–16px gutters and 1px rules.

## Shapes

Controls are 10px (`--radius-lg`), fields 8px (`--radius-md`), small chips 6px.
Pills use `--radius-4xl`. Nothing is fully square except table cells.

## Elevation

Flat by default: 1px `--line` borders do the separating. One soft shadow
(`--shadow`, `0 24px 70px rgba(43,43,30,0.1)`) is reserved for modals and
floating panels. The primary button carries a small ink shadow for weight.

## Components

- **Button** — `--ink` fill, `#f6ffdb` label, 10px radius, 42px minimum height,
  `0 16px` padding, 14px/500. Hover lifts 1px. Secondary is a translucent ink
  wash with a 7% ink border. Destructive is a rose wash with rose text.
- **Card** — `--surface` fill, 1px `--line` border, 10px radius, 14px padding,
  142px minimum height for format cards.
- **Field** — 8px radius, 1px `--line` border, 42px minimum height, white fill.

## Do's and Don'ts

- **Do** keep one accent. If a new state needs colour, it is green or it is ink.
- **Do** use the token names; never hard-code a hex outside `:root`.
- **Don't** add a second radius scale or a new shadow.
- **Don't** redesign while adopting a primitive. A component swap must render
  the same pixels.

## Responsive

The layouts collapse at 1080px (hero), 900px (workspace) and 720px (grids).
Touch targets stay at 42px minimum at every width.

## Known Gaps

- `--muted` is a text colour here, while shadcn's `muted` role is a surface.
  This app keeps its own meaning for `--muted`; new shadcn components that use
  `bg-muted` should expect the muted text colour, and should use `--surface-2`
  when they want a light fill.
- The type scale is a record of the current CSS, not a rewrite of it. Existing
  screens still set sizes inline in `src/styles.css`; the tokens exist so new
  shadcn components match.

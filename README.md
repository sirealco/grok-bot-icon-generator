# Grok Bot Icon Generator

A browser-based icon maker with 13 fixed face silhouettes, 12 eye pairs, and an 11-color palette. Select options on the left, move paired eyes on the central preview, and save/download from the right-hand action panel.

## Features

- Fixed shapes, sizes and rotations; no custom shapes or arbitrary color input.
- Move paired eyes by pointer/touch or keyboard arrows (Shift for a larger step). Movement follows the shape contour; switching assets fits the eyes to a valid location.
- Optional black or white face outline with 2–24px outward thickness.
- Transparent or solid background: the 11 brand colors plus white. White is background-only, and is also included in curated random background choices.
- Independent 1024×1024 PNG and standalone SVG downloads.
- Randomize selects a face color and solid background together from curated brand-palette pairings. Identical colors are excluded and low-contrast pairs receive a separating outline. Manual transparent backgrounds remain available. Reset and English/Korean UI (English by default) are supported.
- Local collection: add, reopen, update, remove, confirm before clearing; identical visible results are deduplicated.
- Download the entire collection as PNG, SVG, or both in a ZIP with sequential filenames. Each candidate retains its own background, outline and eye position.
- Saved candidate settings survive reload in the same browser. No account, backend, tracking, image upload or API key is required. Browser storage failures are surfaced in the UI.

## Local development

Requires Node.js 22.12+ or 24.

```sh
npm ci
npm run dev
```

```sh
npm test
npm run build
npm run preview
```

## Deploy to Vercel

Import this repository, use the Vite preset, build with `npm run build`, and publish `dist`. The repository includes `vercel.json`. No environment variables are needed. Disable Vercel Authentication on production if enabled by the account defaults so visitors can use it without login.

## Structure

- `src/assets.json`: curated vector contours, eye pairs, collision boundaries and provenance.
- `src/model.ts`: palette, editor state, collision rules, validation and duplicate detection.
- `src/Icon.tsx`: shared live SVG rendering with pointer and keyboard interaction.
- `src/export.ts`: equivalent standalone SVG, Canvas PNG and lazy-loaded ZIP export.
- `src/App.tsx`: editor, candidate lifecycle, local persistence and downloads.
- `src/i18n.ts`: English and Korean UI text.
- `src/model.test.ts`: meaningful geometry, storage validation, vector rasterization and ZIP tests.

## Asset fidelity

See [ASSETS.md](ASSETS.md). Some selection-image silhouettes have no matching supplied vector and have been reconstructed; exact original contours should replace them when available. The screenshot palette is visually matched, because the in-chat palette screenshot was not available as a local, sampleable image. Exact color values should be checked against the source artwork before calling this pixel-exact.

## Verification

Automated checks cover all 156 shape/eye combinations, constrained movement, invalid saved settings, 120 random faces, transparent/solid backgrounds, all 13 shapes at maximum outline thickness, 1024px raster dimensions, and standalone SVG ZIP content.

The current layout uses a 16pt (21.33px) base font and a viewport-height desktop workspace. The action panel contains randomize, add, individual downloads, the collection, and ZIP export. Only the candidate list scrolls when full; the export button stays visible. On narrow screens, the interface stacks vertically with current-icon actions immediately below the preview.

Automated Chromium browser QA covers English and Korean at 1280×720, 1366×768, 1440×900 and 1920×1080. The page has no horizontal/vertical overflow at these sizes, including with 36 candidates and an active edit. The candidate list scrolls independently. Mobile Chromium touch emulation was also checked in English and Korean at 320×640, 360×740, 375×812, 390×844, 414×896 and 430×932. Checks cover horizontal overflow, touch-dragging the eyes, random face/background colors, candidate creation and export button sizing. Mobile PNG/ZIP downloads and restored candidates were verified at 390×844. Real browser downloads were checked for 1024×1024 PNG, the selected white outline in SVG, and a ZIP containing two candidates in both formats. Candidate reload and clear-cancel behavior were also verified. Physical-device behavior and iPhone Safari are not covered by these Chromium emulation checks.

UI copy was simplified with reference to [unslop](https://github.com/theclaymethod/unslop), which is a prose-clarity guide, not a CSS framework. The existing Grok Bot black-and-white design and fixed palette remain in use.

## Usage terms

Generated icons may be used free of charge, including commercially, as requested by the Grok Bot asset owner. This is a permission statement for generated images, not a grant to redistribute the source branding or the generator code. No open-source license is granted by this repository; dependency licenses remain with their respective owners.

## Data and privacy

Candidate settings and preferred language are stored in this browser only. Clearing site data removes the collection; collections do not sync between devices. PNG/SVG/ZIP generation runs locally. Browser storage may be restricted in private browsing or by device policy. Downloaded files do not contain the editor UI, selection rings, checkerboard or interaction handles.

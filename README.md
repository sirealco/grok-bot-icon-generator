# Grok Bot Icon Generator

A browser-based icon maker with 13 fixed face silhouettes, 12 eye pairs, and an 11-color palette. Select options on the left and move the eye pair directly on the live preview on the right.

## Features

- Fixed shapes, sizes and rotations; no custom shapes or arbitrary color input.
- Move paired eyes by pointer/touch or keyboard arrows (Shift for a larger step). Movement follows the shape contour; switching assets fits the eyes to a valid location.
- Optional black face outline with 2–24px outward thickness.
- Transparent or palette-color background.
- Independent 1024×1024 PNG and standalone SVG downloads.
- Randomize, reset and English/Korean UI (English by default).
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

The managed environment did not expose its required `cua_repl.js` browser-control tool. Actual interactive browser QA (including mobile Safari downloads and touch gestures) remains to be performed; an installed browser alone was not treated as a completed browser test.

## Usage terms

Generated icons may be used free of charge, including commercially, as requested by the Grok Bot asset owner. This is a permission statement for generated images, not a grant to redistribute the source branding or the generator code. No open-source license is granted by this repository; dependency licenses remain with their respective owners.

## Data and privacy

Candidate settings and preferred language are stored in this browser only. Clearing site data removes the collection; collections do not sync between devices. PNG/SVG/ZIP generation runs locally. Browser storage may be restricted in private browsing or by device policy. Downloaded files do not contain the editor UI, selection rings, checkerboard or interaction handles.

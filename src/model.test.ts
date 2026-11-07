import test from "node:test";
import assert from "node:assert/strict";
import { Resvg } from "@resvg/resvg-js";
import {
  DEFAULT,
  backgroundPairs,
  colorContrast,
  shapes,
  eyes,
  palette,
  fitPosition,
  isValidPosition,
  movePosition,
  randomConfig,
  parseCollection,
  validateConfig,
  fingerprint,
  changeConfig,
} from "./model";
import { svgMarkup, collectionZip } from "./export";
import JSZip from "jszip";
import fs from "node:fs";
import { createHash } from "node:crypto";
test("all 156 shape/eye combinations fit with complete eye boundaries inside the face", () => {
  assert.equal(shapes.length, 13);
  assert.equal(eyes.length, 12);
  assert.equal(palette.length, 11);
  for (const shape of shapes)
    for (const eye of eyes) {
      const c = { ...DEFAULT, shape: shape.id, eyes: eye.id };
      const p = fitPosition(c, DEFAULT.position);
      assert.ok(isValidPosition(c, p), `${shape.id}/${eye.id}`);
    }
});
test("dragging cannot escape contours in any direction or jump across concavities", () => {
  for (const shape of shapes) {
    let c = changeConfig(DEFAULT, { shape: shape.id });
    for (const p of [
      { x: -500, y: 512 },
      { x: 2000, y: 512 },
      { x: 512, y: -500 },
      { x: 512, y: 2000 },
      { x: -1000, y: -1000 },
    ]) {
      const position = movePosition(c, p);
      assert.ok(isValidPosition(c, position), shape.id);
      c = { ...c, position };
    }
  }
});
test("restoration validates palette, shape, finite coordinates and prototype-independent data", () => {
  assert.equal(validateConfig({ ...DEFAULT, color: "#ffffff" }), null);
  assert.equal(validateConfig({ ...DEFAULT, shape: "unexpected" }), null);
  assert.equal(
    validateConfig({ ...DEFAULT, position: { x: NaN, y: 0 } }),
    null,
  );
  assert.equal(validateConfig({ ...DEFAULT, thickness: 99 }), null);
  const items = parseCollection(
    JSON.stringify([
      { id: "a", config: DEFAULT },
      { id: "a", config: DEFAULT },
      { id: "b", config: { ...DEFAULT, color: "invalid" } },
    ]),
  );
  assert.equal(items.length, 1);
  assert.deepEqual(parseCollection(null), []);
  assert.throws(() => parseCollection("{broken"));
});
test("random faces use only permitted assets and valid positions", () => {
  for (let i = 0; i < 120; i++) {
    const c = randomConfig();
    assert.ok(validateConfig(c));
    assert.ok(c.background);
    assert.notEqual(c.background, c.color);
    assert.ok(backgroundPairs[c.color].includes(c.background));
    if (colorContrast(c.color, c.background) < 2) assert.equal(c.outline, true);
    assert.ok(isValidPosition(c, c.position));
  }
});
test("duplicate detection respects visible appearance, ignoring disabled outline thickness", () => {
  assert.equal(
    fingerprint(DEFAULT),
    fingerprint({ ...DEFAULT, thickness: 24 }),
  );
  assert.notEqual(
    fingerprint(DEFAULT),
    fingerprint({ ...DEFAULT, background: "#000000" }),
  );
  assert.notEqual(
    fingerprint({ ...DEFAULT, outline: true }),
    fingerprint({ ...DEFAULT, outline: true, thickness: 24 }),
  );
});
test("SVG renders at 1024px with transparent corners, opaque background and no clipping at maximum outline", () => {
  for (const shape of shapes) {
    const c = changeConfig(
      { ...DEFAULT, outline: true, thickness: 24 },
      { shape: shape.id },
    );
    const svg = svgMarkup(c);
    assert.ok(!svg.includes("<image"));
    assert.ok(!svg.includes("<style"));
    const image = new Resvg(svg).render();
    assert.equal(image.width, 1024);
    assert.equal(image.height, 1024);
    const pixels = image.pixels;
    assert.equal(pixels[3], 0);
    assert.equal(pixels[(512 * 1024 + 512) * 4 + 3], 255);
    for (let i = 0; i < 1024; i++)
      for (const p of [i, 1023 * 1024 + i, i * 1024, i * 1024 + 1023])
        assert.equal(pixels[p * 4 + 3], 0, shape.id);
  }
  const solid = new Resvg(
    svgMarkup({ ...DEFAULT, background: "#2085FF" }),
  ).render().pixels;
  assert.deepEqual([...solid.slice(0, 4)], [32, 133, 255, 255]);
});
test("collection SVG ZIP preserves candidate settings and sequential filenames", async () => {
  const progress: number[] = [];
  const second = { ...DEFAULT, color: "#2085FF", background: "#000000" };
  const blob = await collectionZip(
    [
      { id: "one", config: DEFAULT },
      { id: "two", config: second },
    ],
    "svg",
    (n) => progress.push(n),
  );
  const zip = await JSZip.loadAsync(await blob.arrayBuffer());
  assert.deepEqual(Object.keys(zip.files), [
    "grok-bot-001.svg",
    "grok-bot-002.svg",
  ]);
  assert.equal(
    await zip.file("grok-bot-002.svg")!.async("string"),
    svgMarkup(second),
  );
  assert.equal(progress.at(-1), 100);
});

test("seven source-backed shapes reproduce the uploaded contours without rotation or distortion", () => {
  let checked = 0;
  for (const shape of shapes) {
    const source = shape as typeof shape &
      Partial<{
        sourceFile: string;
        sourceTransform: number[];
        sourceSha256: string;
      }>;
    if (!source.sourceFile || !source.sourceTransform) continue;
    const xml = fs.readFileSync(
      new URL(`../${source.sourceFile}`, import.meta.url),
      "utf8",
    );
    assert.equal(
      createHash("sha256").update(xml).digest("hex"),
      source.sourceSha256,
    );
    const compound = [...xml.matchAll(/<path\b[^>]*\bd="([^"]+)"/g)]
      .map((match) => match[1])
      .find((d) => (d.match(/[zZ]/g) ?? []).length === 3);
    assert.ok(compound, shape.id);
    const original = compound.split(/[zZ]/)[0] + "Z";
    const [sx, b, c, sy] = source.sourceTransform;
    assert.equal(sx, sy, `${shape.id}: aspect ratio changed`);
    assert.equal(b, 0, `${shape.id}: rotated`);
    assert.equal(c, 0, `${shape.id}: skewed`);
    const raster = (body: string) =>
      new Resvg(
        `<svg xmlns="http://www.w3.org/2000/svg" width="256" height="256" viewBox="0 0 1024 1024">${body}</svg>`,
      ).render().pixels;
    const expected = raster(
      `<path d="${original}" transform="matrix(${source.sourceTransform.join(" ")})"/>`,
    );
    const actual = raster(`<path d="${shape.d}"/>`);
    let difference = 0;
    for (let i = 3; i < actual.length; i += 4)
      difference += Math.abs(actual[i] - expected[i]);
    assert.ok(
      difference < 100,
      `${shape.id}: raster differs from source (${difference})`,
    );
    checked++;
  }
  assert.equal(checked, 7);
});

test("outline color survives collection restoration and old candidates default to black", () => {
  const { outlineColor: _, ...legacy } = DEFAULT;
  assert.equal(validateConfig(legacy)?.outlineColor, "#000000");
  assert.equal(validateConfig({ ...DEFAULT, outlineColor: "#FF0000" }), null);
  const config = {
    ...DEFAULT,
    outline: true,
    outlineColor: "#FFFFFF" as const,
  };
  assert.equal(
    parseCollection(JSON.stringify([{ id: "white", config }]))[0].config
      .outlineColor,
    "#FFFFFF",
  );
  assert.notEqual(
    fingerprint(config),
    fingerprint({ ...config, outlineColor: "#000000" }),
  );
  assert.equal(
    fingerprint(DEFAULT),
    fingerprint({ ...DEFAULT, outlineColor: "#FFFFFF" }),
  );
});

test("SVG rasterization uses the selected white or black outline", () => {
  for (const color of ["#000000", "#FFFFFF"] as const) {
    const svg = svgMarkup({
      ...DEFAULT,
      outline: true,
      outlineColor: color,
      thickness: 24,
    });
    const pixels = new Resvg(svg).render().pixels;
    const offset = (512 * 1024 + 120) * 4;
    const channel = color === "#FFFFFF" ? 255 : 0;
    assert.deepEqual(
      [...pixels.slice(offset, offset + 4)],
      [channel, channel, channel, 255],
    );
  }
});

test("curated random backgrounds cover the brand palette with distinct readable pairings", () => {
  const allowed = new Set<string>(palette.map((p) => p.hex));
  assert.equal(Object.keys(backgroundPairs).length, palette.length);
  for (const color of allowed) {
    assert.ok(backgroundPairs[color].length >= 2);
    for (const background of backgroundPairs[color]) {
      assert.ok(allowed.has(background));
      assert.notEqual(color, background);
      assert.ok(
        colorContrast(color, background) >= 1.35,
        `${color}/${background}`,
      );
    }
  }
});

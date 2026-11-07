import test from "node:test";
import assert from "node:assert/strict";
import { Resvg } from "@resvg/resvg-js";
import {
  DEFAULT,
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

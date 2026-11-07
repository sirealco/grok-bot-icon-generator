import { Resvg } from "@resvg/resvg-js";
import fs from "node:fs";
import { shapes, eyes, DEFAULT, changeConfig } from "../src/model";
import { svgMarkup } from "../src/export";
const tiles = shapes.map((shape, i) => {
  const config = changeConfig(DEFAULT, { shape: shape.id });
  const inner = svgMarkup(config)
    .replace(/^<svg[^>]+>/, "")
    .replace(/<\/svg>$/, "");
  return `<svg x="${(i % 5) * 210}" y="${Math.floor(i / 5) * 230}" width="210" height="210" viewBox="0 0 1024 1024">${inner}</svg><text x="${(i % 5) * 210 + 20}" y="${Math.floor(i / 5) * 230 + 218}" font-size="13">${i + 1}. ${shape.en}</text>`;
});
fs.mkdirSync(new URL("../work/verification/", import.meta.url), {
  recursive: true,
});
fs.writeFileSync(
  new URL("../work/verification/shape-sheet.png", import.meta.url),
  new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="1050" height="700"><rect width="100%" height="100%" fill="white"/>${tiles.join("")}</svg>`,
  )
    .render()
    .asPng(),
);
const eyeTiles = eyes.map(
  (eye, i) =>
    `<svg x="${(i % 4) * 210}" y="${Math.floor(i / 4) * 220}" width="210" height="200" viewBox="0 0 1024 1024">${svgMarkup(
      changeConfig(DEFAULT, { eyes: eye.id }),
    )
      .replace(/^<svg[^>]+>/, "")
      .replace(
        /<\/svg>$/,
        "",
      )}</svg><text x="${(i % 4) * 210 + 20}" y="${Math.floor(i / 4) * 220 + 205}" font-size="12">${eye.en}</text>`,
);
fs.writeFileSync(
  new URL("../work/verification/eye-sheet.png", import.meta.url),
  new Resvg(
    `<svg xmlns="http://www.w3.org/2000/svg" width="840" height="670"><rect width="100%" height="100%" fill="white"/>${eyeTiles.join("")}</svg>`,
  )
    .render()
    .asPng(),
);

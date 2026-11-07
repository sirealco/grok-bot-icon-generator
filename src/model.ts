import assets from "./assets.json";
export const shapes = assets.shapes;
export const eyes = assets.eyes;
export const palette = [
  { hex: "#000000", en: "Black", ko: "검정" },
  { hex: "#A46D38", en: "Brown", ko: "갈색" },
  { hex: "#FF2844", en: "Red", ko: "빨강" },
  { hex: "#FF6B08", en: "Orange", ko: "주황" },
  { hex: "#FF9809", en: "Amber", ko: "노랑" },
  { hex: "#10C377", en: "Green", ko: "초록" },
  { hex: "#10B6A6", en: "Teal", ko: "청록" },
  { hex: "#2085FF", en: "Blue", ko: "파랑" },
  { hex: "#8D53FF", en: "Purple", ko: "보라" },
  { hex: "#FA2D9C", en: "Pink", ko: "분홍" },
  { hex: "#969695", en: "Gray", ko: "회색" },
] as const;
export type Lang = "en" | "ko";
export type Point = { x: number; y: number };
export type Config = {
  shape: string;
  eyes: string;
  color: string;
  outline: boolean;
  outlineColor: "#000000" | "#FFFFFF";
  thickness: number;
  background: string | null;
  position: Point;
};
export type Candidate = { id: string; config: Config };
export const DEFAULT: Config = {
  shape: "circle",
  eyes: "eyes-01",
  color: "#FA2D9C",
  outline: false,
  outlineColor: "#000000",
  thickness: 8,
  background: null,
  position: { x: 566, y: 408 },
};
export const KEY = "grok-bot-collection-v1";
export function pointInPolygon(x: number, y: number, polygon: number[][]) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const [xi, yi] = polygon[i],
      [xj, yj] = polygon[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi)
      inside = !inside;
  }
  return inside;
}
export function isValidPosition(
  config: Pick<Config, "shape" | "eyes">,
  p: Point,
) {
  const shape = shapes.find((s) => s.id === config.shape),
    eye = eyes.find((e) => e.id === config.eyes);
  if (!shape || !eye || !Number.isFinite(p.x) || !Number.isFinite(p.y))
    return false;
  return eye.boundary.every(
    ([x, y]) =>
      pointInPolygon(x + p.x, y + p.y, shape.polygon) &&
      pointInPolygon(x + p.x - 6, y + p.y, shape.polygon) &&
      pointInPolygon(x + p.x + 6, y + p.y, shape.polygon) &&
      pointInPolygon(x + p.x, y + p.y - 6, shape.polygon) &&
      pointInPolygon(x + p.x, y + p.y + 6, shape.polygon),
  );
}
export function fitPosition(
  config: Pick<Config, "shape" | "eyes">,
  target: Point,
): Point {
  if (isValidPosition(config, target)) return target;
  let best: Point | undefined,
    distance = Infinity;
  for (let y = 248; y <= 776; y += 24)
    for (let x = 248; x <= 776; x += 24) {
      const d = (x - target.x) ** 2 + (y - target.y) ** 2;
      if (d < distance && isValidPosition(config, { x, y })) {
        best = { x, y };
        distance = d;
      }
    }
  return best ?? { x: 512, y: 512 };
}
export function movePosition(config: Config, target: Point): Point {
  // Traverse from the current valid point so a drag cannot jump across a concavity.
  const start = config.position;
  let last = start;
  for (let i = 1; i <= 12; i++) {
    const p = {
      x: start.x + ((target.x - start.x) * i) / 12,
      y: start.y + ((target.y - start.y) * i) / 12,
    };
    if (!isValidPosition(config, p)) {
      let lo = last,
        hi = p;
      for (let j = 0; j < 8; j++) {
        const mid = { x: (lo.x + hi.x) / 2, y: (lo.y + hi.y) / 2 };
        if (isValidPosition(config, mid)) lo = mid;
        else hi = mid;
      }
      return lo;
    }
    last = p;
  }
  return last;
}
export function changeConfig(config: Config, patch: Partial<Config>): Config {
  const next = { ...config, ...patch };
  if (patch.shape || patch.eyes)
    next.position = fitPosition(next, next.position);
  return next;
}
export function randomConfig(): Config {
  const color = palette[Math.floor(Math.random() * palette.length)].hex;
  const shape = shapes[Math.floor(Math.random() * shapes.length)].id;
  const eye = eyes[Math.floor(Math.random() * eyes.length)].id;
  const next = {
    ...DEFAULT,
    shape,
    eyes: eye,
    color,
    outline: Math.random() < 0.25,
    thickness: [4, 8, 12, 16][Math.floor(Math.random() * 4)],
    background: null,
  };
  return {
    ...next,
    position: fitPosition(next, {
      x: 460 + Math.random() * 160,
      y: 370 + Math.random() * 180,
    }),
  };
}
export function fingerprint(config: Config) {
  return JSON.stringify([
    config.shape,
    config.eyes,
    config.color,
    config.outline,
    config.outline ? config.thickness : 0,
    config.outline ? (config.outlineColor ?? "#000000") : null,
    config.background,
    Math.round(config.position.x * 10) / 10,
    Math.round(config.position.y * 10) / 10,
  ]);
}
export function validateConfig(raw: unknown): Config | null {
  if (!raw || typeof raw !== "object") return null;
  const c = raw as Config;
  if (
    !shapes.some((s) => s.id === c.shape) ||
    !eyes.some((e) => e.id === c.eyes) ||
    !palette.some((p) => p.hex === c.color) ||
    typeof c.outline !== "boolean" ||
    (c.outlineColor !== undefined &&
      c.outlineColor !== "#000000" &&
      c.outlineColor !== "#FFFFFF") ||
    !Number.isFinite(c.thickness) ||
    c.thickness < 2 ||
    c.thickness > 24 ||
    (c.background !== null && !palette.some((p) => p.hex === c.background)) ||
    !c.position ||
    !Number.isFinite(c.position.x) ||
    !Number.isFinite(c.position.y)
  )
    return null;
  const clean: Config = {
    shape: c.shape,
    eyes: c.eyes,
    color: c.color,
    outline: c.outline,
    outlineColor: c.outlineColor ?? "#000000",
    thickness: c.thickness,
    background: c.background,
    position: { x: c.position.x, y: c.position.y },
  };
  clean.position = fitPosition(clean, clean.position);
  return clean;
}
export function parseCollection(raw: string | null): Candidate[] {
  if (!raw) return [];
  const data = JSON.parse(raw);
  if (!Array.isArray(data)) throw new Error("Invalid collection");
  const result: Candidate[] = [];
  const ids = new Set<string>();
  for (const item of data) {
    const config = validateConfig(item?.config);
    if (config && typeof item.id === "string" && !ids.has(item.id)) {
      result.push({ id: item.id, config });
      ids.add(item.id);
    }
  }
  return result;
}

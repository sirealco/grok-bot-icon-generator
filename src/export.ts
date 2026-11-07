import { eyes, shapes, type Config, type Candidate } from "./model";
export function svgMarkup(config: Config) {
  const shape = shapes.find((s) => s.id === config.shape)!;
  const eye = eyes.find((e) => e.id === config.eyes)!;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1024" height="1024" viewBox="0 0 1024 1024">${config.background ? `<rect width="1024" height="1024" fill="${config.background}"/>` : ""}<path d="${shape.d}" fill="${config.color}"${config.outline ? ` stroke="#000000" stroke-width="${config.thickness * 2}" stroke-linejoin="round" paint-order="stroke fill"` : ""}/><path d="${eye.d}" fill="#ffffff" transform="translate(${config.position.x} ${config.position.y})"/></svg>`;
}
export async function pngBlob(config: Config): Promise<Blob> {
  const url = URL.createObjectURL(
    new Blob([svgMarkup(config)], { type: "image/svg+xml;charset=utf-8" }),
  );
  try {
    const image = new Image();
    await new Promise<void>((resolve, reject) => {
      image.onload = () => resolve();
      image.onerror = () => reject(new Error("Image rendering failed"));
      image.src = url;
    });
    const canvas = document.createElement("canvas");
    canvas.width = 1024;
    canvas.height = 1024;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("Canvas unavailable");
    ctx.drawImage(image, 0, 0);
    return await new Promise<Blob>((resolve, reject) =>
      canvas.toBlob(
        (b) => (b ? resolve(b) : reject(new Error("PNG export failed"))),
        "image/png",
      ),
    );
  } finally {
    URL.revokeObjectURL(url);
  }
}
export function saveBlob(blob: Blob, name: string) {
  const url = URL.createObjectURL(blob),
    a = document.createElement("a");
  a.href = url;
  a.download = name;
  a.style.display = "none";
  document.body.append(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 30000);
}
export async function downloadIcon(config: Config, format: "png" | "svg") {
  saveBlob(
    format === "png"
      ? await pngBlob(config)
      : new Blob([svgMarkup(config)], { type: "image/svg+xml;charset=utf-8" }),
    `grok-bot-icon.${format}`,
  );
}
export type ExportFormat = "png" | "svg" | "both";
export async function collectionZip(
  items: Candidate[],
  format: ExportFormat,
  onProgress: (n: number) => void,
) {
  const { default: JSZip } = await import("jszip");
  const zip = new JSZip();
  const total = items.length * (format === "both" ? 2 : 1);
  let done = 0;
  for (let i = 0; i < items.length; i++) {
    const name = `grok-bot-${String(i + 1).padStart(3, "0")}`;
    if (format !== "svg") {
      zip.file(`${name}.png`, await pngBlob(items[i].config));
      onProgress(Math.round((++done / total) * 90));
    }
    if (format !== "png") {
      zip.file(`${name}.svg`, svgMarkup(items[i].config));
      onProgress(Math.round((++done / total) * 90));
    }
    // Keep mobile responsive while serially rendering images to bound memory use.
    await new Promise((resolve) => setTimeout(resolve, 0));
  }
  const blob = await zip.generateAsync(
    { type: "blob", compression: "DEFLATE" },
    (m) => onProgress(90 + Math.round(m.percent / 10)),
  );
  return blob;
}

/**
 * Regenerates the PWA icons (icon-192.png and icon-512.png) from the
 * source favicon.svg. Keep this script in sync with the LogoMark component
 * so the in-app logo and the installed-PWA icon stay visually identical.
 *
 * Run from the project root:
 *   node scripts/generate-icons.mjs
 */

import { writeFileSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";
import sharp from "sharp";

const __dirname = dirname(fileURLToPath(import.meta.url));
const root = resolve(__dirname, "..");
const svgPath = resolve(root, "public/favicon.svg");
const svg = readFileSync(svgPath);

const sizes = [
  { name: "icon-192.png", size: 192 },
  { name: "icon-512.png", size: 512 },
];

for (const { name, size } of sizes) {
  const out = resolve(root, "public", name);
  await sharp(svg, { density: 384 })
    .resize(size, size)
    .png({ compressionLevel: 9 })
    .toFile(out);
  console.log(`Wrote ${name} (${size}×${size})`);
}

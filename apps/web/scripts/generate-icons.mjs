import { readFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const iconsDir = join(dirname(fileURLToPath(import.meta.url)), "..", "public", "icons");
const svg = await readFile(join(iconsDir, "icon.svg"));

const targets = [
  { file: "icon-192.png", size: 192 },
  { file: "icon-512.png", size: 512 },
  { file: "icon-512-maskable.png", size: 512 },
  { file: "apple-touch-icon.png", size: 180 },
];

for (const target of targets) {
  await sharp(svg).resize(target.size, target.size).png().toFile(join(iconsDir, target.file));
  console.log(`gerado: icons/${target.file}`);
}

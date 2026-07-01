import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import sharp from 'sharp';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(__dirname, '../public');
const iconsDir = path.join(publicDir, 'icons');
const svgPath = path.join(publicDir, 'app-icon.svg');

const sizes = [180, 192, 512];
const maskableSize = 512;
const maskableLogoScale = 0.68;

fs.mkdirSync(iconsDir, { recursive: true });
const svg = fs.readFileSync(svgPath);

for (const size of sizes) {
  const out = path.join(iconsDir, `icon-${size}.png`);
  await sharp(svg, { density: 400 }).resize(size, size).png().toFile(out);
  console.log(`Wrote ${out}`);
}

const innerSize = Math.round(maskableSize * maskableLogoScale);
const inner = await sharp(svg, { density: 400 }).resize(innerSize, innerSize).png().toBuffer();
const maskableOut = path.join(iconsDir, 'icon-512-maskable.png');
await sharp({
  create: {
    width: maskableSize,
    height: maskableSize,
    channels: 4,
    background: { r: 15, g: 23, b: 42, alpha: 1 },
  },
})
  .composite([{ input: inner, gravity: 'center' }])
  .png()
  .toFile(maskableOut);
console.log(`Wrote ${maskableOut}`);

// Sync favicon-sized PNG for older clients
await sharp(svg, { density: 400 }).resize(32, 32).png().toFile(path.join(publicDir, 'favicon-32.png'));
console.log('Wrote favicon-32.png');

import { deflateSync } from 'node:zlib';
import { mkdir, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

// Minimal dependency-free PNG encoder (RGBA, no filtering) plus a flat
// accent-square + ring mark, generated once and committed as static assets.

const crcTable = (() => {
  const table = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    table[n] = c >>> 0;
  }
  return table;
})();

function crc32(buffer) {
  let c = 0xffffffff;
  for (const byte of buffer) c = crcTable[(c ^ byte) & 0xff] ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

function chunk(type, data) {
  const typeBuffer = Buffer.from(type, 'ascii');
  const length = Buffer.alloc(4);
  length.writeUInt32BE(data.length, 0);
  const crc = Buffer.alloc(4);
  crc.writeUInt32BE(crc32(Buffer.concat([typeBuffer, data])), 0);
  return Buffer.concat([length, typeBuffer, data, crc]);
}

function encodePng(width, height, rgba) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8; // bit depth
  ihdrData[9] = 6; // color type: RGBA
  ihdrData[10] = 0; ihdrData[11] = 0; ihdrData[12] = 0;

  const stride = width * 4;
  const raw = Buffer.alloc((stride + 1) * height);
  for (let y = 0; y < height; y++) {
    raw[y * (stride + 1)] = 0; // filter type: none
    rgba.copy(raw, y * (stride + 1) + 1, y * stride, y * stride + stride);
  }

  return Buffer.concat([
    signature,
    chunk('IHDR', ihdrData),
    chunk('IDAT', deflateSync(raw, { level: 9 })),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

const hexToRgb = (hex) => [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
const background = hexToRgb('#28766f'); // --accent
const mark = hexToRgb('#f8fffd'); // --accent-contrast

function drawIcon(size, outerRadiusFraction) {
  const rgba = Buffer.alloc(size * size * 4);
  const center = size / 2;
  const outerRadius = size * outerRadiusFraction;
  const innerRadius = outerRadius - size * 0.07;
  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const dx = x + 0.5 - center;
      const dy = y + 0.5 - center;
      const distance = Math.sqrt(dx * dx + dy * dy);
      const onRing = distance <= outerRadius && distance >= innerRadius;
      const [r, g, b] = onRing ? mark : background;
      const offset = (y * size + x) * 4;
      rgba[offset] = r; rgba[offset + 1] = g; rgba[offset + 2] = b; rgba[offset + 3] = 255;
    }
  }
  return rgba;
}

const outDir = join('src', 'assets', 'icons');
await mkdir(outDir, { recursive: true });

const targets = [
  { name: 'icon-192.png', size: 192, outerRadiusFraction: 0.32 },
  { name: 'icon-512.png', size: 512, outerRadiusFraction: 0.32 },
  { name: 'icon-512-maskable.png', size: 512, outerRadiusFraction: 0.26 }, // stays inside the ~80% maskable safe zone
  { name: 'favicon-64.png', size: 64, outerRadiusFraction: 0.32 },
];

for (const target of targets) {
  const png = encodePng(target.size, target.size, drawIcon(target.size, target.outerRadiusFraction));
  await writeFile(join(outDir, target.name), png);
  console.log(`Wrote ${join(outDir, target.name)} (${png.length} bytes)`);
}

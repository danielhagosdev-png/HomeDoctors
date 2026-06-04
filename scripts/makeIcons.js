/**
 * makeIcons.js – generates proper PNG icons without external dependencies.
 * Uses Node.js built-in zlib to create valid PNG files.
 * Run: node scripts/makeIcons.js
 */

const fs   = require('fs');
const zlib = require('zlib');
const path = require('path');

// ── PNG encoder ────────────────────────────────────────────────────────────────
function crc32(buf) {
  let crc = 0xFFFFFFFF;
  for (const b of buf) {
    crc ^= b;
    for (let j = 0; j < 8; j++) crc = (crc >>> 1) ^ (crc & 1 ? 0xEDB88320 : 0);
  }
  return (crc ^ 0xFFFFFFFF) >>> 0;
}

function chunk(type, data) {
  const typeBytes = Buffer.from(type, 'ascii');
  const len       = Buffer.alloc(4); len.writeUInt32BE(data.length);
  const crcInput  = Buffer.concat([typeBytes, data]);
  const crcBuf    = Buffer.alloc(4); crcBuf.writeUInt32BE(crc32(crcInput));
  return Buffer.concat([len, typeBytes, data, crcBuf]);
}

/**
 * Create a solid-colour PNG with an optional white cross.
 * @param {number} w  width in pixels
 * @param {number} h  height in pixels
 * @param {{ r,g,b }} bg  background colour
 * @param {boolean} cross  draw a medical cross
 */
function makePng(w, h, bg, cross = false) {
  // Build raw RGBA rows
  const rows = [];
  for (let y = 0; y < h; y++) {
    const row = Buffer.alloc(w * 3);
    for (let x = 0; x < w; x++) {
      let r = bg.r, g = bg.g, b = bg.b;

      if (cross) {
        // Vertical bar: centre ± 9% width
        const vx1 = Math.floor(w * 0.41), vx2 = Math.floor(w * 0.59);
        const vy1 = Math.floor(h * 0.19), vy2 = Math.floor(h * 0.81);
        // Horizontal bar: centre ± 9% height
        const hx1 = Math.floor(w * 0.19), hx2 = Math.floor(w * 0.81);
        const hy1 = Math.floor(h * 0.41), hy2 = Math.floor(h * 0.59);

        if ((x >= vx1 && x < vx2 && y >= vy1 && y < vy2) ||
            (x >= hx1 && x < hx2 && y >= hy1 && y < hy2)) {
          r = 255; g = 255; b = 255; // white cross
        }
      }
      row.writeUInt8(r, x * 3);
      row.writeUInt8(g, x * 3 + 1);
      row.writeUInt8(b, x * 3 + 2);
    }
    // PNG filter byte (0 = None) prepended to each row
    rows.push(Buffer.concat([Buffer.from([0]), row]));
  }

  const raw       = Buffer.concat(rows);
  const compressed = zlib.deflateSync(raw);

  const sig  = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);
  const ihdr = Buffer.alloc(13);
  ihdr.writeUInt32BE(w,  0);
  ihdr.writeUInt32BE(h,  4);
  ihdr.writeUInt8(8,     8);   // bit depth
  ihdr.writeUInt8(2,     9);   // colour type: RGB
  ihdr.writeUInt8(0,    10);   // compression
  ihdr.writeUInt8(0,    11);   // filter
  ihdr.writeUInt8(0,    12);   // interlace

  return Buffer.concat([
    sig,
    chunk('IHDR', ihdr),
    chunk('IDAT', compressed),
    chunk('IEND', Buffer.alloc(0)),
  ]);
}

// ── Generate assets ───────────────────────────────────────────────────────────
const BG = { r: 26, g: 143, b: 227 };   // #1a8fe3

const icons = [
  { file: 'assets/icon.png',          w: 1024, h: 1024, cross: true },
  { file: 'assets/adaptive-icon.png', w: 1024, h: 1024, cross: true },
  { file: 'assets/splash.png',        w: 2048, h: 2048, cross: true },
  { file: 'assets/favicon.png',       w:  196, h:  196, cross: true },
];

for (const { file, w, h, cross } of icons) {
  const outPath = path.join(__dirname, '..', file);
  const png = makePng(w, h, BG, cross);
  fs.writeFileSync(outPath, png);
  console.log(`✅  ${file}  (${w}×${h}, ${(png.length / 1024).toFixed(0)} KB)`);
}
console.log('\nAll icons generated.');

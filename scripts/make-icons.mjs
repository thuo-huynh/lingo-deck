// Run once: node scripts/make-icons.mjs — renders the app icon to the PNG sizes iOS and the manifest need.
import sharp from "sharp";

const svg = (pad) => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512">
  <rect width="512" height="512" fill="#0E7C72"/>
  <g transform="translate(${pad} ${pad}) scale(${(512 - pad * 2) / 512})">
    <rect x="136" y="120" width="220" height="280" rx="36" fill="#E3F2F0" transform="rotate(-8 246 260)"/>
    <rect x="166" y="112" width="220" height="280" rx="36" fill="#FFFFFF"/>
    <path d="M226 300 l40 40 l80 -96" fill="none" stroke="#0E7C72" stroke-width="30" stroke-linecap="round" stroke-linejoin="round"/>
  </g>
</svg>`;

const out = [
  ["public/icon-192.png", 192, 0],
  ["public/icon-512.png", 512, 0],
  ["public/icon-maskable-512.png", 512, 64],
  ["src/app/apple-icon.png", 180, 0],
  ["src/app/icon.png", 64, 0],
];
for (const [file, size, pad] of out) {
  await sharp(Buffer.from(svg(pad))).resize(size, size).png().toFile(file);
}

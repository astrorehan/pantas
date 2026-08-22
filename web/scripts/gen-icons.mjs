/**
 * Renders every app icon from one source of truth.
 *
 * The mark itself lives twice on purpose: `Logo` in `src/components/chrome.tsx`
 * draws it as an outline that inherits `currentColor` for use inside the app,
 * while the icons below need the knocked-out tile — a stroke-only leaf turns to
 * mush at 16 px in a browser tab. Both are the same geometry, so a change to one
 * means a change to the other plus a re-run of this script.
 *
 *   node scripts/gen-icons.mjs
 *
 * `sharp` arrives with Next.js rather than as a declared dependency, which is
 * why this is a one-off generator committed alongside its output instead of a
 * `prebuild` step: CI never has to resolve it.
 */
import { Buffer } from "node:buffer";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const WEB = join(dirname(fileURLToPath(import.meta.url)), "..");

const png = (size) =>
  sharp(join(WEB, "public", "Logo Pantas_Rounded.png"))
    .resize(size, size, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 0 } })
    .png()
    .toBuffer();

/**
 * ICO container around PNG frames. Browsers, and Windows since Vista, read
 * PNG-compressed entries, so there is no BMP path to maintain here.
 */
function ico(frames) {
  const HEADER = 6;
  const ENTRY = 16;
  const header = Buffer.alloc(HEADER);
  header.writeUInt16LE(0, 0); // reserved
  header.writeUInt16LE(1, 2); // 1 = icon
  header.writeUInt16LE(frames.length, 4);

  let offset = HEADER + ENTRY * frames.length;
  const entries = frames.map(({ size, data }) => {
    const entry = Buffer.alloc(ENTRY);
    entry.writeUInt8(size === 256 ? 0 : size, 0);
    entry.writeUInt8(size === 256 ? 0 : size, 1);
    entry.writeUInt8(0, 2); // palette size — 0 for truecolour
    entry.writeUInt8(0, 3); // reserved
    entry.writeUInt16LE(1, 4); // colour planes
    entry.writeUInt16LE(32, 6); // bits per pixel
    entry.writeUInt32LE(data.length, 8);
    entry.writeUInt32LE(offset, 12);
    offset += data.length;
    return entry;
  });

  return Buffer.concat([header, ...entries, ...frames.map((f) => f.data)]);
}

async function main() {
  await mkdir(join(WEB, "public"), { recursive: true });

  const targets = [
    ["public/icon-192x192.png", 192],
    ["public/icon-512x512.png", 512],
    // Next.js serves this as <link rel="apple-touch-icon"> from the app dir.
    ["src/app/apple-icon.png", 180],
  ];
  for (const [rel, size] of targets) {
    await writeFile(join(WEB, rel), await png(size));
    console.log(`wrote ${rel} (${size}px)`);
  }

  const sizes = [16, 32, 48];
  const frames = await Promise.all(
    sizes.map(async (size) => ({ size, data: await png(size) })),
  );
  await writeFile(join(WEB, "src/app/favicon.ico"), ico(frames));
  console.log(`wrote src/app/favicon.ico (${sizes.join(", ")}px)`);
}

await main();

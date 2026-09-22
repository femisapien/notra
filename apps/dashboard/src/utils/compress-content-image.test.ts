import { beforeAll, expect, mock, test } from "bun:test";

import sharp from "sharp";

mock.module("server-only", () => ({}));

let compressContentImage: typeof import("./compress-content-image").compressContentImage;

beforeAll(async () => {
  ({ compressContentImage } = await import("./compress-content-image"));
});

async function uncompressedPng() {
  const raw = Buffer.alloc(180 * 180 * 3);
  for (let index = 0; index < raw.length; index++) {
    raw[index] = (index * 17) % 256;
  }
  return sharp(raw, { raw: { channels: 3, height: 180, width: 180 } })
    .png({ compressionLevel: 0 })
    .toBuffer();
}

test("png compression stays lossless and does not grow", async () => {
  const input = await uncompressedPng();
  const output = await compressContentImage(input);
  expect(output.mimeType).toBe("image/png");
  expect(output.bytes.byteLength).toBeLessThan(input.byteLength);

  const [before, after] = await Promise.all([
    sharp(input).ensureAlpha().raw().toBuffer(),
    sharp(output.bytes).ensureAlpha().raw().toBuffer(),
  ]);
  expect(Buffer.compare(before, after)).toBe(0);
});

test("accepts AVIF that Sharp labels as heif", async () => {
  const input = await sharp({
    create: { background: "red", channels: 3, height: 8, width: 8 },
  })
    .avif()
    .toBuffer();
  const output = await compressContentImage(input);
  expect(output.mimeType).toBe("image/avif");
  expect(Buffer.compare(output.bytes, input)).toBe(0);
});

test("rejects non-images and files over 20MB", async () => {
  await expect(
    compressContentImage(Buffer.from("not an image"))
  ).rejects.toThrow("Use a JPEG, PNG, GIF, WebP, or AVIF image");
  await expect(
    compressContentImage(Buffer.alloc(20 * 1024 * 1024 + 1))
  ).rejects.toThrow("Image must be 20MB or smaller");
});

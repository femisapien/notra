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

test("jpeg is re-encoded and stays a jpeg", async () => {
  const input = await sharp({
    create: {
      background: { b: 20, g: 80, r: 200 },
      channels: 3,
      height: 64,
      width: 64,
    },
  })
    .jpeg({ quality: 100 })
    .toBuffer();
  const output = await compressContentImage(input);
  expect(output.mimeType).toBe("image/jpeg");
  expect(output.bytes.byteLength).toBeLessThanOrEqual(input.byteLength);
  expect(await sharp(output.bytes).metadata()).toMatchObject({
    format: "jpeg",
    height: 64,
    width: 64,
  });
});

test("gif bytes are left unchanged", async () => {
  const input = await sharp({
    create: {
      background: { alpha: 1, b: 0, g: 0, r: 255 },
      channels: 4,
      height: 2,
      width: 2,
    },
  })
    .gif()
    .toBuffer();
  const output = await compressContentImage(input);
  expect(output.mimeType).toBe("image/gif");
  expect(Buffer.compare(output.bytes, input)).toBe(0);
});

test("non-images are rejected", async () => {
  await expect(
    compressContentImage(Buffer.from("not an image"))
  ).rejects.toThrow("Use a JPEG, PNG, GIF, WebP, or AVIF image");
});

test("oversized uploads are rejected before decoding", async () => {
  await expect(
    compressContentImage(Buffer.alloc(20 * 1024 * 1024 + 1))
  ).rejects.toThrow("Image must be 20MB or smaller");
});

import { expect, test } from "bun:test";

import { MAX_CONTENT_VIDEO_BYTES } from "@/constants/content-video";

import { validateContentVideo } from "./validate-content-video";

function mp4(brand: string) {
  const bytes = new Uint8Array(16);
  bytes.set([0x66, 0x74, 0x79, 0x70], 4);
  bytes.set(
    [...brand].map((character) => character.charCodeAt(0)),
    8
  );
  return bytes;
}

test("accepts an mp4 and a webm", () => {
  expect(validateContentVideo(mp4("isom"))).toBe("video/mp4");
  expect(
    validateContentVideo(new Uint8Array([0x1a, 0x45, 0xdf, 0xa3, 0, 0]))
  ).toBe("video/webm");
});

test("rejects a quicktime brand, markup, and a file over 10MB", () => {
  expect(() => validateContentVideo(mp4("qt  "))).toThrow(
    "Use an MP4 or WebM video"
  );
  expect(() => validateContentVideo(Buffer.from("<video></video>"))).toThrow(
    "Use an MP4 or WebM video"
  );
  expect(() =>
    validateContentVideo(Buffer.alloc(MAX_CONTENT_VIDEO_BYTES + 1))
  ).toThrow("Video must be 10MB or smaller");
});

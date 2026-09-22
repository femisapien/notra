import {
  MAX_CONTENT_VIDEO_BYTES,
  type ContentVideoMimeType,
} from "@/constants/content-video";

const MP4_BRANDS = new Set([
  "M4V ",
  "MSNV",
  "avc1",
  "dash",
  "iso2",
  "iso4",
  "iso5",
  "iso6",
  "isom",
  "mp41",
  "mp42",
]);

function isWebm(bytes: Uint8Array) {
  return (
    bytes.length >= 4 &&
    bytes[0] === 0x1a &&
    bytes[1] === 0x45 &&
    bytes[2] === 0xdf &&
    bytes[3] === 0xa3
  );
}

function isMp4(bytes: Uint8Array) {
  if (
    bytes.length < 12 ||
    bytes[4] !== 0x66 ||
    bytes[5] !== 0x74 ||
    bytes[6] !== 0x79 ||
    bytes[7] !== 0x70
  ) {
    return false;
  }
  const brand = String.fromCharCode(
    bytes[8] ?? 0,
    bytes[9] ?? 0,
    bytes[10] ?? 0,
    bytes[11] ?? 0
  );
  return MP4_BRANDS.has(brand);
}

// ponytail: no ffmpeg. A GitHub draft already rejects files over 10MB, so transcoding would not admit a larger clip.
export function validateContentVideo(bytes: Uint8Array): ContentVideoMimeType {
  if (bytes.byteLength > MAX_CONTENT_VIDEO_BYTES) {
    throw new Error("Video must be 10MB or smaller");
  }
  if (isMp4(bytes)) {
    return "video/mp4";
  }
  if (isWebm(bytes)) {
    return "video/webm";
  }
  throw new Error("Use an MP4 or WebM video");
}

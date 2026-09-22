import { expect, test } from "bun:test";

import {
  contentImageKeyBelongsToOrganization,
  getAppContentImageKey,
  isSafeContentImageKey,
} from "./content-image-key";

const KEY = "organization/org_1/content/abc123.png";

test("accepts a dashboard content image key", () => {
  expect(isSafeContentImageKey(KEY)).toBe(true);
  expect(isSafeContentImageKey(`organization/org_1/content/../${KEY}`)).toBe(
    false
  );
  expect(isSafeContentImageKey("organization/org_1/content/file.svg")).toBe(
    false
  );
  expect(isSafeContentImageKey("organization/org_1/content/clip.mp4")).toBe(
    true
  );
  expect(isSafeContentImageKey("organization/org_1/content/clip.webm")).toBe(
    true
  );
  expect(contentImageKeyBelongsToOrganization(KEY, "org_1")).toBe(true);
  expect(contentImageKeyBelongsToOrganization(KEY, "org_2")).toBe(false);
  expect(
    contentImageKeyBelongsToOrganization(
      "organization/org_1/content/file.svg",
      "org_1"
    )
  ).toBe(false);
});

test("reads keys from root-relative and same-origin urls", () => {
  expect(
    getAppContentImageKey(`/api/uploads/content-images/${KEY}`, null)
  ).toBe(KEY);
  expect(
    getAppContentImageKey(
      `http://localhost:3000/api/uploads/content-images/${KEY}`,
      "http://localhost:3000"
    )
  ).toBe(KEY);
  expect(
    getAppContentImageKey(
      `https://evil.test/api/uploads/content-images/${KEY}`,
      "https://app.usenotra.com"
    )
  ).toBeNull();
});

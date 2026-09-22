import { describe, expect, test } from "bun:test";

import {
  canAccessPost,
  contentSharePath,
  isShareToken,
  resolveContentShareHref,
} from "./content-share";

describe("content share access", () => {
  test("organization and unlisted posts are visible to any member", () => {
    expect(
      canAccessPost(
        { visibility: "organization", createdByUserId: "owner" },
        "teammate"
      )
    ).toBe(true);
    expect(
      canAccessPost(
        { visibility: "unlisted", createdByUserId: "owner" },
        "teammate"
      )
    ).toBe(true);
  });

  test("private posts are only visible to the owner", () => {
    expect(
      canAccessPost(
        { visibility: "private", createdByUserId: "owner" },
        "owner"
      )
    ).toBe(true);
    expect(
      canAccessPost(
        { visibility: "private", createdByUserId: "owner" },
        "teammate"
      )
    ).toBe(false);
    expect(
      canAccessPost({ visibility: "private", createdByUserId: null }, "owner")
    ).toBe(false);
  });
});

describe("content share links", () => {
  test("unlisted posts use the public token path", () => {
    expect(
      resolveContentShareHref({
        origin: "https://app.usenotra.com",
        visibility: "unlisted",
        shareToken: "abc123456",
        organizationSlug: "acme",
        contentId: "post-1",
      })
    ).toBe("https://app.usenotra.com/s/abc123456");
    expect(contentSharePath("abc123456")).toBe("/s/abc123456");
  });

  test("private and organization posts use the dashboard path", () => {
    expect(
      resolveContentShareHref({
        origin: "https://app.usenotra.com",
        visibility: "private",
        shareToken: "abc123456",
        organizationSlug: "acme",
        contentId: "post-1",
      })
    ).toBe("https://app.usenotra.com/acme/content/post-1");
  });

  test("share tokens must be unguessable nanoid-shaped values", () => {
    expect(isShareToken("V1StGXR8_Z5jdHi6B-myT")).toBe(true);
    expect(isShareToken("short")).toBe(false);
    expect(isShareToken("../etc/passwd")).toBe(false);
  });
});

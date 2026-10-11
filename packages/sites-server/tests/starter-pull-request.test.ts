import { describe, expect, test } from "bun:test";

import {
  starterPullRequestMatchesRoot,
  starterRootMetadata,
} from "../src/utils/starter-pull-request";

describe("starter PR root evidence", () => {
  test("metadata is deterministic and normalizes edge slashes", () => {
    expect(starterRootMetadata(" /hosted-site/ ")).toBe(
      '<!-- notra:site-starter-root "hosted-site" -->'
    );
    expect(
      starterPullRequestMatchesRoot(
        starterRootMetadata("hosted-site"),
        " /hosted-site/ "
      )
    ).toBe(true);
    expect(
      starterPullRequestMatchesRoot(starterRootMetadata("hosted-site"), "")
    ).toBe(false);
    expect(starterPullRequestMatchesRoot(starterRootMetadata(""), "")).toBe(
      true
    );
  });

  test("legacy file lists match exact paths, not substrings", () => {
    expect(
      starterPullRequestMatchesRoot(
        "Files:\n- `hosted-site/blog.json`\n- `hosted-site/header.mdx`",
        "hosted-site"
      )
    ).toBe(true);
    expect(starterPullRequestMatchesRoot("- `hosted-site/blog.json`", "")).toBe(
      false
    );
    expect(starterPullRequestMatchesRoot("- `blog.json`", "hosted-site")).toBe(
      false
    );
    expect(starterPullRequestMatchesRoot("- `blog.json`\r\n", "")).toBe(true);
    expect(
      starterPullRequestMatchesRoot(
        "See `hosted-site/blog.json`",
        "hosted-site"
      )
    ).toBe(false);
  });

  test("missing, malformed, conflicting metadata cannot reuse a PR", () => {
    for (const body of [
      null,
      "",
      "Starter files",
      "<!-- notra:site-starter-root invalid -->\n- `blog.json`",
      `${starterRootMetadata("hosted-site")}\n- \`blog.json\``,
      `${starterRootMetadata("")}\n${starterRootMetadata("")}`,
    ]) {
      expect(starterPullRequestMatchesRoot(body, "")).toBe(false);
    }
  });
});

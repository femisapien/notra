import { beforeAll, expect, mock, test } from "bun:test";

mock.module("server-only", () => ({}));

let prepareGitHubContentAssets: typeof import("./content-assets").prepareGitHubContentAssets;
let prepareR2GitHubContentAssets: typeof import("./content-assets").prepareR2GitHubContentAssets;
let resolveGitHubImagePathTemplate: typeof import("./content-assets").resolveGitHubImagePathTemplate;

beforeAll(async () => {
  ({
    prepareGitHubContentAssets,
    prepareR2GitHubContentAssets,
    resolveGitHubImagePathTemplate,
  } = await import("./content-assets"));
});

const KEY = "organization/org_1/content/abc123.png";
const SECOND_KEY = "organization/org_1/content/def456.jpg";

test("defaults the image path to the markdown file name", () => {
  expect(resolveGitHubImagePathTemplate("blog/hello-world.md", null)).toBe(
    "blog/hello-world"
  );
  expect(resolveGitHubImagePathTemplate("blog/hello-world.mdx", "  ")).toBe(
    "blog/hello-world"
  );
  expect(
    resolveGitHubImagePathTemplate(
      "blog/hello-world.md",
      "public/blog/:slug/image"
    )
  ).toBe("public/blog/:slug/image");
});

test("puts an uploaded image in the pull request beside the markdown", async () => {
  const png = new Uint8Array([1, 2, 3]);
  const prepared = await prepareGitHubContentAssets({
    appOrigin: "http://localhost:3000",
    contentPath: "blog/hello-world.md",
    imagePathTemplate: "blog/hello-world",
    loadImage: async (key) => {
      expect(key).toBe(KEY);
      return { contents: png, extension: ".png" };
    },
    markdown: `Intro\n\n![Cover](/api/uploads/content-images/${KEY})\n`,
    publicUrl: null,
    slug: "hello-world",
  });

  expect(prepared.assets).toEqual([
    { contents: png, path: "blog/hello-world.png" },
  ]);
  expect(prepared.markdown).toContain("![Cover](./hello-world.png)");
});

test("keeps external images as links and numbers later uploads", async () => {
  const prepared = await prepareGitHubContentAssets({
    appOrigin: "https://app.usenotra.com",
    contentPath: "blog/hello-world.md",
    imagePathTemplate: "public/blog/:slug/image",
    loadImage: async (key) => ({
      contents: new Uint8Array([key === KEY ? 1 : 2]),
      extension: key.endsWith(".jpg") ? ".jpg" : ".png",
    }),
    markdown: [
      `![Cover](https://cdn.example/organization/org_1/content/abc123.png)`,
      `![Shot](https://cdn.example/${KEY})`,
      "![Remote](https://example.com/remote.png)",
      `![Second](https://cdn.example/${SECOND_KEY})`,
    ].join("\n"),
    publicUrl: "https://cdn.example",
    slug: "hello-world",
  });

  expect(prepared.assets.map((asset) => asset.path)).toEqual([
    "public/blog/hello-world/image.png",
    "public/blog/hello-world/image-2.jpg",
  ]);
  expect(prepared.markdown).toContain("![Cover](/blog/hello-world/image.png)");
  expect(prepared.markdown).toContain("![Shot](/blog/hello-world/image.png)");
  expect(prepared.markdown).toContain(
    "![Remote](https://example.com/remote.png)"
  );
  expect(prepared.markdown).toContain(
    "![Second](/blog/hello-world/image-2.jpg)"
  );
});

test("puts an uploaded video in the pull request beside the markdown", async () => {
  const { saveContentImage } = await import("../../upload/content-image-store");
  const bytes = new Uint8Array([
    0, 0, 0, 24, 0x66, 0x74, 0x79, 0x70, 0x69, 0x73, 0x6f, 0x6d,
  ]);
  const saved = await saveContentImage({
    bytes,
    mimeType: "video/mp4",
    organizationId: "org_video",
  });
  const prepared = await prepareR2GitHubContentAssets({
    contentPath: "blog/hello-world.md",
    imagePathTemplate: "blog/hello-world",
    markdown: `Intro\n\n<video controls src="${saved.url}"></video>\n\n\`\`\`\n<video controls src="${saved.url}"></video>\n\`\`\`\n`,
    slug: "hello-world",
  });

  expect(prepared.assets).toEqual([
    { contents: bytes, path: "blog/hello-world.mp4" },
  ]);
  expect(prepared.markdown).toContain(
    '<video controls src="./hello-world.mp4"></video>'
  );
  expect(prepared.markdown).toContain(
    `\`\`\`\n<video controls src="${saved.url}"></video>\n\`\`\``
  );
});

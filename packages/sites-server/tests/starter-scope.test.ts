import { beforeEach, expect, mock, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

if (!process.env.NOTRA_STARTER_SCOPE_WORKER) {
  test("starter source scope and no-overwrite regressions", () => {
    const result = spawnSync(
      process.execPath,
      ["test", fileURLToPath(import.meta.url)],
      {
        env: { ...process.env, NOTRA_STARTER_SCOPE_WORKER: "1" },
        timeout: 30_000,
      }
    );
    expect(result.status, result.stderr?.toString()).toBe(0);
  });
} else {
  const scope = {
    organizationId: "organization",
    repositoryId: "repository",
    branch: "main",
    rootDirectory: "hosted-site",
  };
  const configFiles = new Map<string, string>();
  let pulls: {
    head: { ref: string };
    body: string | null;
    html_url: string;
  }[] = [];
  const request = mock(async (_route: string, _params: unknown) => ({
    data: pulls,
  }));
  const readFile = mock(
    async (
      _repository: unknown,
      _token: string,
      input: { path: string; ref: string }
    ) => {
      const content = configFiles.get(`${input.ref}:${input.path}`);
      return content === undefined ? null : { content, sha: "test-sha" };
    }
  );
  const write = mock(async () => {});
  let body = "";
  mock.module("@notra/ai/utils/octokit", () => ({
    createOctokit: () => ({ request }),
  }));
  mock.module("@notra/ai/utils/public-fetch", () => ({
    fetchPublicUrl: mock(() => {
      throw new Error("unexpected network");
    }),
  }));
  mock.module("@notra/db/drizzle", () => ({
    db: {
      select: () => ({
        from: () => ({
          where: () => ({
            limit: async () => [],
            orderBy: () => ({ limit: async () => [] }),
          }),
        }),
      }),
    },
  }));
  mock.module("../src/repositories", () => ({
    requireOrganizationRepository: async () => ({
      integration: { defaultBranch: "main" },
      repository: { owner: "example", repo: "site" },
    }),
  }));
  mock.module("../src/github", () => ({
    siteRepositoryToken: async () => "test-token",
    getDefaultBranch: async () => "main",
    getBranchHead: async () => ({ sha: "test-sha" }),
  }));
  mock.module("../src/editor", () => ({
    readRepositoryFile: readFile,
    createRepositoryBranch: write,
    commitRepositoryFiles: write,
    openRepositoryPullRequest: async (
      _repository: unknown,
      _token: string,
      input: { body: string }
    ) => {
      body = input.body;
      return "https://github.example/new/pull/3";
    },
  }));
  const { siteStarterStatus, createSiteStarter } =
    await import("../src/starter");
  const { starterRootMetadata } =
    await import("../src/utils/starter-pull-request");
  beforeEach(() => {
    configFiles.clear();
    pulls = [];
    request.mockClear();
    readFile.mockClear();
    write.mockClear();
    body = "";
  });

  test("status is selected-root and selected-branch existence, including invalid and empty JSON", async () => {
    configFiles.set("main:hosted-site/blog.json", "not json");
    expect((await siteStarterStatus(scope)).hasConfig).toBe(true);
    expect(
      (await siteStarterStatus({ ...scope, rootDirectory: "" })).hasConfig
    ).toBe(false);
    expect(
      (await siteStarterStatus({ ...scope, branch: "other" })).hasConfig
    ).toBe(false);
    configFiles.set("main:blog.json", "");
    expect(
      (await siteStarterStatus({ ...scope, rootDirectory: " / " })).hasConfig
    ).toBe(true);
  });

  test("status skips wrong-root and unknown PRs and uses exact legacy evidence", async () => {
    pulls = [
      {
        head: { ref: "notra/site-starter-root" },
        body: starterRootMetadata(""),
        html_url: "root",
      },
      {
        head: { ref: "notra/site-starter-unknown" },
        body: null,
        html_url: "unknown",
      },
      {
        head: { ref: "notra/site-starter-nested" },
        body: "- `hosted-site/blog.json`",
        html_url: "nested",
      },
    ];
    expect((await siteStarterStatus(scope)).pullRequestUrl).toBe("nested");
    expect(request.mock.calls[0]?.[1]).toMatchObject({ base: "main" });
  });

  test("existing config is checked before PR reuse and never overwritten", async () => {
    pulls = [
      {
        head: { ref: "notra/site-starter-nested" },
        body: starterRootMetadata("hosted-site"),
        html_url: "nested",
      },
    ];
    for (const content of ["", "not json", "{}"]) {
      configFiles.set("main:hosted-site/blog.json", content);
      await expect(createSiteStarter(scope)).rejects.toThrow(
        "hosted-site/blog.json already exists on main"
      );
    }
    expect(request).not.toHaveBeenCalled();
    expect(write).not.toHaveBeenCalled();
  });

  test("create reuses only a PR matching its normalized root", async () => {
    pulls = [
      {
        head: { ref: "notra/site-starter-nested" },
        body: starterRootMetadata("hosted-site"),
        html_url: "nested",
      },
    ];
    expect(
      await createSiteStarter({ ...scope, rootDirectory: " /hosted-site/ " })
    ).toEqual({ pullRequestUrl: "nested", created: false });
    expect(write).not.toHaveBeenCalled();
  });

  test("wrong-root PR does not prevent a new starter with explicit metadata", async () => {
    pulls = [
      {
        head: { ref: "notra/site-starter-root" },
        body: starterRootMetadata(""),
        html_url: "root",
      },
    ];
    expect((await createSiteStarter(scope)).created).toBe(true);
    expect(body).toContain(starterRootMetadata("hosted-site"));
    expect(body).toContain("- `hosted-site/blog.json`");
    expect(write).toHaveBeenCalledTimes(2);
  });

  test("status read failure remains an error, not a missing config", async () => {
    readFile.mockImplementationOnce(async () => {
      throw new Error("read failed");
    });
    await expect(siteStarterStatus(scope)).rejects.toThrow("read failed");
  });
}

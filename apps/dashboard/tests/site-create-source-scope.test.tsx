import { beforeEach, expect, mock, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import type { ReactNode, SetStateAction } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IntlProvider } from "use-intl";

import en from "../messages/en.json";
import type {
  SiteCreateSourceFieldsProps,
  SiteImportListProps,
} from "../src/types/components/sites";
import type { SiteCreateFormValues } from "../src/types/sites";

if (!process.env.NOTRA_SOURCE_SCOPE_WORKER) {
  test("form clears local PRs and rejects delayed old-source completions", () => {
    const result = spawnSync(
      process.execPath,
      ["test", fileURLToPath(import.meta.url)],
      {
        cwd: fileURLToPath(new URL("../../..", import.meta.url)),
        env: { ...process.env, NOTRA_SOURCE_SCOPE_WORKER: "1" },
        timeout: 30_000,
      }
    );
    expect(result.status, result.stderr?.toString()).toBe(0);
  });
} else {
  const react = await import("react");
  const originalUseState = react.useState;
  const updates: unknown[] = [];
  let sourceProps: SiteCreateSourceFieldsProps | undefined;
  let importProps: SiteImportListProps | undefined;
  mock.module("react", () => ({
    ...react,
    useState: <S,>(initial: S | (() => S)) => {
      const [state, setState] = originalUseState(initial);
      return [
        state,
        (value: SetStateAction<S>) => {
          updates.push(value);
          setState(value);
        },
      ] as const;
    },
  }));
  mock.module("../src/lib/hooks/use-active-project", () => ({
    useActiveProject: () => ({ projectId: null }),
  }));
  mock.module("../src/lib/hooks/use-create-site", () => ({
    useCreateSite: () => ({ isPending: false }),
  }));
  mock.module("../src/lib/hooks/use-importable-repositories", () => ({
    useImportableRepositories: () => ({
      data: { installed: true, repositories: [] },
      isPending: false,
    }),
    useConnectSiteRepository: () => ({
      mutateAsync: async () => {
        throw new Error("unexpected connect");
      },
    }),
  }));
  mock.module("../src/lib/hooks/use-repository-suggestions", () => ({
    useRepositorySuggestions: () => ({
      branches: [],
      configDirectories: [],
      isLoading: false,
      isReady: true,
    }),
  }));
  mock.module("../src/components/sites/site-create-source-fields", () => ({
    SiteCreateSourceFields: (props: SiteCreateSourceFieldsProps) => {
      sourceProps = props;
      return null;
    },
  }));
  mock.module("../src/components/sites/site-import-list", () => ({
    SiteImportList: (props: SiteImportListProps) => {
      importProps = props;
      return null;
    },
  }));
  mock.module("../src/components/sites/site-create-deploy", () => ({
    SiteCreateDeploy: () => null,
  }));
  mock.module("../src/components/sites/site-create-stage", () => ({
    SiteCreateStage: ({ children }: { children?: ReactNode }) => children,
  }));
  mock.module("../src/components/sites/site-create-step", () => ({
    SiteCreateStep: ({ children }: { children?: ReactNode }) => children,
  }));
  const { SiteCreateForm } =
    await import("../src/components/sites/site-create-form");
  const { siteCreateInput } = await import("../src/utils/site-create");
  const { useSiteRootDirectoryToggle } =
    await import("../src/lib/hooks/use-site-root-directory-toggle");
  beforeEach(() => {
    updates.length = 0;
    renderToStaticMarkup(
      <IntlProvider locale="en" messages={en} timeZone="UTC">
        <SiteCreateForm
          organizationId="organization"
          organizationSlug="example"
          hostingDomain="sites.example"
        />
      </IntlProvider>
    );
    updates.length = 0;
  });

  test("current-source PR results are accepted and unrelated edits preserve them", () => {
    sourceProps?.onChange("name", "Changed name");
    sourceProps?.onStarterPullRequestOpened(
      "https://github.example/current/pull/1"
    );
    expect(updates).toContain("https://github.example/current/pull/1");
    expect(updates).not.toContain(null);
  });
  test("choosing an existing directory updates deployment input and opens the subdirectory switch", () => {
    if (!sourceProps) {
      throw new Error("Source fields were not rendered");
    }
    sourceProps.onChange("rootDirectory", "hosted-site");
    const updateForm = updates.find((value) => typeof value === "function");
    if (typeof updateForm !== "function") {
      throw new Error("Form update was not called");
    }
    const next: SiteCreateFormValues = updateForm(sourceProps.form);
    expect(next.rootDirectory).toBe("hosted-site");
    expect(
      siteCreateInput(next, sourceProps.sections, {
        organizationId: "organization",
        repositoryId: "repository",
        projectId: null,
      }).rootDirectory
    ).toBe("hosted-site");
    const Toggle = () => (
      <span>
        {String(
          useSiteRootDirectoryToggle(next.rootDirectory, () => {}).checked
        )}
      </span>
    );
    expect(renderToStaticMarkup(<Toggle />)).toBe("<span>true</span>");
  });
  test.each(["branch", "rootDirectory", "repositoryId"] as const)(
    "%s changes clear local links and reject a late completion, even after reverting",
    (field) => {
      sourceProps?.onStarterPullRequestOpened(
        "https://github.example/current/pull/1"
      );
      updates.length = 0;
      sourceProps?.onChange(field, "changed");
      sourceProps?.onChange(
        field,
        sourceProps.form[field] as SiteCreateFormValues[typeof field]
      );
      sourceProps?.onStarterPullRequestOpened(
        "https://github.example/old/pull/2"
      );
      expect(updates).toContain(null);
      expect(updates).not.toContain("https://github.example/old/pull/2");
    }
  );
  test("repository import also invalidates a pending old-source completion", async () => {
    await importProps?.onImport({
      githubRepositoryId: "new",
      integrationId: "new-integration",
      owner: "example",
      repo: "other",
      defaultBranch: "main",
      private: false,
      description: null,
    });
    sourceProps?.onStarterPullRequestOpened(
      "https://github.example/old/pull/2"
    );
    expect(updates).toContain(null);
    expect(updates).not.toContain("https://github.example/old/pull/2");
  });
}

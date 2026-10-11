import { beforeEach, describe, expect, mock, test } from "bun:test";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

import type { ReactNode } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { IntlProvider } from "use-intl";

import de from "../messages/de.json";
import en from "../messages/en.json";
import type { SiteCreateStarterProps } from "../src/types/components/sites";

if (!process.env.NOTRA_EXISTING_CONFIG_WORKER) {
  test("explicit existing-config choices and starter source readiness", () => {
    const result = spawnSync(
      process.execPath,
      ["test", fileURLToPath(import.meta.url)],
      {
        cwd: fileURLToPath(new URL("../../..", import.meta.url)),
        env: { ...process.env, NOTRA_EXISTING_CONFIG_WORKER: "1" },
        timeout: 30_000,
      }
    );
    expect(result.status, result.stderr?.toString()).toBe(0);
  });
} else {
  let status = {
    isReady: true,
    data: { hasConfig: false, pullRequestUrl: null as string | null },
  };
  const choose = mock((_value: string) => {});
  const mutate = mock(() => {});
  const buttons: { onClick?: () => void; children?: ReactNode }[] = [];
  mock.module("../src/lib/hooks/use-site-starter", () => ({
    useSiteStarterStatus: () => status,
    useCreateSiteStarter: () => ({ isPending: false, mutate }),
  }));
  mock.module("../src/components/button", () => ({
    Button: (props: { onClick?: () => void; children?: ReactNode }) => {
      buttons.push(props);
      return (
        <button type="button" onClick={props.onClick}>
          {props.children}
        </button>
      );
    },
  }));
  const { SiteCreateStarter } =
    await import("../src/components/sites/site-create-starter");
  const props: SiteCreateStarterProps = {
    organizationId: "organization",
    repositoryId: "repository",
    branch: "main",
    rootDirectory: "",
    pullRequestUrl: null,
    onPullRequestOpened: () => {},
    configDirectories: [],
    suggestionsReady: true,
    onRootDirectoryChange: choose,
  };
  beforeEach(() => {
    status = {
      isReady: true,
      data: { hasConfig: false, pullRequestUrl: null },
    };
    choose.mockClear();
    mutate.mockClear();
    buttons.length = 0;
  });
  describe.each([
    ["en", en],
    ["de", de],
  ] as const)("%s config choices", (locale, messages) => {
    const render = (overrides: Partial<SiteCreateStarterProps> = {}) =>
      renderToStaticMarkup(
        <IntlProvider locale={locale} messages={messages} timeZone="UTC">
          <SiteCreateStarter {...props} {...overrides} />
        </IntlProvider>
      );
    test("root or nested selected config hides the starter even with a local PR", () => {
      status.data.hasConfig = true;
      expect(
        render({
          configDirectories: ["", "hosted-site"],
          pullRequestUrl: "https://github.example/old/pull/1",
        })
      ).toBe("");
      expect(render({ rootDirectory: "hosted-site" })).toBe("");
    });
    test("a sole nested config is an explicit choice, not a silent root change", () => {
      const html = render({ configDirectories: ["hosted-site"] });
      expect(html).toContain(messages.sites.new.starter.existingTitle);
      expect(html).toContain("hosted-site/blog.json");
      expect(html).toContain(
        messages.sites.new.starter.createAt.replace("{path}", "blog.json")
      );
      expect(choose).not.toHaveBeenCalled();
      buttons[0]?.onClick?.();
      expect(choose).toHaveBeenCalledWith("hosted-site");
      expect(mutate).not.toHaveBeenCalled();
    });
    test("multiple configs stay explicit and choosing root uses an empty root", () => {
      const html = render({
        rootDirectory: "new-site",
        configDirectories: ["", "hosted-site", "second", "hosted-site"],
      });
      expect(html).toContain("hosted-site/blog.json");
      expect(html).toContain("second/blog.json");
      expect(buttons).toHaveLength(4);
      expect(choose).not.toHaveBeenCalled();
      buttons[0]?.onClick?.();
      expect(choose).toHaveBeenCalledWith("");
      buttons[2]?.onClick?.();
      expect(choose).toHaveBeenCalledWith("second");
    });
    test("no configs keeps intentional starter creation at the selected location", () => {
      const html = render({ rootDirectory: " /new-site/ " });
      expect(html).not.toContain(messages.sites.new.starter.existingTitle);
      expect(html).toContain("new-site/blog.json");
      expect(html).toContain("main");
      expect(buttons).toHaveLength(1);
    });
    test("unknown suggestions or current status hide choices, create action and stale PR links", () => {
      expect(
        render({
          suggestionsReady: false,
          configDirectories: ["hosted-site"],
          pullRequestUrl: "https://github.example/old/pull/1",
        })
      ).toBe("");
      status.isReady = false;
      expect(
        render({
          configDirectories: ["hosted-site"],
          pullRequestUrl: "https://github.example/old/pull/1",
        })
      ).toBe("");
      expect(buttons).toHaveLength(0);
    });
  });
}

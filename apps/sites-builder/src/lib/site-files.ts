import type { SiteMdxModule, SlotName } from "../types/site-files";

// Optional customer files, compiled into `.notra/work/site` like snippets. Eager globs
// resolve at build time; a file that isn't there is simply absent, so the theme default renders.
const chromeModules = import.meta.glob<SiteMdxModule>(
  "@site/{header,footer}.mdx",
  { eager: true }
);
const slotModules = import.meta.glob<SiteMdxModule>("@site/slots/*.mdx", {
  eager: true,
});

function byFileName(
  modules: Record<string, SiteMdxModule>,
  fileName: string
): SiteMdxModule["default"] | undefined {
  const match = Object.entries(modules).find(([path]) =>
    path.endsWith(`/${fileName}`)
  );
  return match?.[1].default;
}

/** `header.mdx` / `footer.mdx` at the site root, replacing the theme's own. */
export function chromeComponent(
  name: "header" | "footer"
): SiteMdxModule["default"] | undefined {
  return byFileName(chromeModules, `${name}.mdx`);
}

/** `slots/<name>.mdx`, rendered at a fixed place on the theme's pages. */
export function slotComponent(
  name: SlotName
): SiteMdxModule["default"] | undefined {
  return byFileName(slotModules, `${name}.mdx`);
}

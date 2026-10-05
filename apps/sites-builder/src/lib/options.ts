import { config } from "./params";

// The CLI fills in absent `blog` / `changelog` sections with their defaults
// before the build (the theme can't import the schema inside the sandbox).
function required<T>(value: T | undefined, name: string): T {
  if (value === undefined) {
    throw new Error(
      `notra.json ${name} defaults are missing; build through notra-sites`
    );
  }
  return value;
}

const blog = required(config.blog, "blog");
const changelog = required(config.changelog, "changelog");

export function blogOptions(): typeof blog {
  return blog;
}

export function changelogOptions(): typeof changelog {
  return changelog;
}

export function heroOptions(area: "blog" | "changelog") {
  return area === "blog" ? blog.hero : changelog.hero;
}

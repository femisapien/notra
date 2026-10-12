import { defineConfig } from "oxfmt";
import ultracite from "ultracite/oxfmt";

export default defineConfig({
  ...ultracite,
  ignorePatterns: [
    ...ultracite.ignorePatterns,
    "packages/ui/src/**",
    ".agents/skills/**",
    "apps/dashboard/src/components/evilcharts/**",
    "packages/db/migrations/**",
    ".temp/**",
    "examples/**",
    "**/*.{astro,md,mdx,yaml,yml}",
  ],
});

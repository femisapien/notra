import type { LanguageModelMiddleware } from "ai";

/** Production build stub — keeps @ai-sdk/devtools out of workflow server bundles. */
export function devToolsMiddleware(): LanguageModelMiddleware {
  return {
    specificationVersion: "v4",
    async transformParams(options) {
      return options.params;
    },
    async wrapGenerate(options) {
      return options.doGenerate();
    },
    async wrapStream(options) {
      return options.doStream();
    },
  };
}

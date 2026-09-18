import type { GatewayResult } from "@notra/ai/types/gateway";
import type { LanguageModelMiddleware } from "ai";
import { wrapLanguageModel } from "ai";

type DevToolsMiddleware =
  (typeof import("@ai-sdk/devtools"))["devToolsMiddleware"];

export function wrapModelWithDevTools(model: GatewayResult): GatewayResult {
  return wrapLanguageModel({
    model,
    middleware: createLazyDevToolsMiddleware(),
  }) as GatewayResult;
}

function createLazyDevToolsMiddleware(): LanguageModelMiddleware {
  let middlewarePromise: Promise<LanguageModelMiddleware> | undefined;

  const getMiddleware = async () => {
    middlewarePromise ??= import("@ai-sdk/devtools").then(
      ({ devToolsMiddleware }: { devToolsMiddleware: DevToolsMiddleware }) =>
        devToolsMiddleware()
    );
    return middlewarePromise;
  };

  return {
    specificationVersion: "v4",
    async transformParams(options) {
      const middleware = await getMiddleware();
      return middleware.transformParams
        ? middleware.transformParams(options)
        : options.params;
    },
    async wrapGenerate(options) {
      const middleware = await getMiddleware();
      return middleware.wrapGenerate
        ? middleware.wrapGenerate(options)
        : options.doGenerate();
    },
    async wrapStream(options) {
      const middleware = await getMiddleware();
      return middleware.wrapStream
        ? middleware.wrapStream(options)
        : options.doStream();
    },
  };
}

import { beforeEach, expect, mock, test } from "bun:test";

const copyAsFigma = mock(async () => undefined);
const copyAsPaper = mock(async () => undefined);
const loadFallbackFont = mock(async () => {
  /* Inter payload is mocked as already loaded */
});
const toastSuccess = mock(() => undefined);
const toastError = mock(() => undefined);

mock.module("@notra/kiwi", () => ({ copyAsFigma, loadFallbackFont }));
mock.module("@notra/kiwi/paper", () => ({ copyAsPaper }));
mock.module("sonner", () => ({
  toast: {
    success: toastSuccess,
    error: toastError,
  },
}));

const { toast } = await import("sonner");
const {
  copyDiagramScene,
  copyImageAsFigma,
  copyImageAsPaper,
  isImageExportCopyReady,
  preloadImageExportCopy,
  resetImageExportCopyForTests,
} = await import("./image-export");

const exportElement = {} as HTMLElement;

beforeEach(() => {
  copyAsFigma.mockClear();
  copyAsPaper.mockClear();
  loadFallbackFont.mockClear();
  toastError.mockClear();
  toastSuccess.mockClear();
});

function withWindow<T>(run: () => T | Promise<T>): T | Promise<T> {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Object.defineProperty(globalThis, "window", {
    configurable: true,
    value: previousWindow?.value ?? {},
  });
  const restore = () => {
    if (previousWindow) {
      Object.defineProperty(globalThis, "window", previousWindow);
    } else {
      Reflect.deleteProperty(globalThis, "window");
    }
  };
  try {
    const result = run();
    if (result instanceof Promise) {
      return result.finally(restore);
    }
    restore();
    return result;
  } catch (error) {
    restore();
    throw error;
  }
}

test("preload with window warms the kiwi chunk without copying", async () => {
  let paperImports = 0;
  let figmaImports = 0;
  copyAsPaper.mockClear();
  copyAsFigma.mockClear();
  resetImageExportCopyForTests({
    paper: async () => {
      paperImports += 1;
      return (await import("@notra/kiwi/paper")).copyAsPaper;
    },
    figma: async () => {
      figmaImports += 1;
      return (await import("@notra/kiwi")).copyAsFigma;
    },
  });

  try {
    await withWindow(async () => {
      expect(await preloadImageExportCopy("paper")).toBe(true);
      expect(copyAsPaper).not.toHaveBeenCalled();
      expect(copyAsFigma).not.toHaveBeenCalled();
      expect(paperImports).toBe(1);
      expect(figmaImports).toBe(0);

      expect(await preloadImageExportCopy("paper")).toBe(true);
      expect(paperImports).toBe(1);

      await copyImageAsPaper(exportElement);
      expect(copyAsPaper).toHaveBeenCalledTimes(1);
      expect(paperImports).toBe(1);

      expect(await preloadImageExportCopy("figma")).toBe(true);
      expect(copyAsFigma).not.toHaveBeenCalled();
      expect(figmaImports).toBe(1);
    });
  } finally {
    resetImageExportCopyForTests();
  }
});

test("preload with window swallows a failed paper import and click retries", async () => {
  let paperImports = 0;
  copyAsPaper.mockClear();
  resetImageExportCopyForTests({
    paper: async () => {
      paperImports += 1;
      if (paperImports === 1) {
        throw new Error("paper chunk failed");
      }
      return (await import("@notra/kiwi/paper")).copyAsPaper;
    },
  });

  try {
    await withWindow(async () => {
      expect(await preloadImageExportCopy("paper")).toBe(false);
      expect(copyAsPaper).not.toHaveBeenCalled();
      expect(paperImports).toBe(1);

      await copyImageAsPaper(exportElement);
      expect(copyAsPaper).toHaveBeenCalledTimes(1);
      expect(toast.error).not.toHaveBeenCalled();
      expect(paperImports).toBe(2);

      await copyImageAsPaper(exportElement);
      expect(copyAsPaper).toHaveBeenCalledTimes(2);
      expect(paperImports).toBe(2);
    });
  } finally {
    resetImageExportCopyForTests();
  }
});

test("Paper and Figma copy call separate kiwi functions", async () => {
  copyAsFigma.mockClear();
  copyAsPaper.mockClear();
  loadFallbackFont.mockClear();
  resetImageExportCopyForTests();

  await withWindow(async () => {
    expect(await preloadImageExportCopy("paper")).toBe(true);
    expect(await preloadImageExportCopy("figma")).toBe(true);
    expect(loadFallbackFont).toHaveBeenCalledTimes(1);

    await copyImageAsPaper(exportElement);
    expect(copyAsPaper).toHaveBeenCalledWith(exportElement);
    expect(copyAsFigma).not.toHaveBeenCalled();

    await copyImageAsFigma(exportElement, "Card");
    expect(copyAsFigma).toHaveBeenCalledTimes(1);
    expect(copyAsFigma).toHaveBeenCalledWith(exportElement, {
      label: "Card",
      name: "Card",
    });
  });
});

test("Figma copy is not ready until the Inter font chunk loads", async () => {
  let resolveFont: () => void = () => {
    /* assigned when fontReady is constructed */
  };
  const fontReady = new Promise<void>((resolve) => {
    resolveFont = resolve;
  });
  loadFallbackFont.mockImplementation(() => fontReady);
  copyAsFigma.mockClear();
  resetImageExportCopyForTests();

  try {
    await withWindow(async () => {
      const pending = preloadImageExportCopy("figma");
      await Promise.resolve();
      await Promise.resolve();
      expect(isImageExportCopyReady("figma")).toBe(false);
      expect(copyAsFigma).not.toHaveBeenCalled();

      resolveFont();
      expect(await pending).toBe(true);
      expect(isImageExportCopyReady("figma")).toBe(true);
    });
  } finally {
    loadFallbackFont.mockImplementation(async () => {
      /* Inter payload is mocked as already loaded */
    });
    resetImageExportCopyForTests();
  }
});

test("copy waits for an in-flight Figma preload then pastes", async () => {
  let resolveFont: () => void = () => {
    /* assigned when fontReady is constructed */
  };
  const fontReady = new Promise<void>((resolve) => {
    resolveFont = resolve;
  });
  loadFallbackFont.mockImplementation(() => fontReady);
  copyAsFigma.mockClear();
  resetImageExportCopyForTests();

  try {
    await withWindow(async () => {
      const pending = preloadImageExportCopy("figma");
      const copyPromise = copyImageAsFigma(exportElement, "Card");
      await Promise.resolve();
      await Promise.resolve();
      expect(copyAsFigma).not.toHaveBeenCalled();
      expect(toast.error).not.toHaveBeenCalled();

      resolveFont();
      await copyPromise;
      expect(await pending).toBe(true);
      expect(copyAsFigma).toHaveBeenCalledTimes(1);
      expect(toast.success).toHaveBeenCalledWith(
        expect.objectContaining({
          props: {
            namespace: "content.toasts.imageExport",
            messageKey: "figmaCopied",
          },
        })
      );
    });
  } finally {
    loadFallbackFont.mockImplementation(async () => {
      /* Inter payload is mocked as already loaded */
    });
    resetImageExportCopyForTests();
  }
});

test("cold copy awaits the kiwi import then pastes", async () => {
  resetImageExportCopyForTests();

  await withWindow(async () => {
    expect(isImageExportCopyReady("paper")).toBe(false);
    expect(isImageExportCopyReady("figma")).toBe(false);

    await copyImageAsPaper(exportElement);
    expect(copyAsPaper).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();

    await copyImageAsFigma(exportElement, "Card");
    expect(copyAsFigma).toHaveBeenCalledTimes(1);
    expect(loadFallbackFont).toHaveBeenCalledTimes(1);
    expect(toast.error).not.toHaveBeenCalled();
  });
});

test("preload is a no-op without window and does not copy", () => {
  const previousWindow = Object.getOwnPropertyDescriptor(globalThis, "window");
  Reflect.deleteProperty(globalThis, "window");
  copyAsPaper.mockClear();
  copyAsFigma.mockClear();
  try {
    preloadImageExportCopy("paper");
    preloadImageExportCopy("figma");
    expect(copyAsPaper).not.toHaveBeenCalled();
    expect(copyAsFigma).not.toHaveBeenCalled();
  } finally {
    if (previousWindow) {
      Object.defineProperty(globalThis, "window", previousWindow);
    }
  }
});

async function expectNoUnhandledRejection(
  run: () => Promise<void>
): Promise<void> {
  const unhandled: unknown[] = [];
  const onUnhandled = (reason: unknown) => {
    unhandled.push(reason);
  };
  process.on("unhandledRejection", onUnhandled);
  try {
    await run();
    await Promise.resolve();
    await Promise.resolve();
    expect(unhandled).toEqual([]);
  } finally {
    process.off("unhandledRejection", onUnhandled);
  }
}

test("a failed kiwi import during a skipped copy does not reject unhandled", async () => {
  const errorLog = mock(() => undefined);
  const previousError = console.error;
  let figmaImports = 0;
  let paperImports = 0;
  console.error = errorLog;
  resetImageExportCopyForTests({
    figma: async () => {
      figmaImports += 1;
      throw new Error("figma chunk failed");
    },
    paper: async () => {
      paperImports += 1;
      throw new Error("paper chunk failed");
    },
  });

  try {
    await withWindow(async () => {
      await expectNoUnhandledRejection(async () => {
        await copyImageAsFigma(null);
        await copyImageAsPaper(null);
      });
    });
    expect(figmaImports).toBe(1);
    expect(paperImports).toBe(1);
    expect(toast.error).toHaveBeenCalledWith(
      expect.objectContaining({
        props: {
          namespace: "content.toasts.imageExport",
          messageKey: "copyLoading",
        },
      })
    );
  } finally {
    console.error = previousError;
    resetImageExportCopyForTests();
  }
});

function withClipboard(fetchImpl: typeof fetch) {
  const written: ClipboardItem[][] = [];
  const previousFetch = globalThis.fetch;
  const previousNavigator = Object.getOwnPropertyDescriptor(
    globalThis,
    "navigator"
  );
  const previousClipboardItem = globalThis.ClipboardItem;
  class FakeClipboardItem {
    readonly items: Record<string, Promise<Blob> | Blob>;
    constructor(items: Record<string, Promise<Blob> | Blob>) {
      this.items = items;
    }
  }
  globalThis.fetch = fetchImpl;
  globalThis.ClipboardItem =
    FakeClipboardItem as unknown as typeof ClipboardItem;
  Object.defineProperty(globalThis, "navigator", {
    configurable: true,
    value: {
      clipboard: {
        // Like browsers, resolve pending blobs before the write settles.
        write: async (items: ClipboardItem[]) => {
          for (const item of items as unknown as FakeClipboardItem[]) {
            await Promise.all(Object.values(item.items));
          }
          written.push(items);
        },
      },
    },
  });
  return {
    written,
    restore() {
      globalThis.fetch = previousFetch;
      globalThis.ClipboardItem = previousClipboardItem;
      if (previousNavigator) {
        Object.defineProperty(globalThis, "navigator", previousNavigator);
      }
    },
  };
}

test("diagram copy writes the Excalidraw clipboard shape that tldraw also reads", async () => {
  const requested: string[] = [];
  const clipboard = withClipboard((async (url: string) => {
    requested.push(url);
    return Response.json({
      type: "excalidraw",
      elements: [{ id: "a", type: "rectangle" }],
      files: {},
      appState: { viewBackgroundColor: "#fff" },
    });
  }) as typeof fetch);

  try {
    await copyDiagramScene("/api/scene", "tldraw");
    const [items] = clipboard.written;
    const item = items?.[0] as unknown as {
      items: Record<string, Promise<Blob>>;
    };
    const blob = await item.items["text/plain"];
    const payload = JSON.parse((await blob?.text()) ?? "{}");

    expect(requested).toEqual(["/api/scene"]);
    expect(payload).toEqual({
      type: "excalidraw/clipboard",
      elements: [{ id: "a", type: "rectangle" }],
      files: {},
    });
    expect(toast.success).toHaveBeenCalledWith(
      expect.objectContaining({
        props: {
          namespace: "content.toasts.imageExport",
          messageKey: "tldrawCopied",
        },
      })
    );
  } finally {
    clipboard.restore();
  }
});

test("diagram copy reports a failed scene download instead of writing junk", async () => {
  const errorLog = mock(() => undefined);
  const previousError = console.error;
  console.error = errorLog;
  const clipboard = withClipboard(
    (async () =>
      new Response("missing", { status: 404 })) as unknown as typeof fetch
  );

  try {
    await copyDiagramScene("/api/scene", "excalidraw");
    expect(clipboard.written).toHaveLength(0);
    expect(toast.error).toHaveBeenCalledWith(
      expect.objectContaining({
        props: {
          namespace: "content.toasts.imageExport",
          messageKey: "diagramCopyFailed",
        },
      })
    );
  } finally {
    console.error = previousError;
    clipboard.restore();
  }
});

test("diagram copy without a scene says the image is not ready", async () => {
  await copyDiagramScene(null, "excalidraw");
  expect(toast.error).toHaveBeenCalledWith(
    expect.objectContaining({
      props: {
        namespace: "content.toasts.imageExport",
        messageKey: "imageNotReady",
      },
    })
  );
});

import {
  DIAGRAM_DEFAULT_FONT_SIZE,
  DIAGRAM_DEFAULT_ROUGHNESS,
  DIAGRAM_DEFAULT_STROKE,
  DIAGRAM_DEFAULT_STROKE_WIDTH,
  DIAGRAM_EDIT_ATTEMPTS,
  DIAGRAM_EDIT_MAX_OUTPUT_TOKENS,
  DIAGRAM_EDIT_MODEL_ID,
  DIAGRAM_EDIT_PROVIDER_OPTIONS,
  DIAGRAM_SHAPE_TYPES,
  JSON_CODE_FENCE_REGEX,
} from "@notra/ai/constants/excalidraw-diagram";
import { gateway } from "@notra/ai/gateway";
import {
  buildDiagramEditPrompt,
  buildDiagramEditSystemPrompt,
} from "@notra/ai/prompts/diagram-edit";
import { withRouterDefaults } from "@notra/ai/provider-options";
import { diagramSpecSchema } from "@notra/ai/schemas/excalidraw-diagram";
import type { AgentTokenUsage } from "@notra/ai/types/agents";
import type { DiagramSpec } from "@notra/ai/types/excalidraw-diagram";
import {
  describeDiagramSpecError,
  isDiagramSpecError,
  readDiagramSpec,
} from "@notra/ai/utils/excalidraw-diagram";
import { findDiagramLayoutIssues } from "@notra/ai/utils/excalidraw-layout-check";
import { renderDiagram } from "@notra/ai/utils/excalidraw-render";
import {
  uploadGeneratedExcalidrawAsset,
  uploadGeneratedHtmlAsset,
  uploadGeneratedImageAsset,
} from "@notra/ai/utils/image-assets";
import { trackImageGenerationUsage } from "@notra/ai/utils/image-post-service";
import { toAgentTokenUsage } from "@notra/ai/utils/token-usage";
import { db } from "@notra/db/drizzle";
import { posts } from "@notra/db/schema";
import { generateText } from "ai";
import { and, eq } from "drizzle-orm";

type SceneRecord = Record<string, unknown>;

const VERCEL_MODEL_PREFIX_REGEX = /^vercel\//;

function isRecord(value: unknown): value is SceneRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function readString(record: SceneRecord, key: string) {
  const value = record[key];
  return typeof value === "string" ? value : undefined;
}

function readNumber(record: SceneRecord, key: string) {
  const value = record[key];
  return typeof value === "number" && Number.isFinite(value)
    ? value
    : undefined;
}

function isShapeType(
  type: string | undefined
): type is (typeof DIAGRAM_SHAPE_TYPES)[number] {
  return DIAGRAM_SHAPE_TYPES.some((shapeType) => shapeType === type);
}

// Values the spec would fall back to anyway. Leaving them out keeps the spec
// close to what an agent writes and cheap to send back to the model.
const STYLE_DEFAULTS: Record<string, string | number> = {
  strokeColor: DIAGRAM_DEFAULT_STROKE,
  backgroundColor: "transparent",
  fillStyle: "solid",
  strokeWidth: DIAGRAM_DEFAULT_STROKE_WIDTH,
  strokeStyle: "solid",
  roughness: DIAGRAM_DEFAULT_ROUGHNESS,
  opacity: 100,
};

function round(value: number | undefined) {
  return value === undefined ? undefined : Math.round(value);
}

function readStyle(element: SceneRecord) {
  const style: Record<string, string | number> = {};
  for (const [key, fallback] of Object.entries(STYLE_DEFAULTS)) {
    const value = element[key];
    if (
      (typeof value === "string" || typeof value === "number") &&
      value !== fallback
    ) {
      style[key] = value;
    }
  }
  return style;
}

function readBindingId(element: SceneRecord, key: string) {
  const binding = element[key];
  return isRecord(binding) ? readString(binding, "elementId") : undefined;
}

/**
 * Converts an Excalidraw scene edited by hand back into the compact spec, so
 * later AI edits start from what the user drew. Freedraw, images, and frames
 * have no spec equivalent and are reported as dropped.
 */
export function sceneToDiagramSpec(scene: unknown): {
  spec: DiagramSpec;
  droppedTypes: string[];
} {
  const sceneRecord = isRecord(scene) ? scene : {};
  const rawElements = Array.isArray(sceneRecord.elements)
    ? sceneRecord.elements.filter(isRecord)
    : [];
  const elements = rawElements.filter((element) => element.isDeleted !== true);
  const appState = isRecord(sceneRecord.appState) ? sceneRecord.appState : {};

  const labels = new Map<string, SceneRecord>();
  for (const element of elements) {
    const containerId = readString(element, "containerId");
    if (element.type === "text" && containerId) {
      labels.set(containerId, element);
    }
  }
  const labelFor = (id: string | undefined) => {
    const label = id ? labels.get(id) : undefined;
    const text = label
      ? (readString(label, "originalText") ?? readString(label, "text"))
      : undefined;
    if (!(label && text?.trim())) {
      return undefined;
    }
    const fontSize = readNumber(label, "fontSize");
    const strokeColor = readString(label, "strokeColor");
    const containerStroke = id
      ? readString(
          elements.find((element) => element.id === id) ?? {},
          "strokeColor"
        )
      : undefined;
    if (
      fontSize === DIAGRAM_DEFAULT_FONT_SIZE &&
      (!strokeColor || strokeColor === containerStroke)
    ) {
      return text;
    }
    return {
      text,
      fontSize,
      strokeColor: strokeColor === containerStroke ? undefined : strokeColor,
    };
  };

  const shapeIds = new Set(
    elements
      .filter((element) => isShapeType(readString(element, "type")))
      .map((element) => readString(element, "id"))
  );
  const droppedTypes = new Set<string>();
  const specElements: unknown[] = [];

  for (const element of elements) {
    const type = readString(element, "type");
    const id = readString(element, "id");
    const x = readNumber(element, "x") ?? 0;
    const y = readNumber(element, "y") ?? 0;

    if (isShapeType(type)) {
      const rounded =
        element.roundness !== null && element.roundness !== undefined;
      specElements.push({
        type,
        id,
        x: round(x),
        y: round(y),
        width: round(readNumber(element, "width")),
        height: round(readNumber(element, "height")),
        // Rectangles default to rounded corners; other shapes to sharp ones.
        rounded: rounded === (type === "rectangle") ? undefined : rounded,
        label: labelFor(id),
        ...readStyle(element),
      });
    } else if (type === "text") {
      if (readString(element, "containerId")) {
        continue;
      }
      const textAlign = readString(element, "textAlign");
      specElements.push({
        type,
        id,
        x: round(x),
        y: round(y),
        text:
          readString(element, "originalText") ?? readString(element, "text"),
        fontSize: readNumber(element, "fontSize"),
        textAlign: textAlign === "left" ? undefined : textAlign,
        ...readStyle(element),
      });
    } else if (type === "arrow" || type === "line") {
      const points = Array.isArray(element.points)
        ? element.points.filter(
            (point): point is [number, number] =>
              Array.isArray(point) &&
              typeof point[0] === "number" &&
              typeof point[1] === "number"
          )
        : [];
      const absolute = points.map(
        ([px, py]) =>
          [Math.round(x + px), Math.round(y + py)] as [number, number]
      );
      const first = absolute[0] ?? [x, y];
      const last = absolute.at(-1) ?? first;
      const startId = readBindingId(element, "startBinding");
      const endId = readBindingId(element, "endBinding");
      const defaultEnd = type === "arrow" ? "arrow" : null;
      const arrowhead = (key: string, fallback: string | null) => {
        const value = element[key] ?? null;
        if (value === fallback) {
          return undefined;
        }
        return value === null ? "none" : value;
      };
      specElements.push({
        type,
        id,
        start:
          startId && shapeIds.has(startId)
            ? { id: startId }
            : { x: first[0], y: first[1] },
        end:
          endId && shapeIds.has(endId)
            ? { id: endId }
            : { x: last[0], y: last[1] },
        via: absolute.length > 2 ? absolute.slice(1, -1) : undefined,
        label: labelFor(id),
        startArrowhead: arrowhead("startArrowhead", null),
        endArrowhead: arrowhead("endArrowhead", defaultEnd),
        ...readStyle(element),
      });
    } else if (type) {
      droppedTypes.add(type);
    }
  }

  const spec = diagramSpecSchema.parse({
    background: readString(appState, "viewBackgroundColor"),
    elements: specElements,
  });
  return { spec, droppedTypes: [...droppedTypes] };
}

// Models often write a multi-line label with a literal line break instead of
// "\n", which is invalid JSON. Escape raw line breaks that sit inside strings.
function escapeRawNewlinesInStrings(json: string) {
  let output = "";
  let inString = false;
  let escaped = false;
  for (const char of json) {
    if (inString && (char === "\n" || char === "\r")) {
      output += char === "\n" ? "\\n" : "";
      escaped = false;
      continue;
    }
    if (char === '"' && !escaped) {
      inString = !inString;
    }
    escaped = inString && char === "\\" && !escaped;
    output += char;
  }
  return output;
}

/** Parses a model answer into a spec, tolerating code fences and raw newlines. */
export function parseDiagramSpecText(text: string): DiagramSpec {
  const fenced = text.match(JSON_CODE_FENCE_REGEX)?.[1];
  const candidate = (fenced ?? text).trim();
  const start = candidate.indexOf("{");
  const end = candidate.lastIndexOf("}");
  const json =
    start >= 0 && end > start ? candidate.slice(start, end + 1) : candidate;
  return diagramSpecSchema.parse(JSON.parse(escapeRawNewlinesInStrings(json)));
}

/** Applies a natural-language change to a diagram spec without a sandbox. */
export async function editDiagramSpecWithAi(params: {
  spec: DiagramSpec;
  prompt: string;
  organizationId: string;
  /** Override for model comparisons; production uses DIAGRAM_EDIT_MODEL_ID. */
  modelId?: string;
  providerOptions?: Record<string, Record<string, unknown>>;
}): Promise<{
  spec: DiagramSpec;
  usage: AgentTokenUsage;
  attempts: number;
  layoutIssues: string[];
}> {
  const modelId = params.modelId ?? DIAGRAM_EDIT_MODEL_ID;
  const usage: AgentTokenUsage = {
    inputTokens: 0,
    outputTokens: 0,
    totalTokens: 0,
    cacheReadTokens: 0,
    cacheWriteTokens: 0,
    // Billing prices by provider model id; the "vercel/" routing prefix is
    // not in the pricing table for every model.
    modelId: modelId.replace(VERCEL_MODEL_PREFIX_REGEX, ""),
  };
  let best: { spec: DiagramSpec; issues: string[] } | undefined;
  let error: string | undefined;
  let lastValid: DiagramSpec | undefined;
  // Fix what is already broken in the same pass, so the first answer can pass
  // the layout check.
  const existingIssues = findDiagramLayoutIssues(
    (await renderDiagram(params.spec)).scene
  );
  const request =
    existingIssues.length > 0
      ? `${params.prompt}\n\nThe current diagram also has these layout problems. Fix them too:\n- ${existingIssues.join("\n- ")}`
      : params.prompt;

  for (let attempt = 1; attempt <= DIAGRAM_EDIT_ATTEMPTS; attempt++) {
    const result = await generateText({
      model: gateway(modelId, {
        organizationId: params.organizationId,
      }),
      system: buildDiagramEditSystemPrompt(),
      // After a layout-only failure, fix the previous answer instead of
      // redoing the whole change from the original diagram.
      prompt: lastValid
        ? buildDiagramEditPrompt({
            spec: lastValid,
            prompt: `Fix these layout problems and change nothing else:\n${error}`,
          })
        : buildDiagramEditPrompt({
            spec: params.spec,
            prompt: request,
            error,
          }),
      maxOutputTokens: DIAGRAM_EDIT_MAX_OUTPUT_TOKENS,
      providerOptions: withRouterDefaults(
        {
          gateway: { tags: ["content-diagram-edit"] },
          ...(params.providerOptions ?? DIAGRAM_EDIT_PROVIDER_OPTIONS),
        },
        { modelId }
      ),
    });
    const callUsage = toAgentTokenUsage(result.usage);
    usage.inputTokens += callUsage.inputTokens;
    usage.outputTokens += callUsage.outputTokens;
    usage.totalTokens += callUsage.totalTokens;
    usage.cacheReadTokens += callUsage.cacheReadTokens;
    usage.cacheWriteTokens += callUsage.cacheWriteTokens;

    try {
      const spec = parseDiagramSpecText(result.text);
      // Building the scene catches dangling arrow ids before we save anything.
      const rendered = await renderDiagram(spec);
      const issues = findDiagramLayoutIssues(rendered.scene);
      if (issues.length === 0) {
        return { spec, usage, attempts: attempt, layoutIssues: [] };
      }
      // Layout issues are worth one more round, but an imperfect valid
      // diagram beats failing the edit.
      lastValid = spec;
      // A fix round can make things worse; keep the attempt with the fewest
      // problems as the fallback.
      if (!best || issues.length < best.issues.length) {
        best = { spec, issues };
      }
      error = `- ${issues.join("\n- ")}`;
    } catch (caught) {
      if (!isDiagramSpecError(caught)) {
        throw caught;
      }
      error = describeDiagramSpecError(caught);
    }
    console.warn(
      `[diagram-edit] attempt ${attempt}/${DIAGRAM_EDIT_ATTEMPTS} (finish: ${result.finishReason}, ${result.text.length} chars): ${error}`
    );
  }

  if (best) {
    return {
      spec: best.spec,
      usage,
      attempts: DIAGRAM_EDIT_ATTEMPTS,
      layoutIssues: best.issues,
    };
  }
  throw new Error(`The diagram edit did not produce a valid diagram: ${error}`);
}

function readExcalidrawUrl(metadata: unknown) {
  return isRecord(metadata) ? readString(metadata, "excalidrawUrl") : undefined;
}

// Posts saved before the spec was stored only have the scene; derive the spec
// from it so they can be edited the same way.
async function resolveDiagramSpec(metadata: unknown) {
  const spec = readDiagramSpec(metadata);
  const excalidrawUrl = readExcalidrawUrl(metadata);
  if (spec || !excalidrawUrl) {
    return spec;
  }
  const response = await fetch(excalidrawUrl);
  if (!response.ok) {
    throw new Error(`Failed to load the diagram scene: ${response.status}`);
  }
  return sceneToDiagramSpec(await response.json()).spec;
}

async function loadDiagramPost(organizationId: string, postId: string) {
  const post = await db.query.posts.findFirst({
    where: and(eq(posts.id, postId), eq(posts.organizationId, organizationId)),
  });
  if (!post || post.contentType !== "image") {
    throw new Error("Diagram post not found");
  }
  const metadata = isRecord(post.sourceMetadata) ? post.sourceMetadata : {};
  return { post, metadata };
}

/** Renders a spec and stores it as the post's current image, scene, and spec. */
export async function saveDiagramRevision(params: {
  organizationId: string;
  postId: string;
  spec: DiagramSpec;
  edit: { kind: "ai" | "manual"; prompt?: string };
  title?: string;
}) {
  const [{ metadata }, rendered] = await Promise.all([
    loadDiagramPost(params.organizationId, params.postId),
    renderDiagram(params.spec),
  ]);
  const [imageUrl, htmlUrl, excalidrawUrl] = await Promise.all([
    uploadGeneratedImageAsset({
      organizationId: params.organizationId,
      pngBase64: rendered.pngBase64,
      postId: params.postId,
    }),
    uploadGeneratedHtmlAsset({
      organizationId: params.organizationId,
      html: rendered.html,
      postId: params.postId,
    }),
    uploadGeneratedExcalidrawAsset({
      organizationId: params.organizationId,
      scene: rendered.scene,
      postId: params.postId,
    }),
  ]);

  await db
    .update(posts)
    .set({
      ...(params.title ? { title: params.title } : {}),
      content: imageUrl,
      htmlUrl,
      markdown: null,
      sourceMetadata: {
        ...metadata,
        format: "diagram",
        excalidrawUrl,
        diagramSpec: rendered.spec,
        lastDiagramEdit: {
          kind: params.edit.kind,
          prompt: params.edit.prompt ?? null,
          at: new Date().toISOString(),
        },
      },
      updatedAt: new Date(),
    })
    .where(
      and(
        eq(posts.id, params.postId),
        eq(posts.organizationId, params.organizationId)
      )
    );

  return { imageUrl, excalidrawUrl };
}

/** True when the post is a diagram whose spec can be edited without a sandbox. */
export function canEditDiagramWithoutSandbox(metadata: unknown) {
  return (
    readDiagramSpec(metadata) !== null ||
    (isRecord(metadata) &&
      metadata.format === "diagram" &&
      readExcalidrawUrl(metadata) !== undefined)
  );
}

/**
 * Chat revision for diagrams: edit the spec with one model call and re-render.
 * Takes seconds instead of the minutes a sandbox restore needs.
 */
export async function reviseDiagramPost(params: {
  organizationId: string;
  postId: string;
  prompt: string;
  title?: string;
  useMarkup?: boolean;
  chargeAiCredits?: boolean;
}) {
  const { post, metadata } = await loadDiagramPost(
    params.organizationId,
    params.postId
  );
  const spec = await resolveDiagramSpec(metadata);
  if (!spec) {
    throw new Error("This image has no editable diagram");
  }

  const edited = await editDiagramSpecWithAi({
    spec,
    prompt: params.prompt,
    organizationId: params.organizationId,
  });
  const { imageUrl } = await saveDiagramRevision({
    organizationId: params.organizationId,
    postId: params.postId,
    spec: edited.spec,
    edit: { kind: "ai", prompt: params.prompt },
    title: params.title,
  });
  await trackImageGenerationUsage({
    organizationId: params.organizationId,
    postId: params.postId,
    usage: edited.usage,
    useMarkup: params.useMarkup,
    chargeAiCredits: params.chargeAiCredits,
  });

  return {
    postId: params.postId,
    title: params.title ?? post.title,
    imageUrl,
    status: "updated",
    contentType: "image",
    sandbox: null,
    usage: edited.usage,
  };
}

import {
  DIAGRAM_DEFAULT_FONT_SIZE,
  DIAGRAM_DEFAULT_ROUGHNESS,
  DIAGRAM_DEFAULT_STROKE,
  DIAGRAM_DEFAULT_STROKE_WIDTH,
  DIAGRAM_ANGLE_TOLERANCE,
  DIAGRAM_ATTACHMENT_TOLERANCE,
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
import type {
  DiagramShapeGeometry,
  DiagramSpec,
} from "@notra/ai/types/excalidraw-diagram";
import {
  boundPoint,
  describeDiagramSpecError,
  isDiagramSpecError,
  readDiagramSpec,
  shapeCenter,
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

function readAngle(element: SceneRecord) {
  const angle = readNumber(element, "angle") ?? 0;
  return Math.abs(angle) > DIAGRAM_ANGLE_TOLERANCE
    ? Math.round(angle * 1000) / 1000
    : undefined;
}

function shapeGeometry(shape: SceneRecord): DiagramShapeGeometry | undefined {
  const type = readString(shape, "type");
  const width = readNumber(shape, "width") ?? 0;
  const height = readNumber(shape, "height") ?? 0;
  if (!(isShapeType(type) && width && height)) {
    return undefined;
  }
  return {
    type,
    x: readNumber(shape, "x") ?? 0,
    y: readNumber(shape, "y") ?? 0,
    width,
    height,
    angle: readNumber(shape, "angle") ?? 0,
  };
}

/**
 * A bound arrow end as a spec endpoint. An end where Notra would snap it
 * anyway (the edge facing `toward`) stays a plain id; one the user moved
 * elsewhere keeps its position as a fraction of the shape's unrotated box,
 * plus Excalidraw's focus so the editor keeps it when the shape moves.
 */
function boundEndpoint(
  element: SceneRecord,
  key: "startBinding" | "endBinding",
  point: [number, number],
  toward: [number, number],
  shapes: Map<string, SceneRecord>
) {
  const binding = element[key];
  const shapeId = isRecord(binding)
    ? readString(binding, "elementId")
    : undefined;
  const shapeRecord = shapeId ? shapes.get(shapeId) : undefined;
  const shape = shapeRecord ? shapeGeometry(shapeRecord) : undefined;
  if (!(shapeId && shape && isRecord(binding))) {
    return undefined;
  }
  const [snapX, snapY] = boundPoint(shape, undefined, toward);
  if (
    Math.hypot(point[0] - snapX, point[1] - snapY) <=
    DIAGRAM_ATTACHMENT_TOLERANCE
  ) {
    return { id: shapeId };
  }
  // Undo the shape's rotation so the anchor is in its own frame.
  const [cx, cy] = shapeCenter(shape);
  const cos = Math.cos(-shape.angle);
  const sin = Math.sin(-shape.angle);
  const dx = point[0] - cx;
  const dy = point[1] - cy;
  const localX = cx + dx * cos - dy * sin;
  const localY = cy + dx * sin + dy * cos;
  const fraction = (value: number) =>
    Math.min(2, Math.max(-1, Math.round(value * 1000) / 1000));
  const focus = readNumber(binding, "focus") ?? 0;
  return {
    id: shapeId,
    anchor: [
      fraction((localX - shape.x) / shape.width),
      fraction((localY - shape.y) / shape.height),
    ],
    focus: Math.min(1, Math.max(-1, Math.round(focus * 1000) / 1000)),
  };
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

  const shapes = new Map<string, SceneRecord>();
  for (const element of elements) {
    const id = readString(element, "id");
    if (id && isShapeType(readString(element, "type"))) {
      shapes.set(id, element);
    }
  }
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
        angle: readAngle(element),
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
        angle: readAngle(element),
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
      // Mirror the scene builder: a bound end faces the next point, or the
      // other end's shape center when there are no waypoints.
      const boundCenter = (key: "startBinding" | "endBinding") => {
        const binding = element[key];
        const shapeId = isRecord(binding)
          ? readString(binding, "elementId")
          : undefined;
        const shape = shapeId ? shapes.get(shapeId) : undefined;
        const geometry = shape ? shapeGeometry(shape) : undefined;
        return geometry ? shapeCenter(geometry) : undefined;
      };
      const hasVia = absolute.length > 2;
      const startToward =
        (hasVia ? absolute[1] : undefined) ?? boundCenter("endBinding") ?? last;
      const endToward =
        (hasVia ? absolute.at(-2) : undefined) ??
        boundCenter("startBinding") ??
        first;
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
        start: boundEndpoint(
          element,
          "startBinding",
          first,
          startToward,
          shapes
        ) ?? {
          x: first[0],
          y: first[1],
        },
        end: boundEndpoint(element, "endBinding", last, endToward, shapes) ?? {
          x: last[0],
          y: last[1],
        },
        via: hasVia ? absolute.slice(1, -1) : undefined,
        curved:
          hasVia &&
          element.roundness !== null &&
          element.roundness !== undefined
            ? true
            : undefined,
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

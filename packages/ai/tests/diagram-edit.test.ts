import { describe, expect, mock, test } from "bun:test";

// diagram-edit pulls in the DB and asset helpers for saving; the pure helpers
// under test never touch them.
mock.module("@notra/db/drizzle", () => ({ db: {} }));

const { diagramSpecSchema } = await import("../src/schemas/excalidraw-diagram");
const { buildExcalidrawScene } =
  await import("../src/utils/excalidraw-diagram");
const { findDiagramLayoutIssues } =
  await import("../src/utils/excalidraw-layout-check");
const { parseDiagramSpecText, sceneToDiagramSpec } =
  await import("../src/utils/diagram-edit");

const measurer = {
  measure(text: string, fontSize: number) {
    const lines = text.split("\n");
    return {
      width: Math.max(...lines.map((line) => line.length)) * fontSize * 0.5,
      height: lines.length * fontSize * 1.25,
    };
  },
};

function sceneOf(raw: unknown) {
  return buildExcalidrawScene(diagramSpecSchema.parse(raw), measurer);
}

const flow = {
  background: "#ffffff",
  elements: [
    { type: "text", x: 0, y: 0, text: "Queue flow", fontSize: 40 },
    {
      type: "rectangle",
      id: "event",
      x: 0,
      y: 120,
      width: 200,
      height: 90,
      label: "Event",
      backgroundColor: "#a5d8ff",
    },
    {
      type: "diamond",
      id: "ok",
      x: 400,
      y: 105,
      width: 200,
      height: 120,
      label: "2xx?",
    },
    {
      type: "ellipse",
      id: "done",
      x: 800,
      y: 120,
      width: 200,
      height: 90,
      label: { text: "Done", fontSize: 24 },
      strokeStyle: "dashed",
    },
    {
      type: "arrow",
      id: "send",
      start: { id: "event" },
      end: { id: "ok" },
      label: "send",
    },
    {
      type: "arrow",
      id: "yes",
      start: { id: "ok" },
      end: { id: "done" },
      label: "yes",
    },
    {
      type: "line",
      id: "retry",
      start: { id: "ok" },
      end: { id: "event" },
      via: [
        [500, 330],
        [100, 330],
      ],
    },
  ],
};

describe("sceneToDiagramSpec", () => {
  test("round-trips a generated scene back to an equivalent spec", () => {
    const scene = sceneOf(flow);
    const { spec, droppedTypes } = sceneToDiagramSpec(scene);
    const rebuilt = buildExcalidrawScene(spec, measurer);

    expect(droppedTypes).toEqual([]);
    expect(rebuilt.elements.map((element) => element.id)).toEqual(
      scene.elements.map((element) => element.id)
    );
    for (const [index, element] of rebuilt.elements.entries()) {
      const original = scene.elements[index];
      expect(Math.round(element.x)).toBe(Math.round(original?.x ?? 0));
      expect(Math.round(element.y)).toBe(Math.round(original?.y ?? 0));
      expect(element.backgroundColor).toBe(original?.backgroundColor ?? "");
      expect(element.strokeStyle).toBe(original?.strokeStyle ?? "solid");
    }
  });

  test("keeps the spec compact by leaving out default styles", () => {
    const { spec } = sceneToDiagramSpec(sceneOf(flow));
    const event = spec.elements.find((element) => element.id === "event");
    const done = spec.elements.find((element) => element.id === "done");

    expect(event).toEqual({
      type: "rectangle",
      id: "event",
      x: 0,
      y: 120,
      width: 200,
      height: 90,
      label: { text: "Event" },
      backgroundColor: "#a5d8ff",
    });
    expect(done?.type === "ellipse" && done.label?.fontSize).toBe(24);
  });

  test("reads hand edits: moved shapes, unbound arrows, deleted and freehand elements", () => {
    const scene = sceneOf(flow);
    const edited = {
      ...scene,
      elements: [
        ...scene.elements.map((element) => {
          if (element.id === "done") {
            return { ...element, x: element.x + 40 };
          }
          if (element.id === "yes") {
            return { ...element, endBinding: null };
          }
          if (element.id === "retry") {
            return { ...element, isDeleted: true };
          }
          return element;
        }),
        { id: "scribble", type: "freedraw", x: 0, y: 0, points: [] },
      ],
    };
    const { spec, droppedTypes } = sceneToDiagramSpec(edited);
    const done = spec.elements.find((element) => element.id === "done");
    const yes = spec.elements.find((element) => element.id === "yes");

    expect(droppedTypes).toEqual(["freedraw"]);
    expect(done?.type === "ellipse" && done.x).toBe(840);
    expect(yes?.type === "arrow" && "x" in yes.end).toBe(true);
    expect(spec.elements.some((element) => element.id === "retry")).toBe(false);
  });
});

describe("findDiagramLayoutIssues", () => {
  test("a tidy diagram has no issues", () => {
    expect(findDiagramLayoutIssues(sceneOf(flow))).toEqual([]);
  });

  test("flags arrows through unrelated shapes, overlaps, cramped labels, and oversize", () => {
    const issues = findDiagramLayoutIssues(
      sceneOf({
        elements: [
          { type: "rectangle", id: "a", x: 0, y: 0, width: 200, height: 80 },
          {
            type: "rectangle",
            id: "mid",
            x: 400,
            y: 0,
            width: 200,
            height: 80,
          },
          { type: "rectangle", id: "b", x: 800, y: 0, width: 200, height: 80 },
          { type: "rectangle", id: "c", x: 850, y: 40, width: 200, height: 80 },
          {
            type: "rectangle",
            id: "far",
            x: 2000,
            y: 0,
            width: 200,
            height: 80,
          },
          { type: "arrow", start: { id: "a" }, end: { id: "b" } },
          {
            type: "arrow",
            start: { id: "a" },
            end: { id: "mid" },
            label: "a very long arrow label here",
          },
        ],
      })
    );

    expect(issues.some((issue) => issue.includes("runs through shape"))).toBe(
      true
    );
    expect(issues.some((issue) => issue.includes("overlap"))).toBe(true);
    expect(
      issues.some((issue) => issue.includes("covers its whole arrow"))
    ).toBe(true);
    expect(issues.some((issue) => issue.includes("larger than"))).toBe(true);
  });

  test("treats annotations as obstacles for shapes, arrows, and arrow labels", () => {
    const issues = findDiagramLayoutIssues(
      sceneOf({
        elements: [
          { type: "rectangle", id: "a", x: 0, y: 0, width: 200, height: 80 },
          { type: "rectangle", id: "b", x: 0, y: 300, width: 200, height: 80 },
          { type: "text", x: 60, y: 150, text: "annotation on the arrow" },
          { type: "text", x: 150, y: 40, text: "inside a box" },
          { type: "arrow", start: { id: "a" }, end: { id: "b" } },
        ],
      })
    );

    expect(
      issues.some((issue) => issue.includes("runs through the text"))
    ).toBe(true);
    expect(issues.some((issue) => issue.includes("overlaps shape"))).toBe(true);
  });

  test("routing around a shape with via waypoints clears the crossing", () => {
    const base = [
      { type: "rectangle", id: "a", x: 0, y: 0, width: 200, height: 80 },
      { type: "rectangle", id: "mid", x: 400, y: 0, width: 200, height: 80 },
      { type: "rectangle", id: "b", x: 800, y: 0, width: 200, height: 80 },
    ];
    const routed = findDiagramLayoutIssues(
      sceneOf({
        elements: [
          ...base,
          {
            type: "arrow",
            start: { id: "a" },
            end: { id: "b" },
            via: [
              [100, 200],
              [900, 200],
            ],
          },
        ],
      })
    );

    expect(routed.filter((issue) => issue.includes("runs through"))).toEqual(
      []
    );
  });
});

describe("parseDiagramSpecText", () => {
  test("accepts code fences, prose around the JSON, and raw newlines in labels", () => {
    const text =
      'Here is the diagram:\n```json\n{"elements":[{"type":"rectangle","x":0,"y":0,"label":"Cron sweep\nor API"}]}\n```';
    const spec = parseDiagramSpecText(text);
    const [shape] = spec.elements;

    expect(shape?.type === "rectangle" && shape.label?.text).toBe(
      "Cron sweep\nor API"
    );
  });

  test("keeps escaped quotes and backslashes intact", () => {
    const spec = parseDiagramSpecText(
      String.raw`{"elements":[{"type":"text","x":0,"y":0,"text":"say \"hi\" \\ bye"}]}`
    );
    const [text] = spec.elements;

    expect(text?.type === "text" && text.text).toBe('say "hi" \\ bye');
  });
});

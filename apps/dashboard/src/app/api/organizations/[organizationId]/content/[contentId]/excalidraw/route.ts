import {
  saveDiagramRevision,
  sceneToDiagramSpec,
} from "@notra/ai/utils/diagram-edit";
import { db } from "@notra/db/drizzle";
import { posts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";

import { withOrganizationAuth } from "@/lib/auth/organization";
import { saveDiagramSceneSchema } from "@/schemas/diagram-editor";
import type { RouteContext } from "@/types/api/routes";

const TRAILING_SLASHES_RE = /\/+$/;

function readExcalidrawUrl(metadata: unknown): string | null {
  if (
    typeof metadata === "object" &&
    metadata !== null &&
    "excalidrawUrl" in metadata &&
    typeof metadata.excalidrawUrl === "string"
  ) {
    return metadata.excalidrawUrl;
  }
  return null;
}

// Serves the diagram's Excalidraw scene same-origin, so the clipboard export
// does not depend on the asset bucket's CORS rules.
export async function GET(
  request: Request,
  { params }: RouteContext<{ organizationId: string; contentId: string }>
) {
  const { organizationId, contentId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);
  if (!auth.success) {
    return auth.response;
  }

  const post = await db.query.posts.findFirst({
    columns: { sourceMetadata: true },
    where: and(
      eq(posts.id, contentId),
      eq(posts.organizationId, organizationId),
      eq(posts.contentType, "image")
    ),
  });
  const excalidrawUrl = readExcalidrawUrl(post?.sourceMetadata);
  const publicUrl = process.env.CLOUDFLARE_PUBLIC_URL?.replace(
    TRAILING_SLASHES_RE,
    ""
  );
  // Only fetch our own asset bucket, never an arbitrary URL from metadata.
  if (
    !(excalidrawUrl && publicUrl && excalidrawUrl.startsWith(`${publicUrl}/`))
  ) {
    return Response.json(
      { error: "This image has no Excalidraw scene" },
      { status: 404 }
    );
  }

  const response = await fetch(excalidrawUrl, { cache: "no-store" });
  if (!response.ok) {
    return Response.json(
      { error: "Failed to load the Excalidraw scene" },
      { status: 502 }
    );
  }

  return new Response(await response.text(), {
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

// Saves a diagram edited by hand in the embedded Excalidraw editor: the scene
// becomes the post's spec again, so chat edits continue from the hand edits.
export async function PUT(
  request: Request,
  { params }: RouteContext<{ organizationId: string; contentId: string }>
) {
  const { organizationId, contentId } = await params;
  const auth = await withOrganizationAuth(request, organizationId);
  if (!auth.success) {
    return auth.response;
  }

  const body = saveDiagramSceneSchema.safeParse(
    await request.json().catch(() => null)
  );
  if (!body.success) {
    return Response.json({ error: "Invalid diagram scene" }, { status: 400 });
  }

  const post = await db.query.posts.findFirst({
    columns: { id: true },
    where: and(
      eq(posts.id, contentId),
      eq(posts.organizationId, organizationId),
      eq(posts.contentType, "image")
    ),
  });
  if (!post) {
    return Response.json({ error: "Diagram not found" }, { status: 404 });
  }

  let converted: ReturnType<typeof sceneToDiagramSpec>;
  try {
    converted = sceneToDiagramSpec(body.data.scene);
  } catch {
    return Response.json(
      { error: "The diagram has no shapes Notra can render" },
      { status: 422 }
    );
  }

  const { imageUrl } = await saveDiagramRevision({
    organizationId,
    postId: contentId,
    spec: converted.spec,
    edit: { kind: "manual" },
  });

  return Response.json({
    imageUrl,
    droppedTypes: converted.droppedTypes,
  });
}

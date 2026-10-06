import {
  deleteRepoImageSnapshot,
  generateRepoImage,
} from "@notra/ai/agents/repo-image";
import {
  canEditDiagramWithoutSandbox,
  reviseDiagramPost,
} from "@notra/ai/utils/diagram-edit";
import {
  uploadGeneratedHtmlAsset,
  uploadGeneratedImageAsset,
} from "@notra/ai/utils/image-assets";
import {
  buildRevisionSourceMetadata,
  getImageSnapshot,
  trackImageGenerationUsage,
} from "@notra/ai/utils/image-post-service";
import { redis } from "@notra/ai/utils/redis";
import { logError } from "@notra/ai/utils/server-log";
import { db } from "@notra/db/drizzle";
import { posts } from "@notra/db/schema";
import { and, eq } from "drizzle-orm";
import { defineTool } from "eve/tools";

import { reviseImageInputSchema } from "../schemas/image-tools";
import { deriveOperationHash } from "../utils/idempotency";
import { requireOrganizationId } from "../utils/organization";
import {
  getBooleanSessionAttribute,
  getSessionAttribute,
} from "../utils/session";

export function createReviseImageTool() {
  return defineTool({
    description:
      "Revises a previously generated image. Marketing assets restore their saved sandbox snapshot, apply the requested visual change, render a new 1200x630 PNG, and snapshot the sandbox again; this usually takes 3 to 8 minutes. Diagrams are edited directly in a few seconds unless useRepository is set. Describe the requested visual change in prompt.",
    inputSchema: reviseImageInputSchema,
    async execute({ postId: inputPostId, prompt, title, useRepository }, ctx) {
      const organizationId = requireOrganizationId(ctx);
      const userId = getSessionAttribute(ctx, "userId") ?? null;
      const useMarkup = getBooleanSessionAttribute(ctx, "useMarkup");
      const chargeAiCredits =
        getSessionAttribute(ctx, "chargeAiCredits") !== "false";
      const postId = inputPostId ?? getSessionAttribute(ctx, "contentId");
      if (!postId) {
        throw new Error(
          "revise_image needs a postId: pass it in the input or run inside a content editor session."
        );
      }

      const post = await db.query.posts.findFirst({
        where: and(
          eq(posts.id, postId),
          eq(posts.organizationId, organizationId)
        ),
      });
      if (!post) {
        throw new Error("Source image post not found");
      }

      const revisionKey = `agent:revise-image:${ctx.session.id}:${ctx.session.turn.id}:${postId}:${deriveOperationHash(`${prompt} ${title ?? ""} ${useRepository ? "repository" : ""}`)}`;
      if (redis) {
        const claimed = await redis.set(revisionKey, "1", {
          nx: true,
          ex: 60 * 60 * 24,
        });
        if (claimed !== "OK") {
          return {
            postId,
            title: post.title,
            imageUrl: post.content,
            status: "updated",
            contentType: "image",
            sandbox: null,
            usage: null,
          };
        }
      }
      try {
        if (
          !useRepository &&
          canEditDiagramWithoutSandbox(post.sourceMetadata)
        ) {
          return await reviseDiagramPost({
            organizationId,
            postId,
            prompt,
            title,
            useMarkup,
            chargeAiCredits,
          });
        }

        const metadata =
          post.sourceMetadata && typeof post.sourceMetadata === "object"
            ? post.sourceMetadata
            : {};
        const integrationId =
          "integrationId" in metadata &&
          typeof metadata.integrationId === "string"
            ? metadata.integrationId
            : null;
        const branch =
          "branch" in metadata && typeof metadata.branch === "string"
            ? metadata.branch
            : null;
        if (!(integrationId && branch)) {
          throw new Error(
            "The image post is missing its repository metadata and cannot be revised."
          );
        }

        const previousSnapshot = await getImageSnapshot(organizationId, postId);
        const nextTitle = title ?? post.title;

        const result = await generateRepoImage({
          input: {
            organizationId,
            integrationId,
            branch,
            brandIdentityId: previousSnapshot.brandIdentityId,
            mode: "prompt",
            prompt,
          },
          restoreSnapshotId: previousSnapshot.snapshotId,
          restoreDiagramSpec: previousSnapshot.diagramSpec,
          snapshotName: `image-${organizationId}-${Date.now()}`,
          userId,
        });

        const [imageUrl, htmlUrl] = await Promise.all([
          uploadGeneratedImageAsset({
            organizationId,
            pngBase64: result.pngBase64,
            postId,
          }),
          uploadGeneratedHtmlAsset({
            organizationId,
            html: result.html,
            postId,
          }),
        ]);
        const sourceMetadata = await buildRevisionSourceMetadata({
          organizationId,
          postId,
          integrationId,
          branch,
          prompt,
          result,
        });

        await db
          .update(posts)
          .set({
            title: nextTitle,
            content: imageUrl,
            htmlUrl,
            markdown: null,
            sourceMetadata,
            updatedAt: new Date(),
          })
          .where(
            and(eq(posts.id, postId), eq(posts.organizationId, organizationId))
          );

        await deleteRepoImageSnapshot(previousSnapshot).catch((error) => {
          logError("Failed to delete previous repo image snapshot", error, {
            postId,
            snapshotId: previousSnapshot.snapshotId,
          });
        });

        await trackImageGenerationUsage({
          organizationId,
          postId,
          usage: result.usage,
          useMarkup,
          chargeAiCredits,
        });

        return {
          postId,
          title: nextTitle,
          imageUrl,
          status: "updated",
          contentType: "image",
          sandbox: result.sandbox,
          usage: result.usage ?? null,
        };
      } catch (error) {
        if (redis) {
          await redis.del(revisionKey).catch(() => null);
        }
        throw error;
      }
    },
  });
}

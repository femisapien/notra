"use client";

import type { SkillUpgradeStrategy } from "@notra/ai/skills/types";
import { updateSkillSchema } from "@notra/schemas/dashboard/skills";
import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { parseAsBoolean, parseAsStringLiteral, useQueryState } from "nuqs";
import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { LazySkillUpdateDialog } from "@/components/skills/lazy-skill-update-dialog";
import { SkillDeleteDialog } from "@/components/skills/skill-delete-dialog";
import { SkillDetailHeader } from "@/components/skills/skill-detail-header";
import { SkillEditorForm } from "@/components/skills/skill-editor-form";
import {
  SKILL_EDITOR_VIEWS,
  SKILL_REVIEW_QUERY_PARAM,
} from "@/constants/skills";
import { dashboardOrpc } from "@/lib/orpc/query";
import type { SkillDetailPageClientProps } from "@/types/skills/page";

export default function PageClient({
  slug,
  skillId,
}: SkillDetailPageClientProps) {
  const { activeOrganization } = useOrganizationsContext();
  const organizationId = activeOrganization?.id;
  const queryClient = useQueryClient();
  const router = useRouter();
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [reviewOpen, setReviewOpen] = useQueryState(
    SKILL_REVIEW_QUERY_PARAM,
    parseAsBoolean.withDefault(false)
  );
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(SKILL_EDITOR_VIEWS).withDefault("edit")
  );

  const [original, setOriginal] = useState<{
    name: string;
    description: string;
    content: string;
  } | null>(null);
  const [nameInput, setNameInput] = useState("");
  const [description, setDescription] = useState("");
  const [content, setContent] = useState("");

  const saveToastIdRef = useRef<string | number | null>(null);
  const handleSaveRef = useRef<(() => void) | null>(null);
  const handleDiscardRef = useRef<(() => void) | null>(null);

  const skillInput = { organizationId: organizationId ?? "", id: skillId };

  const { data: skill, isPending } = useQuery({
    ...dashboardOrpc.skills.getById.queryOptions({ input: skillInput }),
    enabled: !!organizationId,
  });

  const { data: upstreamDetail = null } = useQuery({
    ...dashboardOrpc.skills.getUpstream.queryOptions({ input: skillInput }),
    enabled: !!organizationId && Boolean(skill?.isSystem),
  });

  const syncEditorState = (row: {
    name: string;
    description: string;
    content: string;
  }) => {
    setOriginal({
      name: row.name,
      description: row.description,
      content: row.content,
    });
    setNameInput(row.name);
    setDescription(row.description);
    setContent(row.content);
  };

  if (skill && !original) {
    syncEditorState(skill);
  }

  const skillName = original?.name ?? skill?.name ?? "";

  const hasChanges =
    !!original &&
    (nameInput !== original.name ||
      description !== original.description ||
      content !== original.content);

  const invalidate = () => {
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.skills.list.queryKey({
        input: { organizationId: organizationId ?? "" },
      }),
    });
    queryClient.invalidateQueries({
      queryKey: dashboardOrpc.skills.getById.queryKey({ input: skillInput }),
    });
  };

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      const willRename = nameInput !== original?.name;
      const parsed = updateSkillSchema.safeParse({
        name: willRename ? nameInput : undefined,
        description,
        content,
      });
      if (!parsed.success) {
        throw new Error(parsed.error.issues[0]?.message ?? "Invalid input");
      }
      return dashboardOrpc.skills.update.call({
        organizationId,
        id: skillId,
        payload: parsed.data,
      });
    },
    onSuccess: (data) => {
      setOriginal({ name: data.name, description, content });
      setNameInput(data.name);
      invalidate();
      toast.success("Skill saved");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const upgradeMutation = useMutation({
    mutationFn: async (input: {
      strategy: SkillUpgradeStrategy;
      payload?: { content: string; description: string };
    }) => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      return await dashboardOrpc.skills.upgrade.call({
        organizationId,
        id: skillId,
        payload: { strategy: input.strategy, ...input.payload },
      });
    },
    onSuccess: async (data) => {
      setReviewOpen(false);
      if (organizationId) {
        const fresh = await dashboardOrpc.skills.getById.call({
          organizationId,
          id: skillId,
        });
        syncEditorState(fresh);
      }
      invalidate();
      queryClient.invalidateQueries({
        queryKey: dashboardOrpc.skills.getUpstream.queryKey({
          input: skillInput,
        }),
      });
      toast.success(`${data.name} is on v${data.version}`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async () => {
      if (!organizationId) {
        throw new Error("Organization ID is required");
      }
      return dashboardOrpc.skills.delete.call({ organizationId, id: skillId });
    },
    onSuccess: () => {
      invalidate();
      toast.success("Skill deleted");
      router.push(`/${slug}/skills`);
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });

  const busy =
    saveMutation.isPending ||
    deleteMutation.isPending ||
    upgradeMutation.isPending;

  useEffect(() => {
    handleSaveRef.current = () => {
      if (!hasChanges || saveMutation.isPending || deleteMutation.isPending) {
        return;
      }
      saveMutation.mutate();
    };
    handleDiscardRef.current = () => {
      if (!original) {
        return;
      }
      setNameInput(original.name);
      setDescription(original.description);
      setContent(original.content);
    };
  }, [hasChanges, saveMutation, deleteMutation, original]);

  useEffect(() => {
    if (hasChanges && !saveToastIdRef.current) {
      saveToastIdRef.current = toast.custom(
        () => (
          <div className="border-border bg-background rounded-[14px] border p-0.5 shadow-sm">
            <div className="bg-background flex items-center gap-3 rounded-lg px-4 py-3">
              <span className="text-muted-foreground text-sm">
                Unsaved changes
              </span>
              <Button
                onClick={() => handleDiscardRef.current?.()}
                size="sm"
                variant="ghost"
              >
                Discard
              </Button>
              <Button onClick={() => handleSaveRef.current?.()} size="sm">
                Save
              </Button>
            </div>
          </div>
        ),
        { duration: Number.POSITIVE_INFINITY, position: "bottom-right" }
      );
    } else if (!hasChanges && saveToastIdRef.current) {
      toast.dismiss(saveToastIdRef.current);
      saveToastIdRef.current = null;
    }
  }, [hasChanges]);

  useEffect(() => {
    return () => {
      if (saveToastIdRef.current) {
        toast.dismiss(saveToastIdRef.current);
      }
    };
  }, []);

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasChanges) {
        e.preventDefault();
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => window.removeEventListener("beforeunload", handleBeforeUnload);
  }, [hasChanges]);

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-8 px-4 lg:px-6">
        <SkillDetailHeader
          actionsDisabled={busy}
          canDelete={Boolean(skill && !skill.isSystem)}
          content={original?.content ?? ""}
          deleteDisabled={saveMutation.isPending || deleteMutation.isPending}
          name={skillName}
          onDelete={() => setDeleteOpen(true)}
          onReviewUpdate={() => setReviewOpen(true)}
          onUpgrade={(strategy) => upgradeMutation.mutate({ strategy })}
          slug={slug}
          upgradePending={upgradeMutation.isPending}
          upstream={skill?.upstream ?? null}
          upstreamDetail={upstreamDetail}
        />

        {organizationId && isPending ? (
          <div className="space-y-8">
            <div className="max-w-2xl space-y-5">
              <Skeleton className="h-10 w-full max-w-md" />
              <Skeleton className="h-20 w-full" />
            </div>
            <Skeleton className="h-[28rem] w-full rounded-xl" />
          </div>
        ) : null}

        {!(organizationId && isPending) && skill ? (
          <SkillEditorForm
            content={content}
            description={description}
            isSystem={skill.isSystem}
            nameInput={nameInput}
            onContentChange={setContent}
            onDescriptionChange={setDescription}
            onNameChange={setNameInput}
            onViewChange={setView}
            originalContent={original?.content ?? ""}
            savePending={busy}
            view={view}
          />
        ) : null}
      </div>

      {upstreamDetail?.updateAvailable ? (
        <LazySkillUpdateDialog
          content={original?.content ?? ""}
          description={original?.description ?? ""}
          descriptionModified={
            upstreamDetail.base.description !== (original?.description ?? "")
          }
          detail={upstreamDetail}
          name={skillName}
          onOpenChange={setReviewOpen}
          onUpgrade={(strategy, payload) =>
            upgradeMutation.mutate({ strategy, payload })
          }
          open={reviewOpen}
          pending={busy}
        />
      ) : null}

      <SkillDeleteDialog
        name={skillName}
        onConfirm={() => deleteMutation.mutate()}
        onOpenChange={setDeleteOpen}
        open={deleteOpen}
        pending={deleteMutation.isPending}
      />
    </PageContainer>
  );
}

"use client";

import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import { mergeThreeWay } from "@notra/utils/three-way-merge";
import { useMemo, useState } from "react";

import { Button } from "@/components/button";
import { SkillDiff } from "@/components/skills/skill-diff";
import { SkillMerge } from "@/components/skills/skill-merge";
import type { SkillUpdateDialogProps } from "@/types/skills/page";

type SkillUpdateStep = "review" | "resolve";

/**
 * Review a newer Notra version of a system skill. Unedited copies just update;
 * edited copies either merge (resolving conflicts when both sides touched the
 * same lines) or discard their edits.
 */
export function SkillUpdateDialog({
  open,
  onOpenChange,
  name,
  detail,
  content,
  description,
  descriptionModified,
  pending,
  onUpgrade,
}: SkillUpdateDialogProps) {
  const [step, setStep] = useState<SkillUpdateStep>("review");
  const [resolvedText, setResolvedText] = useState<string | null>(null);

  if (!open && step !== "review") {
    setStep("review");
  }

  const latestLabel = `Notra v${detail.latest.version}`;
  const mergeLabels = useMemo(
    () => ({ mine: "Your version", theirs: latestLabel }),
    [latestLabel]
  );
  const merged = useMemo(
    () =>
      mergeThreeWay({
        base: detail.base.content,
        mine: content,
        theirs: detail.latest.content,
        labels: mergeLabels,
      }),
    [detail.base.content, detail.latest.content, content, mergeLabels]
  );

  const mergedDescription = descriptionModified
    ? description
    : detail.latest.description;

  const handleMerge = () => {
    if (merged.hasConflicts) {
      setStep("resolve");
      return;
    }
    onUpgrade("merge", {
      content: merged.text,
      description: mergedDescription,
    });
  };

  const handleSaveResolved = () => {
    if (!resolvedText) {
      return;
    }
    onUpgrade("merge", {
      content: resolvedText,
      description: mergedDescription,
    });
  };

  const isResolving = step === "resolve";

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="flex max-h-[85svh] flex-col gap-4 overflow-hidden sm:max-w-3xl">
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>
            {isResolving
              ? "Resolve conflicts"
              : `Update ${name} to v${detail.latest.version}`}
          </ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {isResolving
              ? "You and Notra changed the same lines. Pick a side for each."
              : (detail.latest.changelog ??
                "Notra published a new version of this skill.")}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>

        <div className="border-border/80 min-h-0 flex-1 overflow-auto rounded-xl border">
          {isResolving ? (
            <div className="p-3">
              <SkillMerge
                base={detail.base.content}
                labels={mergeLabels}
                mine={content}
                onResolved={setResolvedText}
                resetKey={`${name}:${detail.latest.version}`}
                theirs={detail.latest.content}
              />
            </div>
          ) : (
            <SkillDiff
              after={{ label: latestLabel, content: detail.latest.content }}
              before={{
                label: `Notra v${detail.base.version}`,
                content: detail.base.content,
              }}
            />
          )}
        </div>

        {detail.isModified && !isResolving ? (
          <p className="text-muted-foreground text-sm">
            You edited this skill. Merge keeps your edits and adds these
            changes. Discard replaces your version.
          </p>
        ) : null}

        <ResponsiveDialogFooter>
          {isResolving ? (
            <>
              <Button
                disabled={pending}
                onClick={() => setStep("review")}
                variant="outline"
              >
                Back
              </Button>
              <Button
                disabled={pending || !resolvedText}
                onClick={handleSaveResolved}
              >
                {pending ? "Saving…" : "Save merged version"}
              </Button>
            </>
          ) : null}
          {!isResolving && detail.isModified ? (
            <>
              <Button
                disabled={pending}
                onClick={() => onUpgrade("discard")}
                variant="outline"
              >
                Discard my changes
              </Button>
              <Button disabled={pending} onClick={handleMerge}>
                {pending ? "Merging…" : "Merge"}
              </Button>
            </>
          ) : null}
          {!isResolving && !detail.isModified ? (
            <Button disabled={pending} onClick={() => onUpgrade("discard")}>
              {pending ? "Updating…" : "Update"}
            </Button>
          ) : null}
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

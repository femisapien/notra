"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";
import { Textarea } from "@notra/ui/components/ui/textarea";
import { mergeThreeWay } from "@notra/utils/three-way-merge";
import { UnresolvedFile } from "@pierre/diffs/react";
import { useTheme } from "next-themes";
import { useEffect, useMemo, useState } from "react";

import { Button } from "@/components/button";
import { SkillDiff } from "@/components/skills/skill-diff";
import { SkillMergeBoundary } from "@/components/skills/skill-merge-boundary";
import {
  SKILL_DIFF_FILE_NAME,
  SKILL_DIFF_LANGUAGE,
  SKILL_DIFF_THEMES,
} from "@/constants/skills";
import { useSkillDiffHighlighterReady } from "@/lib/hooks/use-skill-diff-highlighter";
import type { SkillConflictResolution } from "@/types/skills/merge";
import type { SkillMergeProps } from "@/types/skills/page";
import { parseSkillConflicts, resolveSkillConflict } from "@/utils/skill-merge";
import { resolveDiffThemeType } from "@/utils/skills";

interface MergeState {
  /** The untouched merge output this state was seeded from. */
  source: string;
  resetKey: string;
  /** The working text: resolved regions replaced, the rest still marked. */
  text: string;
  /** Bumped per resolution so the uncontrolled resolver re-reads the text. */
  step: number;
}

const RESOLUTION_LABELS: {
  resolution: SkillConflictResolution;
  label: string;
}[] = [
  { resolution: "current", label: "Keep mine" },
  { resolution: "incoming", label: "Take Notra's" },
  { resolution: "both", label: "Keep both" },
];

/**
 * Three-way merge of a system skill: our own line merge produces git conflict
 * markers, `UnresolvedFile` renders them, and every resolution is applied to
 * the text here so the parent always receives what will actually be saved.
 */
export function SkillMerge({
  base,
  mine,
  theirs,
  labels,
  onResolved,
  resetKey,
}: SkillMergeProps) {
  const { resolvedTheme } = useTheme();
  const highlighterReady = useSkillDiffHighlighterReady();

  const merged = useMemo(
    () => mergeThreeWay({ base, mine, theirs, labels }),
    [base, mine, theirs, labels]
  );

  const [state, setState] = useState<MergeState>(() => ({
    source: merged.text,
    resetKey,
    text: merged.text,
    step: 0,
  }));

  if (state.source !== merged.text || state.resetKey !== resetKey) {
    setState({ source: merged.text, resetKey, text: merged.text, step: 0 });
  }

  const remaining = useMemo(
    () => parseSkillConflicts(state.text).length,
    [state.text]
  );
  const resolvedText = remaining === 0 ? state.text : null;

  useEffect(() => {
    onResolved(resolvedText);
  }, [onResolved, resolvedText]);

  const handleResolve = (
    conflictIndex: number,
    resolution: SkillConflictResolution
  ) => {
    setState((previous) => ({
      ...previous,
      text: resolveSkillConflict(previous.text, conflictIndex, resolution),
      step: previous.step + 1,
    }));
  };

  const handleEdit = (text: string) => {
    setState((previous) => ({ ...previous, text }));
  };

  if (!merged.hasConflicts) {
    return (
      <div className="border-border/80 overflow-hidden rounded-lg border">
        <SkillDiff
          after={{ label: "Merged", content: merged.text }}
          before={{ label: labels.mine, content: mine }}
        />
      </div>
    );
  }

  if (!highlighterReady) {
    return <Skeleton className="h-64 w-full rounded-xl" />;
  }

  return (
    <div className="space-y-3">
      <p aria-live="polite" className="text-muted-foreground text-sm">
        {remaining === 0
          ? "All conflicts resolved."
          : `${remaining} ${remaining === 1 ? "conflict" : "conflicts"} left`}
      </p>
      <div className="border-border/80 overflow-hidden rounded-lg border">
        <SkillMergeBoundary
          fallback={
            <Textarea
              aria-label="Merged skill content"
              className="max-h-[min(70vh,40rem)] min-h-64 resize-none overflow-y-auto rounded-none border-0 font-mono text-sm leading-relaxed"
              onChange={(event) => handleEdit(event.target.value)}
              spellCheck={false}
              value={state.text}
            />
          }
        >
          <UnresolvedFile
            file={{
              name: SKILL_DIFF_FILE_NAME,
              contents: state.text,
              lang: SKILL_DIFF_LANGUAGE,
            }}
            key={`${resetKey}:${state.step}`}
            options={{
              disableFileHeader: true,
              hunkSeparators: "line-info",
              lineDiffType: "word",
              overflow: "wrap",
              theme: SKILL_DIFF_THEMES,
              themeType: resolveDiffThemeType(resolvedTheme),
            }}
            renderMergeConflictUtility={(action) => (
              <div className="flex flex-wrap items-center gap-1.5 px-2 py-1.5">
                {RESOLUTION_LABELS.map(({ resolution, label }) => (
                  <Button
                    key={resolution}
                    onClick={() =>
                      handleResolve(action.conflictIndex, resolution)
                    }
                    size="sm"
                    type="button"
                    variant="outline"
                  >
                    {label}
                  </Button>
                ))}
              </div>
            )}
          />
        </SkillMergeBoundary>
      </div>
    </div>
  );
}

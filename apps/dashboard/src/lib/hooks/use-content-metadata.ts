"use client";

import type { ContentResponse } from "@notra/schemas/dashboard/content";
import type { PostMetadataPatch } from "@notra/schemas/shared/post-metadata";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { useTranslations } from "use-intl";

import { CONTENT_METADATA_DEBOUNCE_MS } from "@/constants/content-overview";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  ContentMetadataApi,
  UseContentMetadataParams,
} from "@/types/content/overview";
import type { ContentApiResponse } from "@/types/hooks/content";
import { applyMetadataPatch } from "@/utils/content-metadata";
import { toErrorMessage } from "@/utils/error-message";

export function useContentMetadata(
  params: UseContentMetadataParams
): ContentMetadataApi {
  const { organizationId, contentId } = params;
  const t = useTranslations("content.overview");
  const queryClient = useQueryClient();
  const queryKey = dashboardOrpc.content.get.queryKey({
    input: { organizationId, contentId },
  });

  const setMetadata = useCallback(
    (
      update: (
        metadata: ContentResponse["metadata"]
      ) => ContentResponse["metadata"]
    ) => {
      queryClient.setQueryData<ContentApiResponse>(queryKey, (current) =>
        current
          ? {
              ...current,
              content: {
                ...current.content,
                metadata: update(current.content.metadata),
              },
            }
          : current
      );
    },
    [queryClient, queryKey]
  );

  const pending = useRef<PostMetadataPatch | null>(null);
  const latestRequest = useRef(0);
  const [inFlight, setInFlight] = useState(0);

  const send = useCallback(
    async (patch: PostMetadataPatch) => {
      const request = ++latestRequest.current;
      setInFlight((count) => count + 1);
      try {
        const result = await dashboardOrpc.content.updateMetadata.call({
          organizationId,
          contentId,
          metadata: patch,
        });
        // Only the newest response may replace the cache: an older one
        // finishing late would roll back edits made after it was sent.
        if (request === latestRequest.current && pending.current === null) {
          setMetadata(() => result.content.metadata);
        }
      } catch (error) {
        toast.error(toErrorMessage(error, t("saveFailed")));
        void queryClient.invalidateQueries({ queryKey });
      } finally {
        setInFlight((count) => count - 1);
      }
    },
    [contentId, organizationId, queryClient, queryKey, setMetadata, t]
  );

  const update = useCallback(
    (patch: PostMetadataPatch) => {
      setMetadata((metadata) => applyMetadataPatch(metadata, patch));
      void send(patch);
    },
    [send, setMetadata]
  );

  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const flush = useCallback(() => {
    if (timer.current) {
      clearTimeout(timer.current);
      timer.current = null;
    }
    const patch = pending.current;
    pending.current = null;
    if (patch) {
      void send(patch);
    }
  }, [send]);

  const updateDebounced = useCallback(
    (patch: PostMetadataPatch) => {
      setMetadata((metadata) => applyMetadataPatch(metadata, patch));
      pending.current = { ...pending.current, ...patch };
      if (timer.current) {
        clearTimeout(timer.current);
      }
      timer.current = setTimeout(flush, CONTENT_METADATA_DEBOUNCE_MS);
    },
    [flush, setMetadata]
  );

  // Never drop a pending edit when the panel or page goes away.
  const flushRef = useRef(flush);
  flushRef.current = flush;
  useEffect(() => () => flushRef.current(), []);

  return {
    metadata: params.content.metadata,
    update,
    updateDebounced,
    isSaving: inFlight > 0 || pending.current !== null,
  };
}

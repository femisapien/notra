"use client";

import {
  Calendar03Icon,
  GridViewIcon,
  ListViewIcon,
} from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import { Button } from "@notra/ui/components/ui/button";
import { useTranslations } from "next-intl";
import dynamic from "next/dynamic";
import { parseAsInteger, parseAsStringLiteral, useQueryState } from "nuqs";
import { useMemo } from "react";

import { CollectionsView } from "@/components/content/collections-view";
import { LazyCreateContentDialog } from "@/components/content/lazy-create-content-dialog";
import { EmptyState } from "@/components/empty-state";
import { EmptyStateTablePreview } from "@/components/empty-state-preview";
import { PageContainer } from "@/components/layout/container";
import { useOrganizationsContext } from "@/components/providers/organization-provider";
import { CONTENT_LIST_VIEWS } from "@/constants/content-collections";
import {
  EMPTY_STATE_TABLE_COLUMNS,
  EMPTY_STATE_TABLE_ROWS,
} from "@/constants/empty-state";
import { useCollections } from "@/lib/hooks/use-collections";
import { cn } from "@/lib/utils";
import type { ContentListPageClientProps } from "@/types/content/collection";
import type { TablePaginationState } from "@/types/table";

import { CollectionsPageSkeleton } from "./skeleton";

// Days, "today" and times depend on the browser's time zone, so the
// calendar renders on the client only.
const ContentCalendarView = dynamic(
  () =>
    import("@/components/content/calendar/content-calendar-view").then(
      (module) => module.ContentCalendarView
    ),
  { ssr: false }
);

const VIEW_ICONS = {
  list: ListViewIcon,
  grid: GridViewIcon,
  calendar: Calendar03Icon,
} as const;

export default function PageClient({
  organizationSlug,
  initialProjectId,
}: ContentListPageClientProps) {
  const t = useTranslations("content.list");
  const tCommon2 = useTranslations("common");
  const tCommon = useTranslations("common.actions");
  const { getOrganization, activeOrganization } = useOrganizationsContext();
  const orgFromList = getOrganization(organizationSlug);
  const organization =
    activeOrganization?.slug === organizationSlug
      ? activeOrganization
      : orgFromList;
  const organizationId = organization?.id ?? "";

  const [rawPage, setPage] = useQueryState(
    "page",
    parseAsInteger.withDefault(1).withOptions({ clearOnDefault: true })
  );
  const page = Math.max(1, rawPage);
  const [view, setView] = useQueryState(
    "view",
    parseAsStringLiteral(CONTENT_LIST_VIEWS).withDefault("list")
  );
  const isCalendar = view === "calendar";
  const collectionView = view === "grid" ? "grid" : "list";

  const { data, isPending, isError, isPlaceholderData, refetch } =
    useCollections(organizationId, page, initialProjectId, !isCalendar);

  const collections = useMemo(
    () => data?.collections ?? [],
    [data?.collections]
  );

  const pageCount = data?.pagination.totalPages ?? 1;
  const pagination: TablePaginationState = {
    page,
    pageCount,
    pageSize: data?.pagination.pageSize ?? collections.length,
    totalItems: data?.pagination.totalCount ?? collections.length,
    pageRowCount: collections.length,
    setPage: (next) => setPage(Math.min(Math.max(1, next), pageCount)),
  };

  const viewToggle = (
    <div
      aria-label={t("viewToggle")}
      className="bg-muted inline-flex items-center rounded-lg p-0.5"
      role="group"
    >
      {CONTENT_LIST_VIEWS.map((option) => {
        const selected = view === option;

        return (
          <button
            aria-pressed={selected}
            className={cn(
              "focus-visible:ring-ring/50 duration-fast inline-flex h-7 items-center gap-1 rounded-md px-2 text-[0.8rem] font-medium transition-colors ease-out focus-visible:ring-2 focus-visible:outline-none",
              selected
                ? "bg-background text-foreground shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            )}
            key={option}
            onClick={() => {
              void setView(option);
            }}
            type="button"
          >
            <HugeiconsIcon
              aria-hidden="true"
              className="size-3.5"
              icon={VIEW_ICONS[option]}
            />
            {option === "list" ? tCommon2("labels.list") : null}
            {option === "grid" ? t("viewGrid") : null}
            {option === "calendar" ? t("viewCalendar") : null}
          </button>
        );
      })}
    </div>
  );

  const isEmpty =
    !(isPending || isError || isCalendar) &&
    collections.length === 0 &&
    page === 1;

  return (
    <PageContainer className="flex flex-1 flex-col gap-4 py-4 md:gap-6 md:py-6">
      <div className="w-full space-y-6 px-4 lg:px-6">
        <header className="flex flex-col items-start gap-3 @min-[40rem]/main:flex-row @min-[40rem]/main:items-center @min-[40rem]/main:justify-between">
          <div className="min-w-0 space-y-1">
            <h1 className="text-2xl font-semibold tracking-tight">
              {tCommon2("labels.content")}
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm text-pretty">
              {t("description")}
            </p>
          </div>
          <LazyCreateContentDialog
            entry="content_list"
            organizationId={organizationId}
            organizationSlug={organizationSlug}
          />
        </header>

        <div className="space-y-3">
          {isCalendar ? null : (
            <div className="flex min-h-8 flex-wrap items-center justify-between gap-3">
              <h2 className="text-sm font-medium">{t("allContent")}</h2>
              {viewToggle}
            </div>
          )}

          {isCalendar ? (
            <ContentCalendarView
              organizationId={organizationId}
              organizationSlug={organizationSlug}
              toolbarEnd={viewToggle}
            />
          ) : null}

          {isPending && !isCalendar ? (
            <CollectionsPageSkeleton view={collectionView} />
          ) : null}

          {isError && !isCalendar ? (
            <EmptyState
              action={
                <Button
                  onClick={() => {
                    void refetch();
                  }}
                  variant="outline"
                >
                  {tCommon("tryAgain")}
                </Button>
              }
              description={t("loadFailedDescription")}
              title={t("loadFailedTitle")}
            />
          ) : null}

          {isEmpty ? (
            <EmptyState
              description={t("emptyDescription")}
              preview={
                <EmptyStateTablePreview
                  columns={EMPTY_STATE_TABLE_COLUMNS.content}
                  rows={EMPTY_STATE_TABLE_ROWS}
                />
              }
              title={t("emptyTitle")}
            />
          ) : null}

          {!(isPending || isEmpty || isError || isCalendar) ? (
            <CollectionsView
              collections={collections}
              loading={isPlaceholderData}
              organizationId={organizationId}
              organizationSlug={organizationSlug}
              pagination={pagination}
              view={collectionView}
            />
          ) : null}
        </div>
      </div>
    </PageContainer>
  );
}

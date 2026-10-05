"use client";

import { Skeleton } from "@notra/ui/components/ui/skeleton";

import { SitesPageShell } from "@/components/sites/sites-page-shell";

export function NewSitePageSkeleton() {
  return (
    <SitesPageShell>
      <div className="mx-auto max-w-2xl space-y-8">
        <div className="space-y-2">
          <Skeleton className="h-8 w-40" />
          <Skeleton className="h-4 w-80" />
        </div>
        <Skeleton className="h-96 w-full rounded-2xl" />
        <Skeleton className="h-72 w-full rounded-2xl" />
      </div>
    </SitesPageShell>
  );
}

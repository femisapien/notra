"use client";

import { Github01Icon, SquareLock02Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { useTranslations } from "next-intl";

import type { SiteRepositorySelectProps } from "@/types/components/sites";
import { siteRepositoryLabel } from "@/utils/site-create";

/** Picks one of the GitHub repositories the organization connected. */
export function SiteRepositorySelect({
  id,
  repositories,
  isLoading,
  value,
  onSelect,
}: SiteRepositorySelectProps) {
  const t = useTranslations("sites.new");
  const tCommon = useTranslations("common");
  return (
    <Select
      disabled={isLoading}
      items={repositories.map((candidate) => ({
        value: candidate.id,
        label: siteRepositoryLabel(candidate),
      }))}
      onValueChange={(next) => {
        const repository = repositories.find((item) => item.id === next);
        if (repository) {
          onSelect(repository);
        }
      }}
      value={value}
    >
      <SelectTrigger className="w-full" id={id}>
        <SelectValue
          placeholder={
            isLoading ? tCommon("labels.loading") : t("repositoryPlaceholder")
          }
        />
      </SelectTrigger>
      <SelectContent alignItemWithTrigger={false}>
        {repositories.map((candidate) => (
          <SelectItem key={candidate.id} value={candidate.id}>
            <HugeiconsIcon
              aria-hidden="true"
              className="text-muted-foreground"
              icon={Github01Icon}
              size={14}
            />
            <span className="truncate">{siteRepositoryLabel(candidate)}</span>
            {candidate.private ? (
              <HugeiconsIcon
                aria-label={t("private")}
                className="text-muted-foreground"
                icon={SquareLock02Icon}
                size={12}
              />
            ) : null}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

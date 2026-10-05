"use client";

import { FieldError } from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import { Switch } from "@notra/ui/components/ui/switch";
import { useTranslations } from "next-intl";

import { cn } from "@/lib/utils";
import type { SiteCreateSectionsProps } from "@/types/components/sites";

/** Blog and changelog side by side: a switch and the path each lives under. */
export function SiteCreateSections({
  idPrefix,
  sections,
  error,
}: SiteCreateSectionsProps) {
  const t = useTranslations("sites.sections");
  const noneEnabled = !sections.some((section) => section.enabled);
  return (
    <fieldset className="space-y-2">
      <legend className="mb-2 text-sm font-medium">{t("title")}</legend>
      <div className="grid gap-2 sm:grid-cols-2">
        {sections.map((section) => {
          const id = `${idPrefix}-${section.key}`;
          return (
            <div
              className={cn(
                "duration-normal flex h-11 items-center gap-2.5 rounded-lg border pr-1.5 pl-3 transition-colors",
                section.enabled ? "bg-card" : "bg-transparent"
              )}
              key={section.key}
            >
              <Switch
                checked={section.enabled}
                id={`${id}-enabled`}
                onCheckedChange={section.onEnabledChange}
              />
              <label
                className={cn(
                  "duration-normal flex-1 cursor-pointer text-sm font-medium transition-colors",
                  !section.enabled && "text-muted-foreground"
                )}
                htmlFor={`${id}-enabled`}
              >
                {section.title}
              </label>
              <Input
                aria-label={t("pathLabel", { section: section.title })}
                className="w-28"
                disabled={!section.enabled}
                id={`${id}-path`}
                onChange={(event) => section.onPathChange(event.target.value)}
                placeholder="/"
                spellCheck={false}
                value={section.path}
              />
            </div>
          );
        })}
      </div>
      {noneEnabled ? (
        <p className="text-destructive text-xs" role="alert">
          {t("atLeastOne")}
        </p>
      ) : (
        <FieldError>{error}</FieldError>
      )}
    </fieldset>
  );
}

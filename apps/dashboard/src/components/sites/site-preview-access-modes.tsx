"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@notra/ui/components/ui/field";
import {
  RadioGroup,
  RadioGroupItem,
} from "@notra/ui/components/ui/radio-group";
import { useTranslations } from "next-intl";

import { SITE_PREVIEW_ACCESS_MODES } from "@/constants/site-preview-access";
import type { SitePreviewAccessModesProps } from "@/types/components/site-preview-access";
import type { SitePreviewAccessMode } from "@/types/site-preview-access";

/** Who can open previews: Notra members, members or a password, or anyone. */
export function SitePreviewAccessModes({
  idPrefix: id,
  enabled,
  mode,
  onModeChange,
}: SitePreviewAccessModesProps) {
  const t = useTranslations("sites.previewAccess");
  return (
    <fieldset className="space-y-2" disabled={!enabled}>
      <legend className="mb-2 text-sm font-medium">{t("whoLabel")}</legend>
      <RadioGroup
        disabled={!enabled}
        onValueChange={(next) => onModeChange(next as SitePreviewAccessMode)}
        value={mode}
      >
        {SITE_PREVIEW_ACCESS_MODES.map((option) => (
          <FieldLabel htmlFor={`${id}-${option.mode}`} key={option.mode}>
            <Field data-disabled={!enabled} orientation="horizontal">
              <HugeiconsIcon
                aria-hidden="true"
                className="text-muted-foreground mt-0.5 size-4 shrink-0"
                icon={option.icon}
                strokeWidth={1.5}
              />
              <FieldContent>
                <FieldTitle>{t(`modes.${option.mode}.title`)}</FieldTitle>
                <FieldDescription>
                  {t(`modes.${option.mode}.description`)}
                </FieldDescription>
              </FieldContent>
              <RadioGroupItem id={`${id}-${option.mode}`} value={option.mode} />
            </Field>
          </FieldLabel>
        ))}
      </RadioGroup>
    </fieldset>
  );
}

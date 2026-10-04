"use client";

import { ViewIcon, ViewOffIcon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  SITE_PREVIEW_PASSWORD_MAX_LENGTH,
  SITE_PREVIEW_PASSWORD_MIN_LENGTH,
} from "@notra/sites-core/constants/sites";
import {
  ResponsiveDialog,
  ResponsiveDialogContent,
  ResponsiveDialogDescription,
  ResponsiveDialogFooter,
  ResponsiveDialogHeader,
  ResponsiveDialogTitle,
} from "@notra/ui/components/shared/responsive-dialog";
import {
  Field,
  FieldContent,
  FieldDescription,
  FieldLabel,
  FieldTitle,
} from "@notra/ui/components/ui/field";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@notra/ui/components/ui/input-group";
import { Label } from "@notra/ui/components/ui/label";
import {
  RadioGroup,
  RadioGroupItem,
} from "@notra/ui/components/ui/radio-group";
import { Switch } from "@notra/ui/components/ui/switch";
import { useMutation } from "@tanstack/react-query";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { useSite } from "@/components/sites/site-context";
import { SiteRelativeTime } from "@/components/sites/site-relative-time";
import { SITE_PREVIEW_ACCESS_MODES } from "@/constants/site-preview-access";
import { useInvalidateSites } from "@/lib/hooks/use-sites";
import { dashboardOrpc } from "@/lib/orpc/query";
import type {
  SitePreviewAccessDialogProps,
  SitePreviewAccessFormProps,
} from "@/types/components/site-preview-access";
import type { SitePreviewAccessMode } from "@/types/site-preview-access";
import { toErrorMessage } from "@/utils/error-message";
import {
  sitePreviewAccessMode,
  sitePreviewAccessModeConfig,
} from "@/utils/site-preview-access";

/** The form, mounted fresh on every open so it always starts from the saved settings. */
function PreviewAccessForm({ onDone }: SitePreviewAccessFormProps) {
  const t = useTranslations("sites.previewAccess");
  const tCommon = useTranslations("common");
  const id = useId();
  const { organizationId, siteId, detail } = useSite();
  const { site } = detail;
  const invalidateSites = useInvalidateSites();
  const savedMode = sitePreviewAccessMode(site);
  const hasPassword = Boolean(site.previewPasswordSetAt);

  const [enabled, setEnabled] = useState(site.previewsEnabled);
  const [mode, setMode] = useState<SitePreviewAccessMode>(savedMode);
  const [password, setPassword] = useState("");
  const [editingPassword, setEditingPassword] = useState(!hasPassword);
  const [showPassword, setShowPassword] = useState(false);

  const wantsNewPassword = mode === "password" && editingPassword;
  const passwordTooShort =
    wantsNewPassword && password.length < SITE_PREVIEW_PASSWORD_MIN_LENGTH;
  const visibility = sitePreviewAccessModeConfig(mode).visibility;
  const removesPassword = hasPassword && mode !== "password";
  const isDirty =
    enabled !== site.previewsEnabled ||
    visibility !== site.previewVisibility ||
    removesPassword ||
    (wantsNewPassword && password.length > 0);
  const openPreviewCount = detail.previews.length;

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (
        enabled !== site.previewsEnabled ||
        visibility !== site.previewVisibility
      ) {
        await dashboardOrpc.sites.update.call({
          organizationId,
          siteId,
          previewsEnabled: enabled,
          previewVisibility: visibility,
        });
      }
      if (wantsNewPassword) {
        await dashboardOrpc.sites.previews.setPassword.call({
          organizationId,
          siteId,
          password,
        });
      } else if (removesPassword) {
        await dashboardOrpc.sites.previews.setPassword.call({
          organizationId,
          siteId,
          password: null,
        });
      }
    },
    onSuccess: async () => {
      toast.success(t("saved"));
      onDone();
      await invalidateSites();
    },
    onError: (error) => {
      toast.error(toErrorMessage(error, t("saveFailed")));
    },
  });

  const canSave = isDirty && !passwordTooShort && !saveMutation.isPending;

  return (
    <>
      <form
        className="space-y-5"
        id={`${id}-form`}
        onSubmit={(event) => {
          event.preventDefault();
          if (canSave) {
            saveMutation.mutate();
          }
        }}
      >
        <div className="space-y-2">
          <div className="flex items-start justify-between gap-4">
            <div className="min-w-0 space-y-0.5">
              <Label htmlFor={`${id}-enabled`}>{t("buildLabel")}</Label>
              <p className="text-muted-foreground text-sm text-pretty">
                {t.rich("buildDescription", {
                  branch: () => (
                    <code className="text-foreground font-mono text-xs">
                      {site.productionBranch}
                    </code>
                  ),
                })}
              </p>
            </div>
            <Switch
              checked={enabled}
              className="mt-0.5"
              id={`${id}-enabled`}
              onCheckedChange={setEnabled}
            />
          </div>
          {site.previewsEnabled && !enabled ? (
            <p className="text-muted-foreground bg-muted rounded-lg px-3 py-2 text-sm text-pretty">
              {openPreviewCount > 0
                ? t("buildOffWarning", { count: openPreviewCount })
                : t("buildOffHint")}
            </p>
          ) : null}
        </div>

        <fieldset className="space-y-2" disabled={!enabled}>
          <legend className="mb-2 text-sm font-medium">{t("whoLabel")}</legend>
          <RadioGroup
            disabled={!enabled}
            onValueChange={(next) => setMode(next as SitePreviewAccessMode)}
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
                  <RadioGroupItem
                    id={`${id}-${option.mode}`}
                    value={option.mode}
                  />
                </Field>
              </FieldLabel>
            ))}
          </RadioGroup>
        </fieldset>

        {enabled && mode === "password" ? (
          <div className="space-y-2">
            {editingPassword ? (
              <>
                <Label htmlFor={`${id}-password`}>
                  {hasPassword ? t("newPasswordLabel") : t("passwordLabel")}
                </Label>
                <InputGroup>
                  <InputGroupInput
                    aria-describedby={`${id}-password-hint`}
                    aria-invalid={passwordTooShort && password.length > 0}
                    autoComplete="new-password"
                    autoFocus
                    id={`${id}-password`}
                    maxLength={SITE_PREVIEW_PASSWORD_MAX_LENGTH}
                    onChange={(event) => setPassword(event.target.value)}
                    spellCheck={false}
                    type={showPassword ? "text" : "password"}
                    value={password}
                  />
                  <InputGroupAddon align="inline-end">
                    <InputGroupButton
                      aria-label={
                        showPassword ? t("hidePassword") : t("showPassword")
                      }
                      onClick={() => setShowPassword((shown) => !shown)}
                      size="icon-xs"
                    >
                      <HugeiconsIcon
                        icon={showPassword ? ViewOffIcon : ViewIcon}
                        strokeWidth={1.5}
                      />
                    </InputGroupButton>
                  </InputGroupAddon>
                </InputGroup>
                <p
                  className="text-muted-foreground text-xs text-pretty"
                  id={`${id}-password-hint`}
                >
                  {hasPassword
                    ? t("changeHint", {
                        min: SITE_PREVIEW_PASSWORD_MIN_LENGTH,
                      })
                    : t("passwordHint", {
                        min: SITE_PREVIEW_PASSWORD_MIN_LENGTH,
                      })}
                </p>
              </>
            ) : (
              <div className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2">
                <p className="text-muted-foreground min-w-0 text-sm">
                  {t.rich("passwordSet", {
                    time: () =>
                      site.previewPasswordSetAt ? (
                        <SiteRelativeTime
                          date={site.previewPasswordSetAt}
                          inline
                        />
                      ) : null,
                  })}
                </p>
                <Button
                  onClick={() => setEditingPassword(true)}
                  size="sm"
                  type="button"
                  variant="outline"
                >
                  {t("changePassword")}
                </Button>
              </div>
            )}
          </div>
        ) : null}
      </form>
      <ResponsiveDialogFooter>
        <Button
          disabled={saveMutation.isPending}
          onClick={onDone}
          type="button"
          variant="outline"
        >
          {tCommon("actions.cancel")}
        </Button>
        <Button
          disabled={!canSave}
          form={`${id}-form`}
          loading={saveMutation.isPending}
          type="submit"
        >
          {t("save")}
        </Button>
      </ResponsiveDialogFooter>
    </>
  );
}

/** Previews on or off, and who can open them: Notra login, a password too, or anyone. */
export function SitePreviewAccessDialog({
  open,
  onOpenChange,
}: SitePreviewAccessDialogProps) {
  const t = useTranslations("sites.previewAccess");
  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent>
        <ResponsiveDialogHeader>
          <ResponsiveDialogTitle>{t("title")}</ResponsiveDialogTitle>
          <ResponsiveDialogDescription>
            {t("description")}
          </ResponsiveDialogDescription>
        </ResponsiveDialogHeader>
        {open ? <PreviewAccessForm onDone={() => onOpenChange(false)} /> : null}
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

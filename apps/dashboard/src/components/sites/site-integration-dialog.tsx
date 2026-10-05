"use client";

import { ArrowUpRight01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
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
  FieldDescription,
  FieldError,
  FieldLabel,
} from "@notra/ui/components/ui/field";
import { Input } from "@notra/ui/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@notra/ui/components/ui/select";
import { Switch } from "@notra/ui/components/ui/switch";
import { useTranslations } from "next-intl";
import { useId, useState } from "react";
import { toast } from "sonner";

import { Button } from "@/components/button";
import { SiteIntegrationLogo } from "@/components/sites/site-integration-logo";
import { useSaveSiteIntegration } from "@/lib/hooks/use-site-integrations";
import type { SiteIntegrationDialogProps } from "@/types/components/sites";
import type { SiteIntegrationValues } from "@/types/site-integrations";
import { toErrorMessage } from "@/utils/error-message";
import {
  siteIntegrationFieldErrors,
  siteIntegrationFormValues,
  siteIntegrationSettingsFromValues,
} from "@/utils/site-integrations";

/**
 * Sets up one provider. Fields are checked against the same schema the build
 * uses; saving writes notra.json as a draft that goes live on publish.
 */
export function SiteIntegrationDialog({
  scope,
  provider,
  settings,
  open,
  onOpenChange,
}: SiteIntegrationDialogProps) {
  const t = useTranslations("sites.integrationsPage");
  const tCommon = useTranslations("common");
  const id = useId();
  const [values, setValues] = useState<SiteIntegrationValues>(() =>
    siteIntegrationFormValues(provider, settings)
  );
  const [showErrors, setShowErrors] = useState(false);
  const save = useSaveSiteIntegration(scope);
  const next = siteIntegrationSettingsFromValues(provider, values);
  const errors = siteIntegrationFieldErrors(provider, next);
  const hasErrors = Object.keys(errors).length > 0;
  const connected = settings !== null;
  const inputFields = provider.fields.filter(
    (field) => field.kind !== "switch"
  );
  const switchFields = provider.fields.filter(
    (field) => field.kind === "switch"
  );

  const submit = (nextSettings: Record<string, unknown> | null) => {
    save.mutate(
      { provider: provider.id, settings: nextSettings },
      {
        onSuccess: () => {
          toast.success(nextSettings ? t("saved") : t("removed"), {
            description: t("savedDescription"),
          });
          onOpenChange(false);
        },
        onError: (error) => {
          toast.error(toErrorMessage(error, t("saveFailed")));
        },
      }
    );
  };

  return (
    <ResponsiveDialog onOpenChange={onOpenChange} open={open}>
      <ResponsiveDialogContent className="sm:max-w-md">
        <ResponsiveDialogHeader>
          <div className="flex items-center gap-3">
            <SiteIntegrationLogo provider={provider} />
            <div className="min-w-0 space-y-0.5 text-left">
              <ResponsiveDialogTitle>{provider.name}</ResponsiveDialogTitle>
              <ResponsiveDialogDescription>
                {t(`providers.${provider.id}`)}
              </ResponsiveDialogDescription>
            </div>
          </div>
        </ResponsiveDialogHeader>
        <form
          className="space-y-4"
          id={`${id}-form`}
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            if (hasErrors) {
              setShowErrors(true);
              return;
            }
            submit(next);
          }}
        >
          {inputFields.map((field) => {
            const fieldId = `${id}-${field.key}`;
            // Field keys are notra.json keys, typed as strings; the messages mirror them.
            const label = t(
              `fields.${provider.id}.${field.key}` as Parameters<typeof t>[0]
            );
            const error = showErrors ? errors[field.key] : undefined;
            return (
              <Field data-invalid={error ? true : undefined} key={field.key}>
                <FieldLabel htmlFor={fieldId}>
                  {label}
                  {field.optional ? (
                    <span className="text-muted-foreground font-normal">
                      {t("optional")}
                    </span>
                  ) : null}
                </FieldLabel>
                {field.kind === "select" ? (
                  <Select
                    items={Object.fromEntries(
                      (field.options ?? []).map((option) => [
                        option,
                        t(`options.${option}` as Parameters<typeof t>[0]),
                      ])
                    )}
                    onValueChange={(next) => {
                      if (typeof next === "string") {
                        setValues((current) => ({
                          ...current,
                          [field.key]: next,
                        }));
                      }
                    }}
                    value={String(values[field.key] ?? "")}
                  >
                    <SelectTrigger
                      aria-describedby={error ? `${fieldId}-error` : undefined}
                      aria-invalid={error ? true : undefined}
                      className="w-full"
                      id={fieldId}
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {(field.options ?? []).map((option) => (
                        <SelectItem key={option} value={option}>
                          {t(`options.${option}` as Parameters<typeof t>[0])}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                ) : (
                  <Input
                    aria-describedby={error ? `${fieldId}-error` : undefined}
                    aria-invalid={error ? true : undefined}
                    autoCapitalize="none"
                    autoComplete="off"
                    id={fieldId}
                    onChange={(event) =>
                      setValues((current) => ({
                        ...current,
                        [field.key]: event.target.value,
                      }))
                    }
                    placeholder={field.placeholder}
                    spellCheck={false}
                    value={String(values[field.key] ?? "")}
                  />
                )}
                {error ? (
                  <FieldError id={`${fieldId}-error`}>{error}</FieldError>
                ) : null}
              </Field>
            );
          })}
          {switchFields.length > 0 ? (
            <fieldset className="space-y-3">
              <legend className="mb-3 text-sm font-medium">
                {t("tracking")}
              </legend>
              {switchFields.map((field) => {
                const fieldId = `${id}-${field.key}`;
                return (
                  <div
                    className="flex items-center justify-between gap-3"
                    key={field.key}
                  >
                    <label
                      className="text-muted-foreground text-sm"
                      htmlFor={fieldId}
                    >
                      {t(
                        `fields.${provider.id}.${field.key}` as Parameters<
                          typeof t
                        >[0]
                      )}
                    </label>
                    <Switch
                      checked={values[field.key] === true}
                      id={fieldId}
                      onCheckedChange={(checked) =>
                        setValues((current) => ({
                          ...current,
                          [field.key]: checked,
                        }))
                      }
                    />
                  </div>
                );
              })}
            </fieldset>
          ) : null}
          <FieldDescription>
            <a
              className="inline-flex items-center gap-1"
              href={provider.docsUrl}
              rel="noopener noreferrer"
              target="_blank"
            >
              {t("docs", { provider: provider.name })}
              <HugeiconsIcon icon={ArrowUpRight01Icon} size={12} />
            </a>
          </FieldDescription>
        </form>
        <ResponsiveDialogFooter className="sm:justify-between">
          {connected ? (
            <Button
              disabled={save.isPending}
              onClick={() => submit(null)}
              type="button"
              variant="ghost"
            >
              {t("remove")}
            </Button>
          ) : (
            <span aria-hidden="true" />
          )}
          <div className="flex flex-col-reverse gap-2 sm:flex-row">
            <Button
              disabled={save.isPending}
              onClick={() => onOpenChange(false)}
              type="button"
              variant="outline"
            >
              {tCommon("actions.cancel")}
            </Button>
            <Button form={`${id}-form`} loading={save.isPending} type="submit">
              {connected ? t("save") : t("connect")}
            </Button>
          </div>
        </ResponsiveDialogFooter>
      </ResponsiveDialogContent>
    </ResponsiveDialog>
  );
}

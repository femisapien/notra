"use client";

import { HugeiconsIcon } from "@hugeicons/react";
import {
  Autocomplete,
  AutocompleteContent,
  AutocompleteEmpty,
  AutocompleteInput,
  AutocompleteItem,
  AutocompleteList,
} from "@notra/ui/components/ui/autocomplete";

import type { SiteSuggestInputProps } from "@/types/components/sites";

/** A text field that suggests values from the repository but accepts anything typed. */
export function SiteSuggestInput({
  id,
  value,
  onValueChange,
  suggestions,
  icon,
  placeholder,
  emptyLabel,
}: SiteSuggestInputProps) {
  return (
    <Autocomplete
      items={suggestions}
      onValueChange={onValueChange}
      openOnInputClick
      value={value}
    >
      <AutocompleteInput
        autoComplete="off"
        id={id}
        placeholder={placeholder}
        spellCheck={false}
      />
      {suggestions.length > 0 ? (
        <AutocompleteContent>
          <AutocompleteEmpty>{emptyLabel}</AutocompleteEmpty>
          <AutocompleteList>
            {(suggestion: string) => (
              <AutocompleteItem key={suggestion} value={suggestion}>
                <HugeiconsIcon
                  aria-hidden="true"
                  className="text-muted-foreground"
                  icon={icon}
                  strokeWidth={1.5}
                />
                <span className="truncate font-mono text-xs">{suggestion}</span>
              </AutocompleteItem>
            )}
          </AutocompleteList>
        </AutocompleteContent>
      ) : null}
    </Autocomplete>
  );
}

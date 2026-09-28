"use client";

import { cn } from "cn";
import type { FormEvent } from "react";
import { useState } from "react";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";

import { OPENCODE_COLORS } from "../../constants/brainless-opencode";
import {
  OPENCODE_AGENTS,
  OPENCODE_EFFORTS,
  OPENCODE_MODELS,
} from "../../constants/opencode-models";
import type {
  OpencodeComposerProps,
  OpencodeModelOption,
} from "../../types/brainless-opencode";

function ComposerChoice({
  label,
  value,
  options,
  onSelect,
  color,
  className,
}: {
  label: string;
  value: string;
  options: readonly { value: string; label: string }[];
  onSelect: (value: string) => void;
  color: string;
  className?: string;
}) {
  return (
    <DropdownMenu modal={false}>
      <DropdownMenuTrigger
        render={
          <button
            aria-label={`${label}: ${value}`}
            className={cn(
              "rounded-sm outline-none hover:underline focus-visible:ring-1 focus-visible:ring-current",
              className
            )}
            style={{ color }}
            type="button"
          />
        }
      >
        {value}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        align="start"
        className="w-52 font-mono text-xs"
        side="top"
        sideOffset={8}
      >
        {options.map((option) => (
          <DropdownMenuItem
            aria-current={option.value === value ? "true" : undefined}
            className="font-mono text-xs"
            key={option.value}
            onClick={() => onSelect(option.value)}
          >
            {option.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export function OpencodeComposer({
  value,
  defaultValue = "",
  onChange,
  onKeyDown,
  onSend,
  placeholder = 'Ask anything... "Fix a TODO in the codebase"',
  agent: agentProp,
  defaultAgent = "Build",
  onAgentChange,
  model: modelProp,
  defaultModel = "GPT-5.6 Sol",
  models = OPENCODE_MODELS,
  onModelChange,
  provider: providerProp,
  effort: effortProp,
  defaultEffort = "low",
  onEffortChange,
  context,
  footer,
  className,
  inputClassName,
  ref,
}: OpencodeComposerProps) {
  const [inputValue, setInputValue] = useState(defaultValue);
  const [selectedAgent, setSelectedAgent] = useState(defaultAgent);
  const [selectedModel, setSelectedModel] = useState(defaultModel);
  const [selectedEffort, setSelectedEffort] = useState(defaultEffort);
  const agent = agentProp ?? selectedAgent;
  const agentColor =
    agent.toLowerCase() === "plan"
      ? OPENCODE_COLORS.orange
      : OPENCODE_COLORS.purple;
  const model = modelProp ?? selectedModel;
  const effort = effortProp ?? selectedEffort;
  const modelOptions: readonly OpencodeModelOption[] = models.some(
    (option) => option.label === model
  )
    ? models
    : [{ id: model, label: model, provider: providerProp ?? "" }, ...models];
  const provider =
    (modelProp !== undefined ? providerProp : undefined) ??
    modelOptions.find((option) => option.label === model)?.provider;

  function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const text = (value ?? inputValue).trim();
    if (!text || !onSend) {
      return;
    }
    onSend(text);
    if (value === undefined) {
      setInputValue("");
    }
  }

  return (
    <form
      autoComplete="off"
      className={cn("min-w-0 font-mono", className)}
      onSubmit={handleSubmit}
    >
      <div
        className="border-l-2 px-4 pt-3 pb-2"
        style={{
          borderColor: agentColor,
          background: OPENCODE_COLORS.surface,
        }}
      >
        <Input
          aria-label="Prompt"
          autoComplete="off"
          className={cn(
            "h-auto w-full min-w-0 rounded-none border-0 bg-transparent px-0 py-0 font-mono text-[13px] leading-6 shadow-none outline-none placeholder:text-current focus-visible:border-0 focus-visible:ring-0",
            inputClassName
          )}
          onChange={(event) => {
            if (value === undefined) {
              setInputValue(event.target.value);
            }
            onChange?.(event);
          }}
          onKeyDown={onKeyDown}
          placeholder={placeholder}
          ref={ref}
          style={{
            background: "transparent",
            border: 0,
            boxShadow: "none",
            color: OPENCODE_COLORS.foreground,
            caretColor: OPENCODE_COLORS.foreground,
          }}
          type="text"
          value={value ?? inputValue}
        />
        <div className="mt-3 flex min-w-0 flex-wrap items-center gap-x-2 text-[12px] leading-5">
          <ComposerChoice
            color={agentColor}
            label="Agent"
            onSelect={(next) => {
              if (agentProp === undefined) {
                setSelectedAgent(next);
              }
              onAgentChange?.(next);
            }}
            options={OPENCODE_AGENTS.map((option) => ({
              value: option,
              label: option,
            }))}
            value={agent}
          />
          <span style={{ color: OPENCODE_COLORS.muted }}>·</span>
          <ComposerChoice
            color={OPENCODE_COLORS.foreground}
            label="Model"
            onSelect={(next) => {
              const option = modelOptions.find((item) => item.label === next);
              if (!option) {
                return;
              }
              if (modelProp === undefined) {
                setSelectedModel(option.label);
              }
              onModelChange?.(option);
            }}
            options={modelOptions.map((option) => ({
              value: option.label,
              label: `${option.label} · ${option.provider}`,
            }))}
            value={model}
          />
          <span style={{ color: OPENCODE_COLORS.muted }}>{provider}</span>
          <span style={{ color: OPENCODE_COLORS.muted }}>·</span>
          <ComposerChoice
            className="font-semibold"
            color={OPENCODE_COLORS.foreground}
            label="Effort"
            onSelect={(next) => {
              if (effortProp === undefined) {
                setSelectedEffort(next);
              }
              onEffortChange?.(next);
            }}
            options={OPENCODE_EFFORTS.map((option) => ({
              value: option,
              label: option,
            }))}
            value={effort}
          />
        </div>
      </div>
      {footer ?? (
        <div className="flex min-w-0 items-center justify-between gap-4 px-4 pt-2 text-[11px]">
          <span style={{ color: OPENCODE_COLORS.muted }}>
            <span style={{ color: OPENCODE_COLORS.foreground }}>tab</span>{" "}
            agents
            <span
              className="ml-4"
              style={{ color: OPENCODE_COLORS.foreground }}
            >
              ctrl+p
            </span>{" "}
            commands
          </span>
          {context ? (
            <span style={{ color: OPENCODE_COLORS.muted }}>{context}</span>
          ) : null}
        </div>
      )}
    </form>
  );
}

"use client";

import {
  Collapsible,
} from "@notra/ui/components/ui/collapsible";
import type { ComponentProps } from "react";
import { cn } from "@notra/ui/lib/utils";

export type ToolProps = ComponentProps<typeof Collapsible>;

export const Tool = ({ className, ...props }: ToolProps) => (
  <Collapsible
    className={cn("not-prose mb-4 w-full rounded-md border", className)}
    {...props}
  />
);

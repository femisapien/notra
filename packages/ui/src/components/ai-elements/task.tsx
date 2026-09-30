"use client";

import {
  Collapsible,
} from "@notra/ui/components/ui/collapsible";
import type { ComponentProps } from "react";
import { cn } from "@notra/ui/lib/utils";





export type TaskProps = ComponentProps<typeof Collapsible>;

export const Task = ({
  defaultOpen = true,
  className,
  ...props
}: TaskProps) => (
  <Collapsible className={cn(className)} defaultOpen={defaultOpen} {...props} />
);

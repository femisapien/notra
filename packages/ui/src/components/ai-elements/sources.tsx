"use client";

import { Book01Icon } from "@hugeicons/core-free-icons";
import { HugeiconsIcon } from "@hugeicons/react";
import {
  Collapsible,
} from "@notra/ui/components/ui/collapsible";
import type { ComponentProps } from "react";
import { cn } from "@notra/ui/lib/utils";

export type SourcesProps = ComponentProps<"div">;

export const Sources = ({ className, ...props }: SourcesProps) => (
  <Collapsible
    className={cn("not-prose mb-4 text-primary text-xs", className)}
    {...props}
  />
);





export type SourceProps = ComponentProps<"a">;

export const Source = ({ href, title, children, ...props }: SourceProps) => (
  <a
    className="flex items-center gap-2"
    href={href}
    rel="noreferrer"
    target="_blank"
    {...props}
  >
    {children ?? (
      <>
        <HugeiconsIcon className="h-4 w-4" icon={Book01Icon} />
        <span className="block font-medium">{title}</span>
      </>
    )}
  </a>
);

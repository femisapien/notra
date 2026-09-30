"use client";

import {
  Card,
} from "@notra/ui/components/ui/card";
import {
  Collapsible,
} from "@notra/ui/components/ui/collapsible";
import type { ComponentProps } from "react";
import { createContext } from "react";
import { cn } from "@notra/ui/lib/utils";

type PlanContextValue = {
  isStreaming: boolean;
};

const PlanContext = createContext<PlanContextValue | null>(null);


export type PlanProps = ComponentProps<typeof Collapsible> & {
  isStreaming?: boolean;
};

export const Plan = ({
  className,
  isStreaming = false,
  children,
  ...props
}: PlanProps) => (
  <PlanContext.Provider value={{ isStreaming }}>
    <Collapsible
      data-slot="plan"
      {...props}
      render={<Card className={cn("shadow-none", className)} />}
    >
      {children}
    </Collapsible>
  </PlanContext.Provider>
);

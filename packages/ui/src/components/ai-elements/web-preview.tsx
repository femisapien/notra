"use client";

import { Input } from "@notra/ui/components/ui/input";
import type { ComponentProps, ReactNode } from "react";
import { createContext, use } from "react";

const HTTP_PROTOCOLS = new Set(["http:", "https:"]);

export interface WebPreviewContextValue {
  url: string;
  setUrl: (url: string) => void;
  consoleOpen: boolean;
  setConsoleOpen: (open: boolean) => void;
}

const WebPreviewContext = createContext<WebPreviewContextValue | null>(null);



export type WebPreviewProps = ComponentProps<"div"> & {
  defaultUrl?: string;
  onUrlChange?: (url: string) => void;
};






export type WebPreviewUrlProps = ComponentProps<typeof Input>;




export type WebPreviewBodyProps = ComponentProps<"iframe"> & {
  loading?: ReactNode;
};


export type WebPreviewConsoleProps = ComponentProps<"div"> & {
  logs?: Array<{
    level: "log" | "warn" | "error";
    message: string;
    timestamp: Date;
  }>;
};

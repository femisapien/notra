"use client";

import { createContext, useContext } from "react";

export const DemoContext = createContext(false);
export function useDemoMode() {
  return useContext(DemoContext);
}

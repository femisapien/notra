"use client";

import dynamic from "next/dynamic";

const DemoRuntime = dynamic(
  () => import("./demo-runtime").then((module) => module.DemoRuntime),
  { ssr: false }
);

export function DemoLoader() {
  return <DemoRuntime />;
}

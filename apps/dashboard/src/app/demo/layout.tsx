import { Suspense } from "react";

import { DemoLoader } from "@/components/demo/demo-loader";

export default function DemoLayout() {
  return (
    <Suspense fallback={null}>
      <DemoLoader />
    </Suspense>
  );
}

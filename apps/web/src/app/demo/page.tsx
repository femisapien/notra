/* oxlint-disable react/iframe-missing-sandbox -- The dashboard is on a separate origin. It needs its own origin for Next navigation and cannot access the marketing parent. */
import type { Metadata } from "next";

import { APP_URL } from "@/utils/urls";

export const metadata: Metadata = {
  title: "Interactive dashboard demo",
  description: "Explore the Notra dashboard with read-only Neon example data.",
  alternates: { canonical: "/demo" },
  robots: { index: false, follow: true },
};

export default function DemoPage() {
  const dashboardOrigin =
    process.env.NODE_ENV === "development" ? "http://localhost:3002" : APP_URL;
  return (
    <iframe
      className="bg-background fixed inset-0 h-dvh w-full border-0"
      sandbox="allow-scripts allow-same-origin allow-downloads"
      src={`${dashboardOrigin}/demo/geo`}
      title="Notra dashboard demo for Neon"
    />
  );
}

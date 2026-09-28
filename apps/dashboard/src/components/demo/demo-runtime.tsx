"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { AutumnProvider } from "autumn-js/react";
import { useEffect, useState } from "react";

import { CommandPaletteProvider } from "@/components/command-palette/command-palette-context";
import { DashboardOverlays } from "@/components/dashboard/dashboard-client-wrapper";
import { DashboardShell } from "@/components/dashboard/dashboard-shell";
import { FeedbackProvider } from "@/components/dashboard/feedback-context";
import { RightPanelProvider } from "@/components/dashboard/right-panel-context";
import { DemoContext } from "@/components/demo/demo-context";
import { DemoPages } from "@/components/demo/demo-pages";
import { DatabaseProvider } from "@/components/providers/database-provider";
import { DatabuddyFlagsProvider } from "@/components/providers/databuddy-flags-provider";
import { GeoProjectProvider } from "@/components/providers/geo-project-provider";
import { OrganizationSnapshotProvider } from "@/components/providers/organization-provider";
import { DEMO_PROJECT } from "@/constants/demo/geo";
import { DEMO_ORGANIZATION, DEMO_SESSION } from "@/constants/demo/workspace";
import { installDemoNetworkBoundary } from "@/lib/demo/network";
import { QUERY_KEYS } from "@/utils/query-keys";

export function DemoRuntime() {
  const [ready, setReady] = useState(false);
  const [queryClient] = useState(() => {
    const client = new QueryClient({
      defaultOptions: {
        queries: {
          retry: false,
          staleTime: Infinity,
          refetchOnWindowFocus: false,
        },
        mutations: { retry: false },
      },
    });
    client.setQueryData(QUERY_KEYS.AUTH.session, DEMO_SESSION);
    // These settings normally use server actions, which the demo blocks.
    client.setQueryData(["accounts"], []);
    client.setQueryData([...QUERY_KEYS.AUTH.security, DEMO_SESSION.user.id], {
      email: DEMO_SESSION.user.email,
      totpFactors: [],
      backupCodesRemaining: 0,
    });
    return client;
  });
  useEffect(() => {
    const restore = installDemoNetworkBoundary();
    setReady(true);
    return restore;
  }, []);
  if (!ready) {
    return null;
  }
  return (
    <DemoContext value={true}>
      <QueryClientProvider client={queryClient}>
        <DatabaseProvider>
          <AutumnProvider>
            <OrganizationSnapshotProvider organization={DEMO_ORGANIZATION}>
              <DatabuddyFlagsProvider>
                <GeoProjectProvider projectId={DEMO_PROJECT.id}>
                  <FeedbackProvider>
                    <CommandPaletteProvider>
                      <RightPanelProvider>
                        <DashboardShell
                          footer={
                            <p className="bg-background text-muted-foreground shrink-0 border-t px-3 py-1 text-center text-xs">
                              Demo · Example data · Read only
                            </p>
                          }
                          initialOnboardingAgentRun={{
                            organizationId: DEMO_ORGANIZATION.id,
                            state: {
                              ran: true,
                              running: false,
                              startedAt: null,
                            },
                          }}
                          initialSidebarOpen
                          initialSidebarWidth={256}
                        >
                          <DemoPages />
                        </DashboardShell>
                        <DashboardOverlays />
                      </RightPanelProvider>
                    </CommandPaletteProvider>
                  </FeedbackProvider>
                </GeoProjectProvider>
              </DatabuddyFlagsProvider>
            </OrganizationSnapshotProvider>
          </AutumnProvider>
        </DatabaseProvider>
      </QueryClientProvider>
    </DemoContext>
  );
}

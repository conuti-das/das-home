import { useMemo } from "react";
import { AppShell as PrinceAppShell, Sidebar, Icon } from "prince-ui";
import type { SidebarGroup } from "prince-ui";
import { useDashboardStore } from "@/stores/dashboardStore";
import { toPrinceIcon } from "@/utils/princeIcon";

interface AppShellProps {
  children: React.ReactNode;
}

/**
 * App-Hülle auf Basis der prince-ui `AppShell` (0.8.0).
 *
 * Ersetzt die frühere eigene Flex-Hülle. Die bestehende Raum-/Dashboard-
 * Navigation (dashboard.views) wird als prince-ui `<Sidebar/>` eingehängt und
 * treibt weiterhin `setActiveViewId` — Funktionalität (Dashboards, Popups,
 * Edit-Mode, BottomToolbar) bleibt unverändert, nur das Chrome ist prince-ui.
 *
 * `glass` bleibt auf dem Default (true) → „Liquid Glass" auf Bar + Sidebar.
 */
export function AppShell({ children }: AppShellProps) {
  const { dashboard, activeViewId, setActiveViewId } = useDashboardStore();

  const groups = useMemo<SidebarGroup[]>(() => {
    if (!dashboard) return [];
    return [
      {
        label: "Bereiche",
        items: dashboard.views.map((view) => ({
          id: view.id,
          label: view.name,
          icon: <Icon name={toPrinceIcon(view.icon)} />,
        })),
      },
    ];
  }, [dashboard]);

  const sidebar =
    groups.length > 0 ? (
      <Sidebar
        groups={groups}
        selectedKey={activeViewId}
        onSelect={(id) => setActiveViewId(id)}
      />
    ) : undefined;

  return (
    <PrinceAppShell
      title="das-home"
      sidebar={sidebar}
    >
      <div
        style={{
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "var(--dh-gray500)",
        }}
      >
        {children}
      </div>
    </PrinceAppShell>
  );
}

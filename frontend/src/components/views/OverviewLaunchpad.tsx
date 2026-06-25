import { useMemo } from "react";
import { Launchpad, Icon } from "prince-ui";
import type { LaunchpadSection } from "prince-ui";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useEntityStore } from "@/stores/entityStore";
import { toPrinceIcon } from "@/utils/princeIcon";

export { OVERVIEW_VIEW_ID } from "@/stores/dashboardStore";

/**
 * Übersicht / Landing auf Basis der prince-ui `Launchpad` (0.9.0).
 *
 * Kurzer Überblick, was die App ist und kann, plus Sprung-Kacheln in die
 * bestehenden Dashboard-Ansichten (bleiben über die Sidebar weiter erreichbar).
 * Die eigentlichen Dashboards (GridView/ObjectPage) sind unverändert.
 */
export function OverviewLaunchpad() {
  const { dashboard, setActiveViewId } = useDashboardStore();
  const entityCount = useEntityStore((s) => s.entities.size);
  const areaCount = useEntityStore((s) => s.areas.size);

  const sections = useMemo<LaunchpadSection[]>(() => {
    const views = dashboard?.views ?? [];

    const intro: LaunchpadSection = {
      id: "intro",
      title: "das-home",
      subtitle:
        "Dein Home-Assistant-Dashboard. Räume und Geräte steuern, Sensoren " +
        "im Blick behalten, Ansichten frei zusammenstellen.",
      cards: [
        {
          kind: "kpi",
          id: "kpi-views",
          title: "Ansichten",
          value: views.length,
          icon: <Icon name="grid" />,
        },
        {
          kind: "kpi",
          id: "kpi-areas",
          title: "Bereiche",
          value: areaCount,
          icon: <Icon name="building" />,
        },
        {
          kind: "kpi",
          id: "kpi-entities",
          title: "Entitäten",
          value: entityCount,
          icon: <Icon name="bolt" />,
        },
      ],
    };

    const navigate: LaunchpadSection = {
      id: "views",
      title: "Ansichten öffnen",
      cards: views.map((view) => ({
        kind: "nav" as const,
        id: `nav-${view.id}`,
        title: view.name,
        icon: <Icon name={toPrinceIcon(view.icon)} />,
        description: view.area || undefined,
        onPress: () => setActiveViewId(view.id),
      })),
    };

    return navigate.cards.length > 0 ? [intro, navigate] : [intro];
  }, [dashboard, entityCount, areaCount, setActiveViewId]);

  return (
    <div style={{ padding: "1rem", height: "100%", overflow: "auto" }}>
      <Launchpad sections={sections} />
    </div>
  );
}

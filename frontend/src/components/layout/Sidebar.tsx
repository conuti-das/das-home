import {
  SideNavigation,
  SideNavigationItem,
} from "@ui5/webcomponents-react";
import { useDashboardStore } from "@/stores/dashboardStore";

export function Sidebar() {
  const { dashboard, activeViewId, setActiveViewId } = useDashboardStore();

  if (!dashboard) return null;

  return (
    <SideNavigation
      style={{ width: "280px", flexShrink: 0 }}
      onSelectionChange={(e) => {
        const item = e.detail.item;
        const viewId = item.dataset.viewId;
        if (viewId) setActiveViewId(viewId);
      }}
    >
      {dashboard.views.map((view) => (
        <SideNavigationItem
          key={view.id}
          text={view.name}
          icon={view.icon.replace("mdi:", "")}
          selected={view.id === activeViewId}
          data-view-id={view.id}
        />
      ))}
    </SideNavigation>
  );
}

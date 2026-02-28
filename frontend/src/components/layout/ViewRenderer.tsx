import { useDashboardStore } from "@/stores/dashboardStore";
import { useHomeAssistant } from "@/hooks/useHomeAssistant";
import { GridView } from "@/components/views/GridView";
import { ObjectPageView } from "@/components/views/ObjectPageView";
import "@/components/cards";

interface ViewRendererProps {
  onOpenPopup?: (popupId: string, props?: Record<string, unknown>) => void;
}

export function ViewRenderer({ onOpenPopup }: ViewRendererProps) {
  const activeView = useDashboardStore((s) => {
    const { dashboard, activeViewId } = s;
    return dashboard?.views.find((v) => v.id === activeViewId);
  });

  const { callService } = useHomeAssistant();

  if (!activeView) {
    return (
      <div style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "var(--dh-gray100)",
        opacity: 0.5,
      }}>
        <h2>No view selected</h2>
      </div>
    );
  }

  if (activeView.type === "object_page") {
    return <ObjectPageView view={activeView} callService={callService} />;
  }

  return <GridView view={activeView} callService={callService} onOpenPopup={onOpenPopup} />;
}

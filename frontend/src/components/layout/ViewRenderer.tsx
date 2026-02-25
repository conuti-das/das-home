import { Title, FlexBox, FlexBoxDirection, FlexBoxAlignItems, FlexBoxJustifyContent } from "@ui5/webcomponents-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useHomeAssistant } from "@/hooks/useHomeAssistant";
import { GridView } from "@/components/views/GridView";
import { ObjectPageView } from "@/components/views/ObjectPageView";
import "@/components/cards"; // ensure card registrations run

export function ViewRenderer() {
  const activeView = useDashboardStore((s) => {
    const { dashboard, activeViewId } = s;
    return dashboard?.views.find((v) => v.id === activeViewId);
  });

  const { callService } = useHomeAssistant();

  if (!activeView) {
    return (
      <FlexBox
        direction={FlexBoxDirection.Column}
        alignItems={FlexBoxAlignItems.Center}
        justifyContent={FlexBoxJustifyContent.Center}
        style={{ flex: 1 }}
      >
        <Title level="H2">No view selected</Title>
      </FlexBox>
    );
  }

  if (activeView.type === "object_page") {
    return <ObjectPageView view={activeView} callService={callService} />;
  }

  return <GridView view={activeView} callService={callService} />;
}

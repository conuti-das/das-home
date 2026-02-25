import { Title, FlexBox, FlexBoxDirection, FlexBoxAlignItems, FlexBoxJustifyContent } from "@ui5/webcomponents-react";
import { useDashboardStore } from "@/stores/dashboardStore";

export function ViewRenderer() {
  const activeView = useDashboardStore((s) => {
    const { dashboard, activeViewId } = s;
    return dashboard?.views.find((v) => v.id === activeViewId);
  });

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

  return (
    <div style={{ flex: 1, padding: "1rem", overflow: "auto" }}>
      <Title level="H2">{activeView.name}</Title>
      <p style={{ color: "var(--sapContent_LabelColor)" }}>
        View type: {activeView.type} | Sections: {activeView.sections.length}
      </p>
      {/* Card rendering will be added in Phase 4 */}
    </div>
  );
}

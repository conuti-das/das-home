import { ShellBar, Card, CardHeader, FlexBox, FlexBoxDirection, FlexBoxAlignItems, FlexBoxJustifyContent, Title } from "@ui5/webcomponents-react";

export default function App() {
  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <ShellBar primaryTitle="das-home" />
      <FlexBox
        direction={FlexBoxDirection.Column}
        alignItems={FlexBoxAlignItems.Center}
        justifyContent={FlexBoxJustifyContent.Center}
        style={{ flex: 1, gap: "1rem" }}
      >
        <Title level="H1">das-home</Title>
        <Card header={<CardHeader titleText="Setup Required" />}>
          <div style={{ padding: "1rem" }}>
            <p>Dashboard is not configured yet. Setup wizard will start automatically.</p>
          </div>
        </Card>
      </FlexBox>
    </div>
  );
}

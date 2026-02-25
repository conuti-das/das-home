import { useState } from "react";
import {
  Dialog,
  Wizard,
  WizardStep,
  Input,
  Button,
  BusyIndicator,
  MessageStrip,
  Title,
  Text,
  FlexBox,
  FlexBoxDirection,
  FlexBoxAlignItems,
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/connected.js";
import "@ui5/webcomponents-icons/dist/search.js";
import "@ui5/webcomponents-icons/dist/inspect.js";
import "@ui5/webcomponents-icons/dist/customize.js";
import "@ui5/webcomponents-icons/dist/accept.js";
import { useConfigStore } from "@/stores/configStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { api } from "@/services/api";
import { runDiscovery, suggestDashboard, type DiscoveryResult } from "@/services/discovery";
import type { AppConfiguration, DashboardConfig } from "@/types";

interface SetupWizardProps {
  open: boolean;
  onComplete: () => void;
}

type Step = "connection" | "discovery" | "preview" | "customize" | "done";

export function SetupWizard({ open, onComplete }: SetupWizardProps) {
  const config = useConfigStore((s) => s.config);
  const setConfig = useConfigStore((s) => s.setConfig);
  const setDashboard = useDashboardStore((s) => s.setDashboard);

  const [step, setStep] = useState<Step>("connection");
  const [hassUrl, setHassUrl] = useState(config?.connection.hass_url || "http://homeassistant.local:8123");
  const [hassToken, setHassToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [discovery, setDiscovery] = useState<DiscoveryResult | null>(null);
  const [suggestedDashboard, setSuggestedDashboard] = useState<DashboardConfig | null>(null);

  const testConnection = async () => {
    setLoading(true);
    setError("");
    try {
      // Save connection config first
      const newConfig: AppConfiguration = {
        ...(config || {
          version: 1,
          locale: "de",
          custom_js_enabled: false,
          hacs_cards: [],
          sidebar: { width: 280, visible: true, show_clock: true, show_weather: true, weather_entity: "weather.home" },
        }),
        connection: { hass_url: hassUrl, token_stored: true },
      };
      await api.putConfig(newConfig);
      setConfig(newConfig);

      // Test by running discovery
      const result = await runDiscovery();
      setDiscovery(result);
      setStep("discovery");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Connection failed");
    } finally {
      setLoading(false);
    }
  };

  const generateDashboard = async () => {
    setLoading(true);
    setError("");
    try {
      const dashboard = await suggestDashboard();
      setSuggestedDashboard(dashboard);
      setStep("preview");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Dashboard generation failed");
    } finally {
      setLoading(false);
    }
  };

  const saveDashboard = async () => {
    if (!suggestedDashboard) return;
    setLoading(true);
    try {
      await api.putDashboard(suggestedDashboard);
      setDashboard(suggestedDashboard);
      setStep("done");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed");
    } finally {
      setLoading(false);
    }
  };

  const selectedStep = ["connection", "discovery", "preview", "customize", "done"].indexOf(step);

  return (
    <Dialog
      open={open}
      headerText="das-home Setup"
      style={{ width: "min(700px, 90vw)" }}
    >
      <Wizard
        onStepChange={(e) => {
          const steps: Step[] = ["connection", "discovery", "preview", "customize", "done"];
          const idx = e.detail?.step?.dataset?.step;
          if (idx !== undefined) setStep(steps[Number(idx)] || "connection");
        }}
      >
        {/* Step 1: Connection */}
        <WizardStep
          icon="connected"
          titleText="Connection"
          selected={selectedStep === 0}
          data-step="0"
        >
          <FlexBox direction={FlexBoxDirection.Column} alignItems={FlexBoxAlignItems.Stretch} style={{ gap: "1rem", padding: "1rem" }}>
            <Title level="H4">Connect to Home Assistant</Title>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", color: "var(--sapContent_LabelColor)" }}>
                Home Assistant URL
              </label>
              <Input
                value={hassUrl}
                onInput={(e) => setHassUrl((e.target as unknown as { value: string }).value)}
                placeholder="http://homeassistant.local:8123"
                style={{ width: "100%" }}
              />
            </div>
            <div>
              <label style={{ display: "block", marginBottom: "0.25rem", color: "var(--sapContent_LabelColor)" }}>
                Long-Lived Access Token
              </label>
              <Input
                type="Password"
                value={hassToken}
                onInput={(e) => setHassToken((e.target as unknown as { value: string }).value)}
                placeholder="Enter your HA token"
                style={{ width: "100%" }}
              />
            </div>
            {error && <MessageStrip design="Negative">{error}</MessageStrip>}
            <BusyIndicator active={loading}>
              <Button design="Emphasized" onClick={testConnection} disabled={loading}>
                Connect & Discover
              </Button>
            </BusyIndicator>
          </FlexBox>
        </WizardStep>

        {/* Step 2: Discovery Results */}
        <WizardStep
          icon="search"
          titleText="Discovery"
          selected={selectedStep === 1}
          disabled={!discovery}
          data-step="1"
        >
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "1rem", padding: "1rem" }}>
            <Title level="H4">Discovered Devices</Title>
            {discovery && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <Text>Entities: {discovery.summary.entity_count}</Text>
                  <Text>Areas: {discovery.summary.area_count}</Text>
                  <Text>Devices: {discovery.summary.device_count}</Text>
                  <Text>Floors: {discovery.summary.floor_count}</Text>
                </div>
                {discovery.areas.length > 0 && (
                  <div>
                    <Text style={{ fontWeight: "bold" }}>Areas:</Text>
                    <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
                      {discovery.areas.map((a) => (
                        <li key={a.area_id}>{a.name}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </>
            )}
            {error && <MessageStrip design="Negative">{error}</MessageStrip>}
            <BusyIndicator active={loading}>
              <Button design="Emphasized" onClick={generateDashboard} disabled={loading}>
                Generate Dashboard
              </Button>
            </BusyIndicator>
          </FlexBox>
        </WizardStep>

        {/* Step 3: Preview */}
        <WizardStep
          icon="inspect"
          titleText="Preview"
          selected={selectedStep === 2}
          disabled={!suggestedDashboard}
          data-step="2"
        >
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "1rem", padding: "1rem" }}>
            <Title level="H4">Dashboard Preview</Title>
            {suggestedDashboard && (
              <div>
                <Text>Views: {suggestedDashboard.views.length}</Text>
                <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
                  {suggestedDashboard.views.map((v) => (
                    <li key={v.id}>
                      {v.name} ({v.type}) - {v.sections.length} sections,{" "}
                      {v.sections.reduce((sum, s) => sum + s.items.length, 0)} cards
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {error && <MessageStrip design="Negative">{error}</MessageStrip>}
            <BusyIndicator active={loading}>
              <Button design="Emphasized" onClick={saveDashboard} disabled={loading}>
                Apply Dashboard
              </Button>
            </BusyIndicator>
          </FlexBox>
        </WizardStep>

        {/* Step 4: Done */}
        <WizardStep
          icon="accept"
          titleText="Done"
          selected={selectedStep === 4}
          disabled={step !== "done"}
          data-step="4"
        >
          <FlexBox direction={FlexBoxDirection.Column} alignItems={FlexBoxAlignItems.Center} style={{ gap: "1rem", padding: "2rem" }}>
            <Title level="H3">Setup Complete!</Title>
            <Text>Your dashboard has been created with {suggestedDashboard?.views.length || 0} views.</Text>
            <Button design="Emphasized" onClick={onComplete}>
              Open Dashboard
            </Button>
          </FlexBox>
        </WizardStep>
      </Wizard>
    </Dialog>
  );
}

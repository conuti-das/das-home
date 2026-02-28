import { useState, useEffect } from "react";
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
  Link,
  Icon,
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/connected.js";
import "@ui5/webcomponents-icons/dist/search.js";
import "@ui5/webcomponents-icons/dist/inspect.js";
import "@ui5/webcomponents-icons/dist/accept.js";
import "@ui5/webcomponents-icons/dist/key.js";
import "@ui5/webcomponents-icons/dist/hint.js";
import { useConfigStore } from "@/stores/configStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { api } from "@/services/api";
import { runDiscovery, suggestDashboard, type DiscoveryResult } from "@/services/discovery";
import type { AppConfiguration, DashboardConfig } from "@/types";

interface SetupWizardProps {
  open: boolean;
  onComplete: () => void;
}

type Step = "connection" | "discovery" | "preview" | "done";

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
  const [isAddon, setIsAddon] = useState(false);
  const [autoConnecting, setAutoConnecting] = useState(false);

  // Detect addon mode on mount
  useEffect(() => {
    if (!open) return;
    api.getHealth()
      .then((data) => {
        if (data.mode === "addon") {
          setIsAddon(true);
          // Auto-connect in addon mode (token comes from Supervisor)
          setAutoConnecting(true);
        }
      })
      .catch(() => {});
  }, [open]);

  // Auto-connect when addon mode detected
  useEffect(() => {
    if (!autoConnecting) return;
    setAutoConnecting(false);
    testConnection();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoConnecting]);

  const tokenPageUrl = hassUrl
    ? `${hassUrl.replace(/\/$/, "")}/profile/security`
    : "http://homeassistant.local:8123/profile/security";

  const testConnection = async () => {
    setLoading(true);
    setError("");
    try {
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

      const result = await runDiscovery();
      setDiscovery(result);
      setStep("discovery");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Verbindung fehlgeschlagen");
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
      setError(e instanceof Error ? e.message : "Dashboard-Generierung fehlgeschlagen");
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
      setError(e instanceof Error ? e.message : "Speichern fehlgeschlagen");
    } finally {
      setLoading(false);
    }
  };

  const selectedStep = ["connection", "discovery", "preview", "done"].indexOf(step);

  return (
    <Dialog
      open={open}
      headerText="DAS Home Setup"
      style={{ width: "min(700px, 90vw)" }}
    >
      <Wizard
        onStepChange={(e) => {
          const steps: Step[] = ["connection", "discovery", "preview", "done"];
          const idx = e.detail?.step?.dataset?.step;
          if (idx !== undefined) setStep(steps[Number(idx)] || "connection");
        }}
      >
        {/* Step 1: Connection */}
        <WizardStep
          icon="connected"
          titleText="Verbindung"
          selected={selectedStep === 0}
          data-step="0"
        >
          <FlexBox direction={FlexBoxDirection.Column} alignItems={FlexBoxAlignItems.Stretch} style={{ gap: "1rem", padding: "1rem" }}>
            <Title level="H4">Mit Home Assistant verbinden</Title>

            {isAddon ? (
              /* Addon mode: auto-detected, no token needed */
              <MessageStrip design="Information" hideCloseButton>
                Add-on Modus erkannt — Verbindung wird automatisch ueber den Supervisor hergestellt.
              </MessageStrip>
            ) : (
              /* Standalone mode: need URL + token */
              <>
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
                    Langlebiger Zugangstoken
                  </label>
                  <Input
                    type="Password"
                    value={hassToken}
                    onInput={(e) => setHassToken((e.target as unknown as { value: string }).value)}
                    placeholder="Dein HA-Token eingeben"
                    style={{ width: "100%" }}
                  />
                </div>

                {/* Token help box */}
                <div style={{
                  background: "var(--sapBackgroundColor)",
                  border: "1px solid var(--sapField_BorderColor)",
                  borderRadius: 8,
                  padding: "0.75rem 1rem",
                  fontSize: 13,
                }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.5rem" }}>
                    <Icon name="hint" style={{ width: 16, height: 16, color: "var(--sapInformativeColor)" }} />
                    <span style={{ fontWeight: 600 }}>Wo finde ich den Token?</span>
                  </div>
                  <ol style={{ margin: 0, paddingLeft: "1.25rem", lineHeight: 1.6 }}>
                    <li>
                      Oeffne{" "}
                      <Link href={tokenPageUrl} target="_blank">
                        Home Assistant Profil &gt; Sicherheit
                      </Link>
                    </li>
                    <li>Scrolle nach unten zu <strong>Langlebige Zugangstokens</strong></li>
                    <li>Klicke <strong>Token erstellen</strong>, vergib einen Namen (z.B. &quot;DAS Home&quot;)</li>
                    <li>Kopiere den Token und fuege ihn hier ein</li>
                  </ol>
                </div>
              </>
            )}

            {error && <MessageStrip design="Negative">{error}</MessageStrip>}
            <BusyIndicator active={loading}>
              <Button design="Emphasized" onClick={testConnection} disabled={loading}>
                {loading ? "Verbinde..." : "Verbinden & Erkennen"}
              </Button>
            </BusyIndicator>
          </FlexBox>
        </WizardStep>

        {/* Step 2: Discovery Results */}
        <WizardStep
          icon="search"
          titleText="Erkennung"
          selected={selectedStep === 1}
          disabled={!discovery}
          data-step="1"
        >
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "1rem", padding: "1rem" }}>
            <Title level="H4">Erkannte Geraete</Title>
            {discovery && (
              <>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "0.5rem" }}>
                  <Text>Entities: {discovery.summary.entity_count}</Text>
                  <Text>Bereiche: {discovery.summary.area_count}</Text>
                  <Text>Geraete: {discovery.summary.device_count}</Text>
                  <Text>Etagen: {discovery.summary.floor_count}</Text>
                </div>
                {discovery.areas.length > 0 && (
                  <div>
                    <Text style={{ fontWeight: "bold" }}>Bereiche:</Text>
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
                {loading ? "Generiere..." : "Dashboard generieren"}
              </Button>
            </BusyIndicator>
          </FlexBox>
        </WizardStep>

        {/* Step 3: Preview */}
        <WizardStep
          icon="inspect"
          titleText="Vorschau"
          selected={selectedStep === 2}
          disabled={!suggestedDashboard}
          data-step="2"
        >
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "1rem", padding: "1rem" }}>
            <Title level="H4">Dashboard-Vorschau</Title>
            {suggestedDashboard && (
              <div>
                <Text>Views: {suggestedDashboard.views.length}</Text>
                <ul style={{ margin: "0.5rem 0", paddingLeft: "1.5rem" }}>
                  {suggestedDashboard.views.map((v) => (
                    <li key={v.id}>
                      {v.name} ({v.type}) — {v.sections.length} Sektionen,{" "}
                      {v.sections.reduce((sum, s) => sum + s.items.length, 0)} Karten
                    </li>
                  ))}
                </ul>
              </div>
            )}
            {error && <MessageStrip design="Negative">{error}</MessageStrip>}
            <BusyIndicator active={loading}>
              <Button design="Emphasized" onClick={saveDashboard} disabled={loading}>
                {loading ? "Speichere..." : "Dashboard uebernehmen"}
              </Button>
            </BusyIndicator>
          </FlexBox>
        </WizardStep>

        {/* Step 4: Done */}
        <WizardStep
          icon="accept"
          titleText="Fertig"
          selected={selectedStep === 3}
          disabled={step !== "done"}
          data-step="3"
        >
          <FlexBox direction={FlexBoxDirection.Column} alignItems={FlexBoxAlignItems.Center} style={{ gap: "1rem", padding: "2rem" }}>
            <Title level="H3">Einrichtung abgeschlossen!</Title>
            <Text>Dein Dashboard wurde mit {suggestedDashboard?.views.length || 0} Views erstellt.</Text>
            <Button design="Emphasized" onClick={onComplete}>
              Dashboard oeffnen
            </Button>
          </FlexBox>
        </WizardStep>
      </Wizard>
    </Dialog>
  );
}

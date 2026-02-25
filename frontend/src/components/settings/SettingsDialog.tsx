import { useState } from "react";
import {
  Dialog,
  TabContainer,
  Tab,
  Input,
  Switch,
  Select,
  Option,
  Button,
  FlexBox,
  FlexBoxDirection,
  Label,
} from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/settings.js";
import "@ui5/webcomponents-icons/dist/connected.js";
import "@ui5/webcomponents-icons/dist/palette.js";
import { useConfigStore } from "@/stores/configStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { api } from "@/services/api";
import type { AppConfiguration } from "@/types";

interface SettingsDialogProps {
  open: boolean;
  onClose: () => void;
}

const THEMES = [
  { value: "sap_horizon_dark", label: "Horizon Dark" },
  { value: "sap_horizon", label: "Horizon Light" },
  { value: "sap_horizon_hcb", label: "High Contrast Black" },
  { value: "sap_horizon_hcw", label: "High Contrast White" },
];

export function SettingsDialog({ open, onClose }: SettingsDialogProps) {
  const config = useConfigStore((s) => s.config);
  const setConfig = useConfigStore((s) => s.setConfig);
  const dashboard = useDashboardStore((s) => s.dashboard);
  const setDashboard = useDashboardStore((s) => s.setDashboard);

  const [hassUrl, setHassUrl] = useState(config?.connection.hass_url || "");
  const [locale, setLocale] = useState(config?.locale || "de");
  const [theme, setTheme] = useState(dashboard?.theme || "sap_horizon_dark");
  const [accentColor, setAccentColor] = useState(dashboard?.accent_color || "#0070f3");
  const [autoTheme, setAutoTheme] = useState(dashboard?.auto_theme || false);
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    if (!config || !dashboard) return;
    setSaving(true);
    try {
      const newConfig: AppConfiguration = {
        ...config,
        connection: { ...config.connection, hass_url: hassUrl },
        locale,
      };
      const newDashboard = {
        ...dashboard,
        theme,
        accent_color: accentColor,
        auto_theme: autoTheme,
      };
      await Promise.all([
        api.putConfig(newConfig),
        api.putDashboard(newDashboard),
      ]);
      setConfig(newConfig);
      setDashboard(newDashboard);

      // Apply theme immediately
      import("@ui5/webcomponents-base/dist/config/Theme.js").then((mod) => {
        mod.setTheme(theme);
      });

      onClose();
    } finally {
      setSaving(false);
    }
  };

  return (
    <Dialog
      open={open}
      headerText="Settings"
      style={{ width: "min(600px, 90vw)" }}
      footer={
        <div style={{ display: "flex", justifyContent: "flex-end", gap: "0.5rem", padding: "0.5rem" }}>
          <Button design="Transparent" onClick={onClose}>Cancel</Button>
          <Button design="Emphasized" onClick={handleSave} disabled={saving}>
            {saving ? "Saving..." : "Save"}
          </Button>
        </div>
      }
    >
      <TabContainer>
        <Tab text="General" icon="settings" selected>
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "1rem", padding: "1rem" }}>
            <div>
              <Label>Language</Label>
              <Select
                onChange={(e) => setLocale(e.detail.selectedOption?.dataset?.value || "de")}
                style={{ width: "100%" }}
              >
                <Option data-value="de" selected={locale === "de"}>Deutsch</Option>
                <Option data-value="en" selected={locale === "en"}>English</Option>
              </Select>
            </div>
          </FlexBox>
        </Tab>

        <Tab text="Connection" icon="connected">
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "1rem", padding: "1rem" }}>
            <div>
              <Label>Home Assistant URL</Label>
              <Input
                value={hassUrl}
                onInput={(e) => setHassUrl((e.target as unknown as { value: string }).value)}
                style={{ width: "100%" }}
              />
            </div>
          </FlexBox>
        </Tab>

        <Tab text="Theme" icon="palette">
          <FlexBox direction={FlexBoxDirection.Column} style={{ gap: "1rem", padding: "1rem" }}>
            <div>
              <Label>Theme</Label>
              <Select
                onChange={(e) => setTheme(e.detail.selectedOption?.dataset?.value || "sap_horizon_dark")}
                style={{ width: "100%" }}
              >
                {THEMES.map((t) => (
                  <Option key={t.value} data-value={t.value} selected={t.value === theme}>
                    {t.label}
                  </Option>
                ))}
              </Select>
            </div>
            <div>
              <Label>Accent Color</Label>
              <Input
                value={accentColor}
                onInput={(e) => setAccentColor((e.target as unknown as { value: string }).value)}
                placeholder="#0070f3"
              />
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <Label>Auto Theme (follow sun entity)</Label>
              <Switch
                checked={autoTheme}
                onChange={() => setAutoTheme(!autoTheme)}
              />
            </div>
          </FlexBox>
        </Tab>
      </TabContainer>
    </Dialog>
  );
}

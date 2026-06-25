import { useState, useEffect } from "react";
import { Icon } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/home.js";
import {
  Modal,
  Tabs,
  TabBar,
  Tab,
  TabPanel,
  TextField,
  Switch,
  Select,
  SelectItem,
  Button,
  Link,
} from "@/components/ui";
import { useConfigStore } from "@/stores/configStore";
import { useDashboardStore } from "@/stores/dashboardStore";
import { api } from "@/services/api";
import { suggestDashboard } from "@/services/discovery";
import type { AppConfiguration } from "@/types";
import type { Key } from "react";
import "./SettingsDialog.css";

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

const LOCALES = [
  { value: "de", label: "Deutsch" },
  { value: "en", label: "English" },
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
  const [regenerating, setRegenerating] = useState(false);
  const [versionInfo, setVersionInfo] = useState<{ version: string; mode: string; releases_url: string } | null>(null);
  const [settingDefault, setSettingDefault] = useState(false);
  const [defaultPanelResult, setDefaultPanelResult] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      api.getHealth().then(setVersionInfo).catch(() => {});
      setDefaultPanelResult(null);
    }
  }, [open]);

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

  const handleRegenerate = async () => {
    setRegenerating(true);
    try {
      const newDashboard = await suggestDashboard();
      await api.putDashboard(newDashboard);
      setDashboard(newDashboard);
      onClose();
    } catch (e) {
      console.error("Regenerate failed:", e);
    } finally {
      setRegenerating(false);
    }
  };

  return (
    <Modal
      isOpen={open}
      onOpenChange={(next) => {
        if (!next) onClose();
      }}
      title="Settings"
      className="settings-dialog"
    >
      <Tabs className="settings-dialog__tabs">
        <TabBar aria-label="Einstellungen">
          <Tab id="general">Allgemein</Tab>
          <Tab id="connection">Verbindung</Tab>
          <Tab id="dashboard">Dashboard</Tab>
          <Tab id="theme">Theme</Tab>
          <Tab id="home">Startseite</Tab>
          <Tab id="version">Version</Tab>
        </TabBar>

        <TabPanel id="general">
          <div className="settings-dialog__section">
            <Select
              label="Sprache"
              selectedKey={locale}
              onSelectionChange={(key: Key | null) => key != null && setLocale(String(key))}
            >
              {LOCALES.map((l) => (
                <SelectItem key={l.value} id={l.value}>
                  {l.label}
                </SelectItem>
              ))}
            </Select>
          </div>
        </TabPanel>

        <TabPanel id="connection">
          <div className="settings-dialog__section">
            <TextField
              label="Home Assistant URL"
              value={hassUrl}
              onChange={setHassUrl}
            />
          </div>
        </TabPanel>

        <TabPanel id="dashboard">
          <div className="settings-dialog__section">
            <div className="settings-dialog__field-label">Dashboard neu generieren</div>
            <div className="settings-dialog__hint">
              Erkennt alle Entities neu und erstellt ein frisches Dashboard mit allen neuen Card-Typen (Wetter, Radar, Müllabfuhr, Bereiche).
            </div>
            <Button variant="tinted" onPress={handleRegenerate} isDisabled={regenerating}>
              {regenerating ? "Wird generiert..." : "Dashboard neu generieren"}
            </Button>
          </div>
        </TabPanel>

        <TabPanel id="theme">
          <div className="settings-dialog__section">
            <Select
              label="Theme"
              selectedKey={theme}
              onSelectionChange={(key: Key | null) => key != null && setTheme(String(key))}
            >
              {THEMES.map((t) => (
                <SelectItem key={t.value} id={t.value}>
                  {t.label}
                </SelectItem>
              ))}
            </Select>
            <TextField
              label="Akzentfarbe"
              value={accentColor}
              onChange={setAccentColor}
              placeholder="#0070f3"
            />
            <Switch isSelected={autoTheme} onChange={setAutoTheme}>
              Auto Theme (folgt der Sonnen-Entität)
            </Switch>
          </div>
        </TabPanel>

        <TabPanel id="home">
          <div className="settings-dialog__section">
            <div className="settings-dialog__field-label">DAS Home als Startseite</div>
            <div className="settings-dialog__hint">
              Setzt DAS Home als Standard-Startseite in Home Assistant.
              Beim Oeffnen von HA wird dann direkt das Dashboard angezeigt.
            </div>
            {versionInfo?.mode === "addon" ? (
              <>
                <Button
                  variant="filled"
                  isDisabled={settingDefault}
                  onPress={async () => {
                    setSettingDefault(true);
                    setDefaultPanelResult(null);
                    try {
                      const result = await api.setDefaultPanel();
                      if (result.status === "ok") {
                        setDefaultPanelResult("Startseite gesetzt! Beim naechsten Oeffnen von HA wird DAS Home angezeigt.");
                      } else {
                        setDefaultPanelResult(
                          "Hinweis: Die Einstellung wurde fuer den Supervisor-User gesetzt. " +
                          "Fuer deinen eigenen User gehe zu: HA Profil → Dashboard → und waehle den Eintrag mit DAS Home."
                        );
                      }
                    } catch {
                      setDefaultPanelResult("Fehler beim Setzen der Startseite. Versuche es manuell in den HA-Profileinstellungen.");
                    } finally {
                      setSettingDefault(false);
                    }
                  }}
                >
                  {settingDefault ? "Wird gesetzt..." : "Als Startseite setzen"}
                </Button>
                {defaultPanelResult && (
                  <div className="settings-dialog__result">{defaultPanelResult}</div>
                )}
              </>
            ) : (
              <div className="settings-dialog__hint">
                Im Standalone-Modus: Setze die Browser-Startseite auf die DAS Home URL.
              </div>
            )}
          </div>
        </TabPanel>

        <TabPanel id="version">
          <div className="settings-dialog__section">
            <div className="settings-dialog__version-head">
              <Icon name="home" style={{ width: 32, height: 32, color: "var(--prn-accent)" }} />
              <div>
                <div className="settings-dialog__version-title">das-home</div>
                <div className="settings-dialog__hint">
                  {versionInfo ? `v${versionInfo.version} (${versionInfo.mode})` : "..."}
                </div>
              </div>
            </div>
            {versionInfo && (
              <div>
                <Link href={`${versionInfo.releases_url}/tag/${versionInfo.version}`} target="_blank">
                  Versionshinweise lesen
                </Link>
              </div>
            )}
            {versionInfo && (
              <div className="settings-dialog__hint">
                <Link href={versionInfo.releases_url} target="_blank">
                  Alle Releases auf GitHub
                </Link>
              </div>
            )}
          </div>
        </TabPanel>
      </Tabs>

      <div className="settings-dialog__footer">
        <Button variant="plain" onPress={onClose}>
          Cancel
        </Button>
        <Button variant="filled" onPress={handleSave} isDisabled={saving}>
          {saving ? "Saving..." : "Save"}
        </Button>
      </div>
    </Modal>
  );
}

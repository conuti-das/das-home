import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { ViewRenderer } from "@/components/layout/ViewRenderer";
import { ConnectionStatus } from "@/components/layout/ConnectionStatus";
import { SetupWizard } from "@/components/wizard/SetupWizard";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useHomeAssistant } from "@/hooks/useHomeAssistant";
import { useKeyboardShortcuts } from "@/hooks/useKeyboard";
import { useThemeSync } from "@/hooks/useTheme";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useConfigStore } from "@/stores/configStore";
import { api } from "@/services/api";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const setDashboard = useDashboardStore((s) => s.setDashboard);
  const setConfig = useConfigStore((s) => s.setConfig);
  useHomeAssistant();
  useKeyboardShortcuts();
  useThemeSync();

  useEffect(() => {
    async function init() {
      try {
        const [authStatus, config, dashboardData] = await Promise.all([
          api.getAuthStatus(),
          api.getConfig(),
          api.getDashboard(),
        ]);
        setConfig(config);
        setDashboard(dashboardData);

        if (!authStatus.configured || dashboardData.views.length === 0) {
          setShowSetup(true);
        }
      } catch (e) {
        console.error("Failed to load config:", e);
        setShowSetup(true);
      } finally {
        setLoading(false);
      }
    }
    init();
  }, [setConfig, setDashboard]);

  if (loading) {
    return <div style={{ padding: "2rem" }}>Loading...</div>;
  }

  return (
    <>
      <SetupWizard
        open={showSetup}
        onComplete={() => setShowSetup(false)}
      />
      <SettingsDialog
        open={showSettings}
        onClose={() => setShowSettings(false)}
      />
      <AppShell onSettingsClick={() => setShowSettings(true)}>
        <ConnectionStatus />
        <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
          <Sidebar />
          <ViewRenderer />
        </div>
      </AppShell>
    </>
  );
}

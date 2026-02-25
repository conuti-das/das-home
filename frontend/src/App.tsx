import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { ViewRenderer } from "@/components/layout/ViewRenderer";
import { SetupWizard } from "@/components/wizard/SetupWizard";
import { useHomeAssistant } from "@/hooks/useHomeAssistant";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useConfigStore } from "@/stores/configStore";
import { api } from "@/services/api";

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const setDashboard = useDashboardStore((s) => s.setDashboard);
  const setConfig = useConfigStore((s) => s.setConfig);
  useHomeAssistant();

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

        // Show setup wizard if not configured or no views
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
      <AppShell onSettingsClick={() => console.log("TODO: settings dialog")}>
        <Sidebar />
        <ViewRenderer />
      </AppShell>
    </>
  );
}

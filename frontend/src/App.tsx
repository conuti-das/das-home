import { useEffect, useState } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { Sidebar } from "@/components/layout/Sidebar";
import { ViewRenderer } from "@/components/layout/ViewRenderer";
import { useHomeAssistant } from "@/hooks/useHomeAssistant";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useConfigStore } from "@/stores/configStore";
import { api } from "@/services/api";

export default function App() {
  const [loading, setLoading] = useState(true);
  const setDashboard = useDashboardStore((s) => s.setDashboard);
  const setConfig = useConfigStore((s) => s.setConfig);
  useHomeAssistant();

  useEffect(() => {
    async function init() {
      try {
        const [config, dashboard] = await Promise.all([
          api.getConfig(),
          api.getDashboard(),
        ]);
        setConfig(config);
        setDashboard(dashboard);
      } catch (e) {
        console.error("Failed to load config:", e);
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
    <AppShell onSettingsClick={() => console.log("TODO: settings dialog")}>
      <Sidebar />
      <ViewRenderer />
    </AppShell>
  );
}

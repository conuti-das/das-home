import { useEffect, useState, useCallback } from "react";
import { AppShell } from "@/components/layout/AppShell";
import { BottomToolbar } from "@/components/layout/BottomToolbar";
import { ViewRenderer } from "@/components/layout/ViewRenderer";
import { ConnectionStatus } from "@/components/layout/ConnectionStatus";
import { SetupWizard } from "@/components/wizard/SetupWizard";
import { WidgetWizard } from "@/components/wizard/WidgetWizard";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { useHomeAssistant } from "@/hooks/useHomeAssistant";
import { useKeyboardShortcuts } from "@/hooks/useKeyboard";
import { useThemeSync } from "@/hooks/useTheme";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useConfigStore } from "@/stores/configStore";
import { api } from "@/services/api";
import { getPopupComponent } from "@/components/popups";
import "@/components/popups";

interface ActivePopup {
  id: string;
  props?: Record<string, unknown>;
}

export default function App() {
  const [loading, setLoading] = useState(true);
  const [showSetup, setShowSetup] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showWidgetWizard, setShowWidgetWizard] = useState(false);
  const [activePopup, setActivePopup] = useState<ActivePopup | null>(null);
  const setDashboard = useDashboardStore((s) => s.setDashboard);
  const { editMode, setEditMode } = useDashboardStore();
  const setConfig = useConfigStore((s) => s.setConfig);
  const { callService } = useHomeAssistant();
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

  const openPopup = useCallback((popupId: string, props?: Record<string, unknown>) => {
    setActivePopup({ id: popupId, props });
  }, []);

  const closePopup = useCallback(() => {
    setActivePopup(null);
  }, []);

  if (loading) {
    return <div style={{ padding: "2rem", color: "var(--dh-gray100)" }}>Loading...</div>;
  }

  const PopupComponent = activePopup ? getPopupComponent(activePopup.id) : undefined;

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
      <WidgetWizard
        open={showWidgetWizard}
        onClose={() => setShowWidgetWizard(false)}
      />
      {PopupComponent && (
        <PopupComponent
          onClose={closePopup}
          callService={callService}
          onOpenPopup={openPopup}
          props={activePopup?.props}
        />
      )}
      <AppShell>
        <ConnectionStatus />
        <div style={{ flex: 1, overflow: "auto", paddingBottom: 80 }}>
          <ViewRenderer onOpenPopup={openPopup} />
        </div>
        {editMode && (
          <button
            className="entity-wizard__fab"
            onClick={() => setShowWidgetWizard(true)}
            title="Karte hinzufuegen"
          >
            +
          </button>
        )}
        <BottomToolbar
          onSettingsClick={() => setShowSettings(true)}
          onEditClick={() => setEditMode(!editMode)}
          onAddCardClick={() => setShowWidgetWizard(true)}
        />
      </AppShell>
    </>
  );
}

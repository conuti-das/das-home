import { ShellBar, ShellBarItem } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/edit.js";
import "@ui5/webcomponents-icons/dist/settings.js";
import { useDashboardStore } from "@/stores/dashboardStore";

interface AppShellProps {
  onSettingsClick: () => void;
  children: React.ReactNode;
}

export function AppShell({ onSettingsClick, children }: AppShellProps) {
  const { editMode, setEditMode } = useDashboardStore();

  return (
    <div style={{ height: "100vh", display: "flex", flexDirection: "column" }}>
      <ShellBar
        primaryTitle="das-home"
      >
        <ShellBarItem
          icon="edit"
          text={editMode ? "Done" : "Edit"}
          onClick={() => setEditMode(!editMode)}
        />
        <ShellBarItem
          icon="settings"
          text="Settings"
          onClick={onSettingsClick}
        />
      </ShellBar>
      <div style={{ flex: 1, display: "flex", overflow: "hidden" }}>
        {children}
      </div>
    </div>
  );
}

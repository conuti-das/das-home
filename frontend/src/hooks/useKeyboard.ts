import { useEffect } from "react";
import { useHistoryStore } from "@/stores/historyStore";
import { useDashboardStore } from "@/stores/dashboardStore";

export function useKeyboardShortcuts() {
  const undo = useHistoryStore((s) => s.undo);
  const redo = useHistoryStore((s) => s.redo);
  const setDashboard = useDashboardStore((s) => s.setDashboard);
  const editMode = useDashboardStore((s) => s.editMode);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Only active in edit mode
      if (!editMode) return;

      const isCtrlOrCmd = e.ctrlKey || e.metaKey;

      // Ctrl+Z = Undo
      if (isCtrlOrCmd && e.key === "z" && !e.shiftKey) {
        e.preventDefault();
        const state = undo();
        if (state) setDashboard(state);
      }

      // Ctrl+Shift+Z = Redo
      if (isCtrlOrCmd && e.key === "z" && e.shiftKey) {
        e.preventDefault();
        const state = redo();
        if (state) setDashboard(state);
      }
    };

    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editMode, undo, redo, setDashboard]);
}

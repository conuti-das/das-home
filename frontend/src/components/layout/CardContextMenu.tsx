import { useState, useEffect, useCallback } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { api } from "@/services/api";

interface CardContextMenuProps {
  cardId: string;
  sectionId: string;
  position: { x: number; y: number };
  onClose: () => void;
}

export function CardContextMenu({ cardId, sectionId, position, onClose }: CardContextMenuProps) {
  const removeCard = useDashboardStore((s) => s.removeCard);

  useEffect(() => {
    const handleClick = () => onClose();
    document.addEventListener("click", handleClick);
    return () => document.removeEventListener("click", handleClick);
  }, [onClose]);

  const handleDelete = useCallback(() => {
    removeCard(sectionId, cardId);
    const current = useDashboardStore.getState().dashboard;
    if (current) {
      api.putDashboard(current).catch(console.error);
    }
    onClose();
  }, [cardId, sectionId, removeCard, onClose]);

  return (
    <div
      style={{
        position: "fixed",
        top: position.y,
        left: position.x,
        zIndex: 500,
        background: "var(--dh-gray200)",
        borderRadius: "var(--dh-card-radius)",
        border: "var(--dh-surface-border)",
        boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        padding: 4,
        minWidth: 160,
      }}
      onClick={(e) => e.stopPropagation()}
    >
      <button
        onClick={handleDelete}
        style={{
          display: "flex", alignItems: "center", gap: 10, width: "100%",
          padding: "10px 14px", background: "none", border: "none",
          color: "var(--dh-red)", cursor: "pointer", fontSize: 13,
          borderRadius: "var(--dh-card-radius-sm)",
        }}
        onMouseEnter={(e) => { (e.target as HTMLElement).style.background = "rgba(235,87,87,0.1)"; }}
        onMouseLeave={(e) => { (e.target as HTMLElement).style.background = "none"; }}
      >
        <Icon name="delete" style={{ width: 16, height: 16 }} />
        Löschen
      </button>
    </div>
  );
}

// Hook to use context menu in edit mode
export function useCardContextMenu() {
  const [menu, setMenu] = useState<{ cardId: string; sectionId: string; x: number; y: number } | null>(null);

  const openMenu = useCallback(
    (e: React.MouseEvent, cardId: string, sectionId: string) => {
      e.preventDefault();
      e.stopPropagation();
      setMenu({ cardId, sectionId, x: e.clientX, y: e.clientY });
    },
    []
  );

  const closeMenu = useCallback(() => setMenu(null), []);

  return { menu, openMenu, closeMenu };
}

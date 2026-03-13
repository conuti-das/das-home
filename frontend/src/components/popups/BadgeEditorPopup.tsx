import { useState, useCallback } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { PopupModal } from "@/components/layout/PopupModal";
import { useDashboardStore } from "@/stores/dashboardStore";
import type { PopupProps } from "./PopupRegistry";
import type { BadgeConfig } from "@/types";
import "./BadgeEditorPopup.css";

const BADGE_META: Record<string, { label: string; icon: string; iconColor: string; hasCount?: boolean; countMin?: number; countMax?: number; countLabel?: string }> = {
  clock: { label: "Uhrzeit", icon: "history", iconColor: "var(--dh-gray100)" },
  lights: { label: "Lichter", icon: "lightbulb", iconColor: "var(--dh-yellow)" },
  trash: { label: "Muell / Restmuell", icon: "delete", iconColor: "var(--dh-green)" },
  weather_hourly: { label: "Wetter stuendlich", icon: "temperature", iconColor: "var(--dh-blue)", hasCount: true, countMin: 1, countMax: 6, countLabel: "Stunden" },
  weather_daily: { label: "Wetter taeglich", icon: "calendar", iconColor: "var(--dh-blue)", hasCount: true, countMin: 1, countMax: 5, countLabel: "Tage" },
  media: { label: "Media Player", icon: "media-play", iconColor: "var(--dh-blue)" },
  vacuum: { label: "Saugroboter", icon: "washing-machine", iconColor: "var(--dh-green)" },
  washing: { label: "Waschmaschine", icon: "washing-machine", iconColor: "var(--dh-blue)" },
  dryer: { label: "Trockner", icon: "temperature", iconColor: "var(--dh-orange)" },
};

const ALL_BADGE_TYPES = ["clock", "lights", "trash", "weather_hourly", "weather_daily", "media", "vacuum", "washing", "dryer"];

const DEFAULT_BADGES: BadgeConfig[] = ALL_BADGE_TYPES.map((type) => ({
  type,
  enabled: true,
  ...(type === "weather_hourly" || type === "weather_daily" ? { count: 3 } : {}),
}));

export function BadgeEditorPopup({ onClose }: PopupProps) {
  const dashboard = useDashboardStore((s) => s.dashboard);
  const setDashboard = useDashboardStore((s) => s.setDashboard);

  // Get current badge config from overview view header
  const overviewView = dashboard?.views.find((v) => v.id === "overview");
  const currentBadges = overviewView?.header?.badges;

  // Initialize local state from config, ensuring all badge types exist
  const [badges, setBadges] = useState<BadgeConfig[]>(() => {
    if (!currentBadges || currentBadges.length === 0 || typeof currentBadges[0] === "string") {
      return DEFAULT_BADGES;
    }
    // Ensure all types are present
    const existing = currentBadges as BadgeConfig[];
    const existingTypes = new Set(existing.map((b) => b.type));
    const merged = [...existing];
    for (const type of ALL_BADGE_TYPES) {
      if (!existingTypes.has(type)) {
        merged.push({ type, enabled: false, ...(type === "weather_hourly" || type === "weather_daily" ? { count: 3 } : {}) });
      }
    }
    return merged;
  });

  const [dragIndex, setDragIndex] = useState<number | null>(null);

  const toggleBadge = useCallback((index: number) => {
    setBadges((prev) => prev.map((b, i) => i === index ? { ...b, enabled: !b.enabled } : b));
  }, []);

  const updateCount = useCallback((index: number, delta: number) => {
    setBadges((prev) => prev.map((b, i) => {
      if (i !== index || b.count === undefined) return b;
      const meta = BADGE_META[b.type];
      const min = meta?.countMin ?? 1;
      const max = meta?.countMax ?? 6;
      const next = Math.min(max, Math.max(min, b.count + delta));
      return { ...b, count: next };
    }));
  }, []);

  const handleDragStart = useCallback((index: number) => {
    setDragIndex(index);
  }, []);

  const handleDragOver = useCallback((e: React.DragEvent, index: number) => {
    e.preventDefault();
    if (dragIndex === null || dragIndex === index) return;
    setBadges((prev) => {
      const next = [...prev];
      const [moved] = next.splice(dragIndex, 1);
      next.splice(index, 0, moved);
      return next;
    });
    setDragIndex(index);
  }, [dragIndex]);

  const handleDragEnd = useCallback(() => {
    setDragIndex(null);
  }, []);

  const handleSave = useCallback(() => {
    if (!dashboard) return;
    const newDashboard = structuredClone(dashboard);
    const view = newDashboard.views.find((v) => v.id === "overview");
    if (view) {
      view.header = { ...view.header, badges: badges as any };
    }
    setDashboard(newDashboard);
    onClose();
  }, [dashboard, badges, setDashboard, onClose]);

  return (
    <PopupModal open title="Badges konfigurieren" icon="header" onClose={onClose}>
      <div className="badge-editor__list">
        {badges.map((badge, index) => {
          const meta = BADGE_META[badge.type];
          if (!meta) return null;
          return (
            <div
              key={badge.type}
              className={`badge-editor__item ${dragIndex === index ? "badge-editor__item--dragging" : ""}`}
              draggable
              onDragStart={() => handleDragStart(index)}
              onDragOver={(e) => handleDragOver(e, index)}
              onDragEnd={handleDragEnd}
            >
              <div className="badge-editor__drag-handle">
                <Icon name="overflow" style={{ width: 16, height: 16, opacity: 0.4 }} />
              </div>
              <div className="badge-editor__icon">
                <Icon name={meta.icon} style={{ width: 18, height: 18, color: meta.iconColor }} />
              </div>
              <div className="badge-editor__label">{meta.label}</div>

              {meta.hasCount && badge.enabled && (
                <div className="badge-editor__count">
                  <button className="badge-editor__count-btn" onClick={() => updateCount(index, -1)}>−</button>
                  <span className="badge-editor__count-value">{badge.count ?? 3}</span>
                  <button className="badge-editor__count-btn" onClick={() => updateCount(index, 1)}>+</button>
                </div>
              )}

              <button
                className={`badge-editor__toggle ${badge.enabled ? "badge-editor__toggle--on" : "badge-editor__toggle--off"}`}
                onClick={() => toggleBadge(index)}
              >
                <div className="badge-editor__toggle-knob" />
              </button>
            </div>
          );
        })}
      </div>

      <button className="badge-editor__save" onClick={handleSave}>
        Fertig
      </button>
    </PopupModal>
  );
}

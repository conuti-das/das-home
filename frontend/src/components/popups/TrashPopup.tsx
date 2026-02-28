import { useMemo } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import { PopupModal } from "@/components/layout/PopupModal";
import type { PopupProps } from "./PopupRegistry";

const WASTE_ICONS: Record<string, string> = {
  restmuell: "delete",
  restmüll: "delete",
  residual: "delete",
  gelber: "product",
  plastic: "product",
  packaging: "product",
  papier: "documents",
  paper: "documents",
  bio: "nutrition-activity",
  organic: "nutrition-activity",
  glas: "lab",
  glass: "lab",
};

const WASTE_COLORS: Record<string, string> = {
  restmuell: "var(--dh-gray100)",
  restmüll: "var(--dh-gray100)",
  residual: "var(--dh-gray100)",
  gelber: "var(--dh-yellow)",
  plastic: "var(--dh-yellow)",
  packaging: "var(--dh-yellow)",
  papier: "var(--dh-blue)",
  paper: "var(--dh-blue)",
  bio: "var(--dh-green)",
  organic: "var(--dh-green)",
  glas: "var(--dh-purple)",
  glass: "var(--dh-purple)",
};

function getWasteIcon(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, icon] of Object.entries(WASTE_ICONS)) {
    if (lower.includes(key)) return icon;
  }
  return "delete";
}

function getWasteColor(name: string): string {
  const lower = name.toLowerCase();
  for (const [key, color] of Object.entries(WASTE_COLORS)) {
    if (lower.includes(key)) return color;
  }
  return "var(--dh-gray100)";
}

function getUrgencyColor(days: number): string {
  if (days <= 1) return "var(--dh-red)";
  if (days <= 5) return "var(--dh-yellow)";
  return "var(--dh-green)";
}

export function TrashPopup({ onClose }: PopupProps) {
  const sensors = useEntitiesByDomain("sensor");

  const trashSensors = useMemo(() => {
    return sensors
      .filter((e) => {
        const id = e.entity_id.toLowerCase();
        return id.includes("waste") || id.includes("trash") || id.includes("muell") || id.includes("müll") || id.includes("abfall") || id.includes("tonne");
      })
      .map((e) => {
        const name = (e.attributes?.friendly_name as string) || e.entity_id;
        const days = parseInt(e.state);
        const date = e.attributes?.next_date as string | undefined;
        return { entityId: e.entity_id, name, days: isNaN(days) ? 999 : days, date };
      })
      .sort((a, b) => a.days - b.days);
  }, [sensors]);

  return (
    <PopupModal open title="Müllabfuhr" icon="delete" onClose={onClose}>
      <div style={{ display: "flex", flexDirection: "column", gap: 8, padding: "4px 0" }}>
        {trashSensors.length === 0 && (
          <div style={{ textAlign: "center", opacity: 0.5, padding: 20, color: "var(--dh-gray100)" }}>
            Keine Müll-Sensoren gefunden
          </div>
        )}
        {trashSensors.map((sensor) => {
          const urgency = getUrgencyColor(sensor.days);
          const wasteColor = getWasteColor(sensor.name);
          const wasteIcon = getWasteIcon(sensor.name);
          const label = sensor.days === 0 ? "Heute" : sensor.days === 1 ? "Morgen" : sensor.days === 999 ? "--" : `In ${sensor.days} Tagen`;

          return (
            <div
              key={sensor.entityId}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 14,
                padding: "14px 16px",
                background: "var(--dh-gray300)",
                borderRadius: "var(--dh-card-radius)",
                borderLeft: `3px solid ${urgency}`,
              }}
            >
              <div style={{
                width: 40, height: 40, borderRadius: "var(--dh-card-radius-sm)",
                background: `${wasteColor}20`,
                display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0,
              }}>
                <Icon name={wasteIcon} style={{ width: 20, height: 20, color: wasteColor }} />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 14, fontWeight: 600, color: "var(--dh-gray100)" }}>{sensor.name}</div>
                <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginTop: 2 }}>
                  {label}
                  {sensor.date && ` · ${sensor.date}`}
                </div>
              </div>
              <div style={{ fontSize: 24, fontWeight: 800, color: urgency, flexShrink: 0 }}>
                {sensor.days === 999 ? "--" : sensor.days}
              </div>
            </div>
          );
        })}
      </div>
    </PopupModal>
  );
}

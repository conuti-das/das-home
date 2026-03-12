import { useEffect, useMemo, useState } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { getRegisteredTypes } from "@/components/cards/CardRegistry";
import { getDomainStyle } from "@/utils/domainColors";
import { getBestWidget, getRecommendedWidgets } from "@/utils/widgetRecommendation";
import type { CardMetadata } from "@/components/cards/CardRegistry";
import type { EntityState } from "@/types";
import type { EntityWidgetPair } from "./WidgetWizard";

/** Domain priority for sorting: lower = shown first */
const DOMAIN_PRIORITY: Record<string, number> = {
  media_player: 1, light: 1, climate: 1, cover: 1, camera: 1, vacuum: 1, fan: 1, lock: 1,
  scene: 2, script: 2, automation: 2, button: 2,
  weather: 3, person: 3, calendar: 3, device_tracker: 3, update: 3,
  switch: 4, input_boolean: 4,
  sensor: 5, binary_sensor: 5,
  number: 6, input_number: 6, select: 6, input_select: 6, timer: 6,
};

interface EntityWidgetPairingProps {
  selectedWidget: CardMetadata | null;
  selectedEntities: EntityState[];
  pairings: EntityWidgetPair[];
  onPairingsChange: (pairings: EntityWidgetPair[]) => void;
  onNext: () => void;
}

export function EntityWidgetPairing({
  selectedWidget,
  selectedEntities,
  pairings,
  onPairingsChange,
  onNext,
}: EntityWidgetPairingProps) {
  const registeredTypes = useMemo(() => getRegisteredTypes(), []);
  const [search, setSearch] = useState("");

  // Initialize pairings from selected entities if empty
  useEffect(() => {
    if (pairings.length > 0 || selectedEntities.length === 0) return;
    const initial: EntityWidgetPair[] = selectedEntities
      .map((entity) => {
        const domain = entity.entity_id.split(".")[0];
        const widgetType = selectedWidget?.type ?? getBestWidget(domain);
        return {
          entity,
          widgetType,
          size: selectedWidget?.defaultSize ?? "1x1",
          customLabel: (entity.attributes?.friendly_name as string) || "",
          customIcon: "",
          customColor: "",
        };
      })
      .sort((a, b) => {
        const da = a.entity.entity_id.split(".")[0];
        const db = b.entity.entity_id.split(".")[0];
        const pa = DOMAIN_PRIORITY[da] ?? 7;
        const pb = DOMAIN_PRIORITY[db] ?? 7;
        if (pa !== pb) return pa - pb;
        return (a.customLabel || a.entity.entity_id).localeCompare(b.customLabel || b.entity.entity_id);
      });
    onPairingsChange(initial);
  }, [selectedEntities, selectedWidget, pairings.length, onPairingsChange]);

  const handleWidgetChange = (index: number, widgetType: string) => {
    const updated = [...pairings];
    updated[index] = { ...updated[index], widgetType };
    onPairingsChange(updated);
  };

  const handleRemove = (index: number) => {
    onPairingsChange(pairings.filter((_, i) => i !== index));
  };

  const handleSetAll = (widgetType: string) => {
    onPairingsChange(pairings.map((p) => ({ ...p, widgetType })));
  };

  if (pairings.length === 0) return null;

  // If coming from widget gallery, show recommended widget types
  const allWidgetForBatch = selectedWidget
    ? selectedWidget.type
    : pairings[0]?.widgetType;

  // Filter pairings by search
  const searchLower = search.toLowerCase();
  const filteredPairings = searchLower
    ? pairings
        .map((pair, index) => ({ pair, index }))
        .filter(({ pair }) => {
          const name = ((pair.entity.attributes?.friendly_name as string) || "").toLowerCase();
          return (
            pair.entity.entity_id.toLowerCase().includes(searchLower) ||
            name.includes(searchLower)
          );
        })
    : pairings.map((pair, index) => ({ pair, index }));

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 12 }}>
        <span style={{ fontSize: 14, opacity: 0.6, color: "var(--dh-gray100)" }}>
          Ordne jeder Entity ein Widget zu
        </span>
        <span style={{ fontSize: 12, opacity: 0.4, color: "var(--dh-gray100)" }}>
          {pairings.length} {pairings.length === 1 ? "Entity" : "Entities"}
        </span>
      </div>

      {/* Search filter */}
      {pairings.length > 3 && (
        <input
          className="widget-wizard__input"
          placeholder="Entity suchen..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={{ marginBottom: 12 }}
        />
      )}

      {/* Batch apply */}
      {pairings.length > 1 && (
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12, flexWrap: "wrap" }}>
          <span style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)" }}>Alle auf:</span>
          {registeredTypes
            .filter((t) => !["hacs", "iframe", "markdown", "group", "radar", "trash", "area", "area_small"].includes(t))
            .slice(0, 8)
            .map((type) => (
              <button
                key={type}
                className={`widget-wizard__chip ${allWidgetForBatch === type ? "widget-wizard__chip--active" : ""}`}
                onClick={() => handleSetAll(type)}
              >
                {type}
              </button>
            ))}
        </div>
      )}

      {/* Pairing list */}
      <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
        {filteredPairings.map(({ pair, index }) => {
          const domain = pair.entity.entity_id.split(".")[0];
          const style = getDomainStyle(domain);
          const recommended = getRecommendedWidgets(domain).map((m) => m.type);

          return (
            <div key={pair.entity.entity_id} className="ewp__row">
              <div className="ewp__entity-info">
                <div className="ewp__icon-dot" style={{ background: style.iconBg }}>
                  <div style={{ width: 8, height: 8, borderRadius: "50%", background: style.color }} />
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div className="ewp__entity-name">
                    {pair.customLabel || pair.entity.entity_id}
                  </div>
                  <div className="ewp__entity-state">
                    {pair.entity.state}
                  </div>
                </div>
              </div>
              <select
                className="ewp__select"
                value={pair.widgetType}
                onChange={(e) => handleWidgetChange(index, e.target.value)}
              >
                {/* Recommended first */}
                {recommended.length > 0 && (
                  <optgroup label="Empfohlen">
                    {recommended.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </optgroup>
                )}
                <optgroup label="Alle Widgets">
                  {registeredTypes
                    .filter((t) => !recommended.includes(t))
                    .map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                </optgroup>
              </select>
              <button
                className="ewp__remove-btn"
                onClick={() => handleRemove(index)}
                title="Entfernen"
              >
                <Icon name="decline" style={{ width: 12, height: 12 }} />
              </button>
            </div>
          );
        })}
      </div>

      {/* Next button */}
      <div style={{ marginTop: 16 }}>
        <button
          className="widget-wizard__btn widget-wizard__btn--primary"
          style={{ width: "100%" }}
          disabled={pairings.length === 0}
          onClick={onNext}
        >
          {pairings.length === 0 ? "Keine Entities" : "Weiter"}
        </button>
      </div>

      <style>{`
        .ewp__row {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 12px;
          border-radius: var(--dh-card-radius);
          background: var(--dh-gray300);
          border: var(--dh-surface-border);
        }
        .ewp__entity-info {
          display: flex;
          align-items: center;
          gap: 10px;
          flex: 1;
          min-width: 0;
        }
        .ewp__icon-dot {
          width: 32px;
          height: 32px;
          border-radius: var(--dh-card-radius-sm);
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
        }
        .ewp__entity-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--dh-gray100);
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
        .ewp__entity-state {
          font-size: 11px;
          color: var(--dh-gray100);
          opacity: 0.4;
        }
        .ewp__select {
          padding: 6px 8px;
          border-radius: var(--dh-card-radius-sm);
          border: var(--dh-surface-border);
          background: var(--dh-gray400);
          color: var(--dh-gray100);
          font-size: 12px;
          outline: none;
          cursor: pointer;
          min-width: 100px;
        }
        .ewp__remove-btn {
          width: 24px;
          height: 24px;
          border-radius: 50%;
          border: none;
          background: transparent;
          color: var(--dh-gray100);
          opacity: 0.3;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          flex-shrink: 0;
          transition: all 0.15s ease;
        }
        .ewp__remove-btn:hover {
          opacity: 1;
          background: rgba(235, 87, 87, 0.2);
          color: #eb5757;
        }
      `}</style>
    </div>
  );
}

import { useState, useMemo, useCallback } from "react";
import { PopupModal } from "@/components/layout/PopupModal";
import { getRegisteredTypes, getCardMetadata, getCardComponent } from "@/components/cards/CardRegistry";
import { useDashboardStore } from "@/stores/dashboardStore";
import { useEntityStore } from "@/stores/entityStore";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import { api } from "@/services/api";
import { parseSizeString } from "@/utils/gridLayout";
import type { CardItem } from "@/types";

interface CardEditPopupProps {
  open: boolean;
  onClose: () => void;
  sectionId: string;
  card: CardItem;
  sectionLayout?: "grid" | "strip";
}

const SIZES = ["1x1", "2x1", "1x2", "2x2"];

const PRESET_COLORS = [
  { label: "Blau", value: "var(--dh-blue)", hex: "#56CCF2" },
  { label: "Gelb", value: "var(--dh-yellow)", hex: "#F2C94C" },
  { label: "Gruen", value: "var(--dh-green)", hex: "#6FCF97" },
  { label: "Rot", value: "var(--dh-red)", hex: "#EB5757" },
  { label: "Orange", value: "var(--dh-orange)", hex: "#F2994A" },
  { label: "Lila", value: "var(--dh-purple)", hex: "#BB6BD9" },
  { label: "Pink", value: "var(--dh-pink)", hex: "#F2A0B7" },
  { label: "Standard", value: "", hex: "transparent" },
];

export function CardEditPopup({ open, onClose, sectionId, card, sectionLayout }: CardEditPopupProps) {
  const [tab, setTab] = useState<"type" | "size" | "weight" | "styling" | "datasource" | "entity" | "section">("type");
  const [cardType, setCardType] = useState(card.type);
  const [cardSize, setCardSize] = useState(card.size);
  const [customLabel, setCustomLabel] = useState(card.customLabel ?? "");
  const [customIcon, setCustomIcon] = useState(card.customIcon ?? "");
  const [customColor, setCustomColor] = useState(card.customColor ?? "");
  const [flexWeight, setFlexWeight] = useState(card.flexWeight ?? 1);
  const [cardConfig, setCardConfig] = useState<Record<string, unknown>>(card.config ?? {});
  const [targetSectionId, setTargetSectionId] = useState(sectionId);

  const updateCardConfig = useDashboardStore((s) => s.updateCardConfig);
  const moveCardToSection = useDashboardStore((s) => s.moveCardToSection);
  const sections = useDashboardStore((s) => {
    const view = s.dashboard?.views.find((v) => v.id === s.activeViewId);
    return view?.sections || [];
  });
  const registeredTypes = useMemo(() => getRegisteredTypes(), []);

  // For weather card: get all sensors to allow custom entity selection
  const allSensors = useEntitiesByDomain("sensor");
  const tempSensors = useMemo(() =>
    allSensors.filter((e) =>
      e.attributes?.device_class === "temperature" ||
      e.attributes?.unit_of_measurement === "°C" ||
      e.attributes?.unit_of_measurement === "°F"
    ), [allSensors]);
  const humiditySensors = useMemo(() =>
    allSensors.filter((e) =>
      e.attributes?.device_class === "humidity" ||
      e.attributes?.unit_of_measurement === "%"
    ), [allSensors]);
  const pressureSensors = useMemo(() =>
    allSensors.filter((e) =>
      e.attributes?.device_class === "pressure" ||
      e.attributes?.device_class === "atmospheric_pressure" ||
      e.attributes?.unit_of_measurement === "hPa" ||
      e.attributes?.unit_of_measurement === "mbar"
    ), [allSensors]);
  const windSensors = useMemo(() =>
    allSensors.filter((e) =>
      e.attributes?.device_class === "wind_speed" ||
      e.entity_id.includes("wind")
    ), [allSensors]);

  const isWeatherCard = cardType === "weather";
  const isAreaV2Card = cardType === "area_v2";
  const allLights = useEntitiesByDomain("light");
  const allMediaPlayers = useEntitiesByDomain("media_player");
  const allCameras = useEntitiesByDomain("camera");
  const allVacuums = useEntitiesByDomain("vacuum");
  const allSwitchesForSpecial = useEntitiesByDomain("switch");
  const specialSensors = useMemo(() =>
    allSensors.filter((e) =>
      e.entity_id.includes("wasch") || e.entity_id.includes("washing") ||
      e.entity_id.includes("trockner") || e.entity_id.includes("dryer") ||
      e.entity_id.includes("dishwasher") || e.entity_id.includes("spuel")
    ), [allSensors]);
  const areasMap = useEntityStore((s) => s.areas);
  const areas = useMemo(() => Array.from(areasMap.values()), [areasMap]);

  const handleSave = useCallback(() => {
    const { colSpan, rowSpan } = parseSizeString(cardSize);
    const updates: Partial<CardItem> = {
      type: cardType,
      size: cardSize,
      colSpan,
      rowSpan,
      customLabel: customLabel || undefined,
      customIcon: customIcon || undefined,
      customColor: customColor || undefined,
      config: cardConfig,
    };
    if (sectionLayout === "strip") {
      updates.flexWeight = flexWeight;
    }
    updateCardConfig(sectionId, card.id, updates);
    // Move to different section if changed
    if (targetSectionId !== sectionId) {
      moveCardToSection(sectionId, card.id, targetSectionId);
    }
    // Persist
    const current = useDashboardStore.getState().dashboard;
    if (current) {
      api.putDashboard(current).catch(console.error);
    }
    onClose();
  }, [sectionId, card.id, cardType, cardSize, customLabel, customIcon, customColor, flexWeight, cardConfig, sectionLayout, targetSectionId, updateCardConfig, moveCardToSection, onClose]);

  const isStrip = sectionLayout === "strip";

  const tabs = [
    { key: "type" as const, label: "Widget" },
    ...(isStrip
      ? [{ key: "weight" as const, label: "Gewichtung" }]
      : [{ key: "size" as const, label: "Groesse" }]),
    { key: "section" as const, label: "Sektion" },
    { key: "styling" as const, label: "Styling" },
    ...((isWeatherCard || isAreaV2Card) ? [{ key: "datasource" as const, label: "Datenquellen" }] : []),
    { key: "entity" as const, label: "Entity" },
  ];

  return (
    <PopupModal open={open} title="Karte bearbeiten" icon="edit" onClose={onClose}>
      {/* Tab bar */}
      <div className="cep__tabs">
        {tabs.map((t) => (
          <button
            key={t.key}
            className={`cep__tab ${tab === t.key ? "cep__tab--active" : ""}`}
            onClick={() => setTab(t.key)}
          >
            {t.label}
          </button>
        ))}
      </div>

      <div style={{ padding: "12px 0" }}>
        {/* Type tab */}
        {tab === "type" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4, maxHeight: 300, overflowY: "auto" }}>
            {registeredTypes
              .filter((t) => t !== "hacs")
              .map((type) => {
                const meta = getCardMetadata(type);
                return (
                  <button
                    key={type}
                    className={`cep__type-row ${type === cardType ? "cep__type-row--active" : ""}`}
                    onClick={() => setCardType(type)}
                  >
                    <span className="cep__type-name">{meta?.displayName ?? type}</span>
                    {meta?.description && (
                      <span className="cep__type-desc">{meta.description}</span>
                    )}
                  </button>
                );
              })}
          </div>
        )}

        {/* Size tab */}
        {tab === "size" && (
          <div>
            <div style={{ display: "flex", gap: 10, flexWrap: "wrap", marginBottom: 16 }}>
              {SIZES.map((size) => (
                <button
                  key={size}
                  className={`sz__option ${size === cardSize ? "sz__option--active" : ""}`}
                  onClick={() => setCardSize(size)}
                  style={{ padding: "16px 24px" }}
                >
                  <span className="sz__label">{size}</span>
                </button>
              ))}
            </div>
            {/* Size preview */}
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginBottom: 8 }}>Vorschau</div>
            <SizePreview card={card} size={cardSize} cardType={cardType} />
          </div>
        )}

        {/* Weight tab (strip only) */}
        {tab === "weight" && (
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            {[1, 2, 3].map((w) => (
              <button
                key={w}
                className={`sz__option ${w === flexWeight ? "sz__option--active" : ""}`}
                onClick={() => setFlexWeight(w)}
                style={{ padding: "16px 24px" }}
              >
                <span className="sz__label">{w}x</span>
              </button>
            ))}
          </div>
        )}

        {/* Section tab */}
        {tab === "section" && (
          <div style={{ display: "flex", flexDirection: "column", gap: 4 }}>
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginBottom: 4 }}>
              Karte in eine andere Sektion verschieben
            </div>
            {sections.map((s) => (
              <button
                key={s.id}
                className={`cep__type-row ${targetSectionId === s.id ? "cep__type-row--active" : ""}`}
                onClick={() => setTargetSectionId(s.id)}
              >
                <span className="cep__type-name">
                  {s.title || s.id}
                  {s.id === sectionId && " (aktuell)"}
                </span>
                <span className="cep__type-desc">
                  {s.layout === "strip" ? "Strip" : "Grid"} · {s.items.length} Karten
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Styling tab */}
        {tab === "styling" && (
          <div>
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginBottom: 6 }}>Label</div>
            <input
              className="widget-wizard__input"
              value={customLabel}
              onChange={(e) => setCustomLabel(e.target.value)}
              placeholder="Standard-Name verwenden"
            />
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginTop: 12, marginBottom: 6 }}>Icon</div>
            <input
              className="widget-wizard__input"
              value={customIcon}
              onChange={(e) => setCustomIcon(e.target.value)}
              placeholder="z.B. lightbulb, temperature"
            />
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginTop: 12, marginBottom: 6 }}>Farbe</div>
            <div style={{ display: "flex", gap: 6, flexWrap: "wrap" }}>
              {PRESET_COLORS.map((c) => (
                <button
                  key={c.value}
                  className={`sp__color-btn ${customColor === c.value ? "sp__color-btn--active" : ""}`}
                  style={{ background: c.hex, border: c.hex === "transparent" ? "2px dashed rgba(250,251,252,0.2)" : undefined }}
                  title={c.label}
                  onClick={() => setCustomColor(c.value)}
                />
              ))}
            </div>
          </div>
        )}

        {/* Datasource tab (weather only) */}
        {tab === "datasource" && isWeatherCard && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)" }}>
              Waehle fuer jedes Feld eine eigene Entity. Leer = Standard (weather Entity).
            </div>

            {/* Temperature */}
            <div>
              <div className="cep__ds-label">Temperatur</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.tempEntity as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, tempEntity: e.target.value || undefined })}
              >
                <option value="">Standard (weather.entity)</option>
                {tempSensors.map((s) => (
                  <option key={s.entity_id} value={s.entity_id}>
                    {(s.attributes?.friendly_name as string) || s.entity_id} ({s.state}°)
                  </option>
                ))}
              </select>
            </div>

            {/* Humidity */}
            <div>
              <div className="cep__ds-label">Luftfeuchtigkeit</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.humidityEntity as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, humidityEntity: e.target.value || undefined })}
              >
                <option value="">Standard (weather.entity)</option>
                {humiditySensors.map((s) => (
                  <option key={s.entity_id} value={s.entity_id}>
                    {(s.attributes?.friendly_name as string) || s.entity_id} ({s.state}%)
                  </option>
                ))}
              </select>
            </div>

            {/* Pressure */}
            <div>
              <div className="cep__ds-label">Luftdruck</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.pressureEntity as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, pressureEntity: e.target.value || undefined })}
              >
                <option value="">Nicht anzeigen</option>
                {pressureSensors.map((s) => (
                  <option key={s.entity_id} value={s.entity_id}>
                    {(s.attributes?.friendly_name as string) || s.entity_id} ({s.state} hPa)
                  </option>
                ))}
              </select>
            </div>

            {/* Wind */}
            <div>
              <div className="cep__ds-label">Windgeschwindigkeit</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.windEntity as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, windEntity: e.target.value || undefined })}
              >
                <option value="">Nicht anzeigen</option>
                {windSensors.map((s) => (
                  <option key={s.entity_id} value={s.entity_id}>
                    {(s.attributes?.friendly_name as string) || s.entity_id} ({s.state})
                  </option>
                ))}
              </select>
            </div>
          </div>
        )}

        {/* Datasource tab (area_v2) */}
        {tab === "datasource" && isAreaV2Card && (
          <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
            {/* Area selection */}
            <div>
              <div className="cep__ds-label">Bereich</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.area_id as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, area_id: e.target.value || undefined })}
              >
                <option value="">Bereich waehlen...</option>
                {areas.map((a) => (
                  <option key={a.area_id} value={a.area_id}>{a.name}</option>
                ))}
              </select>
            </div>

            {/* Temperature entity */}
            <div>
              <div className="cep__ds-label">Temperatur-Sensor</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.temperature_entity as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, temperature_entity: e.target.value || undefined })}
              >
                <option value="">Keiner</option>
                {tempSensors.map((s) => (
                  <option key={s.entity_id} value={s.entity_id}>
                    {(s.attributes?.friendly_name as string) || s.entity_id} ({s.state}°)
                  </option>
                ))}
              </select>
            </div>

            {/* Light entity */}
            <div>
              <div className="cep__ds-label">Licht / Lichtgruppe</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.light_entity as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, light_entity: e.target.value || undefined })}
              >
                <option value="">Keines</option>
                {allLights.map((l) => (
                  <option key={l.entity_id} value={l.entity_id}>
                    {(l.attributes?.friendly_name as string) || l.entity_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Special entity */}
            <div>
              <div className="cep__ds-label">Spezial-Entity (Saugroboter, Waschmaschine, ...)</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.special_entity as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, special_entity: e.target.value || undefined })}
              >
                <option value="">Keines</option>
                {[...allVacuums, ...allSwitchesForSpecial, ...specialSensors].map((s) => (
                  <option key={s.entity_id} value={s.entity_id}>
                    {(s.attributes?.friendly_name as string) || s.entity_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Media player entity */}
            <div>
              <div className="cep__ds-label">Media Player</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.media_player_entity as string) || ""}
                onChange={(e) => setCardConfig({ ...cardConfig, media_player_entity: e.target.value || undefined })}
              >
                <option value="">Keiner</option>
                {allMediaPlayers.map((mp) => (
                  <option key={mp.entity_id} value={mp.entity_id}>
                    {(mp.attributes?.friendly_name as string) || mp.entity_id}
                  </option>
                ))}
              </select>
            </div>

            {/* Background source */}
            <div>
              <div className="cep__ds-label">Hintergrund</div>
              <select
                className="cep__ds-select"
                value={(cardConfig.backgroundSource as string) || "area"}
                onChange={(e) => setCardConfig({ ...cardConfig, backgroundSource: e.target.value })}
              >
                <option value="area">Bereichs-Bild (HA)</option>
                <option value="camera">Kamera</option>
                <option value="custom">Eigene URL / Webcam</option>
                <option value="media">Media Player Artwork</option>
              </select>
            </div>

            {/* Camera entity (only for camera) */}
            {(cardConfig.backgroundSource as string) === "camera" && (
              <div>
                <div className="cep__ds-label">Kamera</div>
                <select
                  className="cep__ds-select"
                  value={(cardConfig.camera_entity as string) || ""}
                  onChange={(e) => setCardConfig({ ...cardConfig, camera_entity: e.target.value || undefined })}
                >
                  <option value="">— Kamera waehlen —</option>
                  {allCameras.map((cam) => (
                    <option key={cam.entity_id} value={cam.entity_id}>
                      {(cam.attributes?.friendly_name as string) || cam.entity_id}
                    </option>
                  ))}
                </select>
              </div>
            )}

            {/* Background URL (only for custom) */}
            {(cardConfig.backgroundSource as string) === "custom" && (
              <div>
                <div className="cep__ds-label">Bild-URL</div>
                <input
                  className="widget-wizard__input"
                  value={(cardConfig.backgroundUrl as string) || ""}
                  onChange={(e) => setCardConfig({ ...cardConfig, backgroundUrl: e.target.value || undefined })}
                  placeholder="https://... oder /local/..."
                />
              </div>
            )}
          </div>
        )}

        {/* Entity tab */}
        {tab === "entity" && (
          <div>
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginBottom: 6 }}>Entity ID</div>
            <div style={{ fontSize: 14, color: "var(--dh-gray100)", padding: "8px 0" }}>{card.entity}</div>
            <div style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)", marginTop: 8, marginBottom: 6 }}>Card ID</div>
            <div style={{ fontSize: 12, color: "var(--dh-gray100)", opacity: 0.5, padding: "4px 0", fontFamily: "monospace" }}>{card.id}</div>
          </div>
        )}
      </div>

      {/* Save */}
      <button
        className="widget-wizard__btn widget-wizard__btn--primary"
        style={{ width: "100%", marginTop: 8 }}
        onClick={handleSave}
      >
        Speichern
      </button>

      <style>{`
        .cep__tabs {
          display: flex;
          gap: 2px;
          border-bottom: 1px solid rgba(250, 251, 252, 0.08);
          margin-bottom: 4px;
        }
        .cep__tab {
          flex: 1;
          padding: 8px 4px;
          background: none;
          border: none;
          color: var(--dh-gray100);
          opacity: 0.5;
          font-size: 13px;
          font-weight: 500;
          cursor: pointer;
          border-bottom: 2px solid transparent;
          transition: all 0.15s ease;
        }
        .cep__tab:hover {
          opacity: 0.7;
        }
        .cep__tab--active {
          opacity: 1;
          border-bottom-color: var(--dh-blue);
        }
        .cep__type-row {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 8px 12px;
          border-radius: var(--dh-card-radius-sm);
          border: none;
          background: none;
          cursor: pointer;
          width: 100%;
          text-align: left;
          transition: background 0.1s ease;
        }
        .cep__type-row:hover {
          background: rgba(250, 251, 252, 0.05);
        }
        .cep__type-row--active {
          background: rgba(86, 204, 242, 0.12);
        }
        .cep__type-name {
          font-size: 13px;
          font-weight: 500;
          color: var(--dh-gray100);
        }
        .cep__type-desc {
          font-size: 11px;
          color: var(--dh-gray100);
          opacity: 0.4;
          margin-top: 1px;
        }
        .sz__option {
          display: flex;
          flex-direction: column;
          align-items: center;
          gap: 4px;
          border-radius: var(--dh-card-radius);
          border: 2px solid rgba(250, 251, 252, 0.1);
          background: var(--dh-gray300);
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sz__option:hover {
          border-color: rgba(86, 204, 242, 0.3);
        }
        .sz__option--active {
          border-color: var(--dh-blue);
          background: rgba(86, 204, 242, 0.08);
        }
        .sz__label {
          font-size: 14px;
          font-weight: 600;
          color: var(--dh-gray100);
        }
        .sp__color-btn {
          width: 28px;
          height: 28px;
          border-radius: 50%;
          border: 2px solid transparent;
          cursor: pointer;
          transition: all 0.15s ease;
        }
        .sp__color-btn:hover {
          transform: scale(1.15);
        }
        .sp__color-btn--active {
          border-color: var(--dh-gray100);
          box-shadow: 0 0 0 2px var(--dh-gray400), 0 0 0 4px var(--dh-gray100);
        }
        .cep__ds-label {
          font-size: 12px;
          opacity: 0.5;
          color: var(--dh-gray100);
          margin-bottom: 6px;
          font-weight: 500;
        }
        .cep__ds-select {
          width: 100%;
          padding: 8px 10px;
          border-radius: var(--dh-card-radius-sm);
          border: var(--dh-surface-border);
          background: var(--dh-gray400);
          color: var(--dh-gray100);
          font-size: 13px;
          outline: none;
          cursor: pointer;
        }
      `}</style>
    </PopupModal>
  );
}

function SizePreview({ card, size, cardType }: { card: CardItem; size: string; cardType: string }) {
  const { colSpan, rowSpan } = parseSizeString(size);
  const CardComp = getCardComponent(cardType);

  // Scale factor to fit preview in popup
  const previewWidth = colSpan === 2 ? 280 : 140;
  const previewHeight = rowSpan === 2 ? 200 : 100;

  return (
    <div style={{
      background: "var(--dh-gray400)",
      borderRadius: "var(--dh-card-radius)",
      padding: 12,
      display: "flex",
      justifyContent: "center",
      overflow: "hidden",
    }}>
      <div style={{
        width: previewWidth,
        height: previewHeight,
        transform: "scale(0.85)",
        transformOrigin: "center center",
        pointerEvents: "none",
      }}>
        {CardComp ? (
          <CardComp card={{ ...card, type: cardType, size }} callService={() => {}} />
        ) : (
          <div style={{
            width: "100%",
            height: "100%",
            background: "var(--dh-gray300)",
            borderRadius: "var(--dh-card-radius)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            color: "var(--dh-gray100)",
            opacity: 0.4,
            fontSize: 13,
          }}>
            {size}
          </div>
        )}
      </div>
    </div>
  );
}

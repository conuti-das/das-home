import { useMemo, useState, useEffect } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntityStore } from "@/stores/entityStore";
import { apiUrl } from "@/utils/basePath";
import type { CardComponentProps } from "./CardRegistry";
import "./VehicleCard.css";

function useEntitiesByPrefix(prefix: string) {
  const entities = useEntityStore((s) => s.entities);
  return useMemo(() => {
    const result = new Map<string, { entity_id: string; state: string; attributes: Record<string, unknown> }>();
    const lc = prefix.toLowerCase();
    for (const [id, state] of entities) {
      if (id.toLowerCase().includes(lc)) {
        result.set(id, state);
      }
    }
    return result;
  }, [entities, prefix]);
}

function findEntity(map: Map<string, { state: string; attributes: Record<string, unknown> }>, ...keywords: string[]) {
  for (const k of keywords) {
    for (const [id, state] of map) {
      // Match keyword as a suffix (after _ or .) to avoid partial matches
      // e.g. "battery_level" should NOT match "battery_power_level"
      // Match keyword as exact segment: after domain. prefix or as _keyword at end
      const afterDot = id.split(".").pop() || "";
      if (afterDot === k || afterDot.endsWith(`_${k}`)) {
        return { id, ...state };
      }
    }
  }
  return undefined;
}

function formatNumber(n: number): string {
  return n.toLocaleString("de-DE");
}

function formatParkTime(iso: string | undefined): string {
  if (!iso) return "\u2013";
  try {
    const d = new Date(iso);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffH = Math.floor(diffMs / 3600000);
    if (diffH < 1) return "Gerade";
    if (diffH < 24) return `Vor ${diffH}h`;
    const diffD = Math.floor(diffH / 24);
    if (diffD === 1) return "Gestern";
    return `Vor ${diffD}T`;
  } catch {
    return "\u2013";
  }
}

function useReverseGeocode(lat: number | undefined, lon: number | undefined): string | null {
  const [address, setAddress] = useState<string | null>(null);
  useEffect(() => {
    if (lat === undefined || lon === undefined) return;
    let cancelled = false;
    fetch(apiUrl(`/api/geo/reverse?lat=${lat}&lon=${lon}`))
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        const parts: string[] = [];
        if (data.road) parts.push(data.house_number ? `${data.road} ${data.house_number}` : data.road);
        if (data.city || data.town || data.village) parts.push((data.city || data.town || data.village).toUpperCase());
        setAddress(parts.join("\n") || data.display_name || null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [lat, lon]);
  return address;
}

export function VehicleCard({ card, onCardAction }: CardComponentProps) {
  const vehicleName = (card.config?.vehicleName as string) || card.entity.split(".").pop() || "Auto";
  const vehicleImage = card.config?.vehicleImage as string | undefined;
  const prefix = vehicleName.toLowerCase();

  const related = useEntitiesByPrefix(prefix);

  const battery = findEntity(related, "battery_level", "battery_soc");
  const range = findEntity(related, "electric_range", "cruising_range");
  const odometer = findEntity(related, "odometer", "mileage");
  const parkTime = findEntity(related, "parking_time", "parked");
  const charging = findEntity(related, "charging_state", "charging_status");
  // VW Connect: use lock.* entities (states: "locked"/"unlocked") - more reliable than binary_sensor
  const doorsLock = findEntity(related, "door_locked");
  const trunkLock = findEntity(related, "trunk_locked");
  const externalPower = findEntity(related, "external_power");
  const cableConnected = findEntity(related, "charging_cable_connected");
  const position = findEntity(related, "position");

  const batteryPct = battery ? parseInt(battery.state, 10) : undefined;
  const rangeKm = range ? parseInt(range.state, 10) : undefined;
  const odometerKm = odometer ? parseInt(odometer.state, 10) : undefined;
  const batteryValid = batteryPct !== undefined && !isNaN(batteryPct);

  const lat = position?.attributes?.latitude as number | undefined;
  const lon = position?.attributes?.longitude as number | undefined;
  const address = useReverseGeocode(lat, lon);

  const mapUrl = lat !== undefined && lon !== undefined
    ? `https://staticmap.openstreetmap.de/staticmap.php?center=${lat},${lon}&zoom=15&size=600x200&maptype=mapnik`
    : undefined;

  // VW lock entities use "locked"/"unlocked" states
  const doorsLocked = doorsLock?.state === "locked";
  const trunkLocked = trunkLock?.state === "locked";
  const pluggedIn = externalPower?.state === "on" || cableConnected?.state === "on";

  // Charging state display - VW uses descriptive strings like "Not ready", "Charging", "Ready"
  const chargingLabel = (() => {
    if (!charging) return "\u2013";
    const s = charging.state.toLowerCase();
    if (s === "charging") return "L\u00e4dt";
    if (s === "ready") return "Bereit";
    if (s === "not ready") return "Nicht bereit";
    if (s === "conservation") return "Erhaltung";
    return charging.state;
  })();

  const handleClick = () => {
    onCardAction?.("vehicle-detail", {
      vehicleName,
      vehicleImage,
      prefix,
    });
  };

  return (
    <div className="vehicle-card" onClick={handleClick}>
      <div className="vehicle-card__name">{vehicleName}</div>

      {/* Stats Row */}
      <div className="vehicle-card__stats-row">
        <div className="vehicle-card__stat-col">
          <span className="vehicle-card__stat-icon">
            <Icon name="journey-arrive" style={{ width: 14, height: 14 }} />
          </span>
          <span className="vehicle-card__stat-label" style={{ color: "var(--dh-green)" }}>Kilometer</span>
          <span className="vehicle-card__stat-value">
            {odometerKm !== undefined && !isNaN(odometerKm) ? `${formatNumber(odometerKm)} km` : "\u2013"}
          </span>
        </div>
        <div className="vehicle-card__stat-divider" />
        <div className="vehicle-card__stat-col">
          <span className="vehicle-card__stat-icon">
            <Icon name="history" style={{ width: 14, height: 14 }} />
          </span>
          <span className="vehicle-card__stat-label" style={{ color: "var(--dh-blue)" }}>Geparkt</span>
          <span className="vehicle-card__stat-value">{formatParkTime(parkTime?.state)}</span>
        </div>
        <div className="vehicle-card__stat-divider" />
        <div className="vehicle-card__stat-col">
          <span className="vehicle-card__stat-icon">
            <Icon name="energy-saving-lightbulb" style={{ width: 14, height: 14 }} />
          </span>
          <span className="vehicle-card__stat-label" style={{ color: "var(--dh-orange)" }}>Reichweite</span>
          <span className="vehicle-card__stat-value">
            {rangeKm !== undefined && !isNaN(rangeKm) ? `${rangeKm} km` : "\u2013"}
          </span>
        </div>
      </div>

      {/* Battery Bar */}
      {batteryValid && (
        <div className="vehicle-card__battery">
          <div className="vehicle-card__battery-bar">
            <div
              className={`vehicle-card__battery-fill ${
                batteryPct > 50 ? "vehicle-card__battery-fill--high"
                : batteryPct > 20 ? "vehicle-card__battery-fill--mid"
                : "vehicle-card__battery-fill--low"
              }`}
              style={{ width: `${batteryPct}%` }}
            >
              <span className="vehicle-card__battery-pct">{batteryPct}%</span>
            </div>
          </div>
          {rangeKm !== undefined && !isNaN(rangeKm) && (
            <span className="vehicle-card__battery-range">{rangeKm} km</span>
          )}
        </div>
      )}

      {/* Map + Vehicle Image */}
      <div className="vehicle-card__map-area">
        {mapUrl ? (
          <img className="vehicle-card__map-bg" src={mapUrl} alt="Karte" loading="lazy" />
        ) : (
          <div className="vehicle-card__map-placeholder" />
        )}
        <div className="vehicle-card__map-overlay" />
        {vehicleImage ? (
          <img className="vehicle-card__vehicle-img" src={vehicleImage} alt={vehicleName} />
        ) : (
          <div className="vehicle-card__vehicle-placeholder">
            <Icon name="car-rental" style={{ width: 60, height: 60, opacity: 0.4 }} />
          </div>
        )}
        {lat !== undefined && lon !== undefined && (
          <div className="vehicle-card__map-pin" />
        )}
      </div>

      {/* Address */}
      {address && (
        <div className="vehicle-card__address">
          <Icon name="map" style={{ width: 14, height: 14, opacity: 0.5 }} />
          <div className="vehicle-card__address-text">
            {address.split("\n").map((line, i) => (
              <div key={i} className={i === 0 ? "vehicle-card__address-street" : "vehicle-card__address-city"}>
                {line}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Status Grid 2x2 */}
      <div className="vehicle-card__status-grid">
        <div className="vehicle-card__status-tile">
          <div className={`vehicle-card__status-icon-wrap ${doorsLocked ? "ok" : "warn"}`}>
            <Icon name={doorsLocked ? "locked" : "unlocked"} style={{ width: 16, height: 16 }} />
          </div>
          <div className="vehicle-card__status-info">
            <span className="vehicle-card__status-title">{"T\u00fcren"}</span>
            <span className={`vehicle-card__status-value ${doorsLocked ? "ok" : "warn"}`}>
              {doorsLock ? (doorsLocked ? "Verriegelt" : "Entriegelt") : "\u2013"}
            </span>
          </div>
        </div>
        <div className="vehicle-card__status-tile">
          <div className={`vehicle-card__status-icon-wrap ${trunkLocked ? "ok" : "warn"}`}>
            <Icon name={trunkLocked ? "locked" : "unlocked"} style={{ width: 16, height: 16 }} />
          </div>
          <div className="vehicle-card__status-info">
            <span className="vehicle-card__status-title">Kofferraum</span>
            <span className={`vehicle-card__status-value ${trunkLocked ? "ok" : "warn"}`}>
              {trunkLock ? (trunkLocked ? "Verriegelt" : "Entriegelt") : "\u2013"}
            </span>
          </div>
        </div>
        <div className="vehicle-card__status-tile">
          <div className={`vehicle-card__status-icon-wrap ${charging?.state?.toLowerCase() === "charging" ? "ok" : ""}`}>
            <Icon name="energy-saving-lightbulb" style={{ width: 16, height: 16 }} />
          </div>
          <div className="vehicle-card__status-info">
            <span className="vehicle-card__status-title">Laden</span>
            <span className={`vehicle-card__status-value ${charging?.state?.toLowerCase() === "charging" ? "ok" : ""}`}>
              {chargingLabel}
            </span>
          </div>
        </div>
        <div className="vehicle-card__status-tile">
          <div className={`vehicle-card__status-icon-wrap ${pluggedIn ? "ok" : ""}`}>
            <Icon name="electronic-medical-record" style={{ width: 16, height: 16 }} />
          </div>
          <div className="vehicle-card__status-info">
            <span className="vehicle-card__status-title">Stecker</span>
            <span className={`vehicle-card__status-value ${pluggedIn ? "ok" : ""}`}>
              {pluggedIn ? "Verbunden" : "Getrennt"}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

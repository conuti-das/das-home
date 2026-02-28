import { useState, useMemo, useCallback, useEffect } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntityStore } from "@/stores/entityStore";
import { PopupModal } from "@/components/layout/PopupModal";
import type { PopupProps } from "./PopupRegistry";
import "./VehiclePopup.css";

type TabId = "overview" | "climate" | "charging";

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

function useReverseGeocode(lat: number | undefined, lon: number | undefined): string | null {
  const [address, setAddress] = useState<string | null>(null);
  useEffect(() => {
    if (lat === undefined || lon === undefined) return;
    let cancelled = false;
    fetch(`/api/geo/reverse?lat=${lat}&lon=${lon}`)
      .then((r) => (r.ok ? r.json() : null))
      .then((data) => {
        if (cancelled || !data) return;
        setAddress(data.display_name || null);
      })
      .catch(() => {});
    return () => { cancelled = true; };
  }, [lat, lon]);
  return address;
}

export function VehiclePopup({ onClose, callService, props }: PopupProps) {
  const vehicleName = (props?.vehicleName as string) || "Auto";
  const vehicleImage = props?.vehicleImage as string | undefined;
  const prefix = (props?.prefix as string) || vehicleName.toLowerCase();

  const [activeTab, setActiveTab] = useState<TabId>("overview");

  const related = useEntitiesByPrefix(prefix);

  // Sensors
  const battery = findEntity(related, "battery_level", "battery_soc");
  const range = findEntity(related, "electric_range", "cruising_range");
  const odometer = findEntity(related, "odometer", "mileage");
  const charging = findEntity(related, "charging_state", "charging_status");
  // VW Connect: lock.* entities have "locked"/"unlocked" states
  const doorsLock = findEntity(related, "door_locked");
  const trunkLock = findEntity(related, "trunk_locked");
  const externalPower = findEntity(related, "external_power");
  const cableConnected = findEntity(related, "charging_cable_connected");
  const cableLocked = findEntity(related, "charging_cable_locked");
  const position = findEntity(related, "position");
  // Individual door/window sensors
  const doorLF = findEntity(related, "door_closed_left_front");
  const doorRF = findEntity(related, "door_closed_right_front");
  const doorLB = findEntity(related, "door_closed_left_back");
  const doorRB = findEntity(related, "door_closed_right_back");
  const trunkClosed = findEntity(related, "trunk_closed");
  const windowLF = findEntity(related, "window_closed_left_front");
  const windowRF = findEntity(related, "window_closed_right_front");
  const windowLB = findEntity(related, "window_closed_left_back");
  const windowRB = findEntity(related, "window_closed_right_back");

  // Climate entities
  const climate = findEntity(related, "electric_climatisation", "climatisation");
  const auxAc = findEntity(related, "auxiliary_air_conditioning");
  const windowHeater = findEntity(related, "window_heater");
  const zoneFrontLeft = findEntity(related, "zone_front_left");
  const zoneFrontRight = findEntity(related, "zone_front_right");

  // Charging entities
  const chargingSwitch = findEntity(related, "charging");
  const targetLevel = findEntity(related, "target_charge_level", "charge_limit");
  const chargingPower = findEntity(related, "charging_power", "charge_power");
  const chargingTimeLeft = findEntity(related, "charging_time_left");
  const reducedCharging = findEntity(related, "reduced_ac_charging");

  // Values
  const batteryPct = battery ? parseInt(battery.state, 10) : undefined;
  const rangeKm = range ? parseInt(range.state, 10) : undefined;
  const odometerKm = odometer ? parseInt(odometer.state, 10) : undefined;
  const batteryValid = batteryPct !== undefined && !isNaN(batteryPct);

  // Position
  const lat = position?.attributes?.latitude as number | undefined;
  const lon = position?.attributes?.longitude as number | undefined;
  const address = useReverseGeocode(lat, lon);

  // Climate state
  const climateIsOn = climate?.state !== "off" && climate?.state !== "unavailable";
  const climateTemp = (climate?.attributes?.temperature as number) || 22;
  const climateMin = (climate?.attributes?.min_temp as number) || 15.5;
  const climateMax = (climate?.attributes?.max_temp as number) || 30;

  const [tempValue, setTempValue] = useState(climateTemp);
  useEffect(() => { setTempValue(climateTemp); }, [climateTemp]);

  const toggleClimate = useCallback(() => {
    if (!climate) return;
    callService("climate", "set_hvac_mode", {
      hvac_mode: climateIsOn ? "off" : "heat_cool",
    }, { entity_id: climate.id });
  }, [callService, climate, climateIsOn]);

  const setTemperature = useCallback((temp: number) => {
    if (!climate) return;
    setTempValue(temp);
    callService("climate", "set_temperature", { temperature: temp }, { entity_id: climate.id });
  }, [callService, climate]);

  const toggleSwitch = useCallback((entity: { id: string; state: string } | undefined) => {
    if (!entity) return;
    const domain = entity.id.split(".")[0];
    const isOn = entity.state === "on";
    callService(domain, isOn ? "turn_off" : "turn_on", {}, { entity_id: entity.id });
  }, [callService]);

  const isOn = (e: { state: string } | undefined) => e?.state === "on";
  // VW binary_sensor door_closed: "off" means door IS closed (device_class=door, "off"=closed)
  const isClosed = (e: { state: string } | undefined) => e?.state === "off";
  const pluggedIn = isOn(externalPower) || isOn(cableConnected);

  const tabs: { id: TabId; label: string; icon: string }[] = [
    { id: "overview", label: "\u00dcbersicht", icon: "car-rental" },
    { id: "climate", label: "Klima", icon: "temperature" },
    { id: "charging", label: "Laden", icon: "energy-saving-lightbulb" },
  ];

  return (
    <PopupModal open title={vehicleName} icon="car-rental" onClose={onClose}>
      <div className="vehicle-popup">
        {/* Tab Bar */}
        <div className="vehicle-popup__tabs">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              className={`vehicle-popup__tab${activeTab === tab.id ? " active" : ""}`}
              onClick={() => setActiveTab(tab.id)}
            >
              <Icon name={tab.icon} style={{ width: 16, height: 16 }} />
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === "overview" && (
          <div className="vehicle-popup__overview">
            {/* Vehicle Image */}
            {vehicleImage && (
              <div className="vehicle-popup__image-wrap">
                <img src={vehicleImage} alt={vehicleName} className="vehicle-popup__image" />
              </div>
            )}

            {/* Key Stats */}
            <div className="vehicle-popup__stats">
              <div className="vehicle-popup__stat-row">
                <Icon name="energy-saving-lightbulb" style={{ width: 16, height: 16, opacity: 0.5 }} />
                <span className="vehicle-popup__stat-label">Batterie</span>
                <span className="vehicle-popup__stat-val">
                  {batteryValid ? `${batteryPct}%` : "\u2013"}
                </span>
              </div>
              <div className="vehicle-popup__stat-row">
                <Icon name="locate-me" style={{ width: 16, height: 16, opacity: 0.5 }} />
                <span className="vehicle-popup__stat-label">Reichweite</span>
                <span className="vehicle-popup__stat-val">
                  {rangeKm !== undefined && !isNaN(rangeKm) ? `${rangeKm} km` : "\u2013"}
                </span>
              </div>
              <div className="vehicle-popup__stat-row">
                <Icon name="journey-arrive" style={{ width: 16, height: 16, opacity: 0.5 }} />
                <span className="vehicle-popup__stat-label">Kilometerstand</span>
                <span className="vehicle-popup__stat-val">
                  {odometerKm !== undefined && !isNaN(odometerKm) ? `${formatNumber(odometerKm)} km` : "\u2013"}
                </span>
              </div>
              <div className="vehicle-popup__stat-row">
                <Icon name="wrench" style={{ width: 16, height: 16, opacity: 0.5 }} />
                <span className="vehicle-popup__stat-label">Ladestatus</span>
                <span className="vehicle-popup__stat-val">{charging?.state || "\u2013"}</span>
              </div>
            </div>

            {/* Lock & Door Status */}
            <div className="vehicle-popup__section-title">Schloss</div>
            <div className="vehicle-popup__lock-grid">
              <div className={`vehicle-popup__lock-tile ${doorsLock?.state === "locked" ? "locked" : "unlocked"}`}>
                <Icon name={doorsLock?.state === "locked" ? "locked" : "unlocked"} style={{ width: 18, height: 18 }} />
                <span className="vehicle-popup__lock-name">{"T\u00fcren"}</span>
                <span className="vehicle-popup__lock-state">
                  {doorsLock ? (doorsLock.state === "locked" ? "Verriegelt" : "Entriegelt") : "\u2013"}
                </span>
              </div>
              <div className={`vehicle-popup__lock-tile ${trunkLock?.state === "locked" ? "locked" : "unlocked"}`}>
                <Icon name={trunkLock?.state === "locked" ? "locked" : "unlocked"} style={{ width: 18, height: 18 }} />
                <span className="vehicle-popup__lock-name">Kofferraum</span>
                <span className="vehicle-popup__lock-state">
                  {trunkLock ? (trunkLock.state === "locked" ? "Verriegelt" : "Entriegelt") : "\u2013"}
                </span>
              </div>
              <div className={`vehicle-popup__lock-tile ${pluggedIn ? "on" : ""}`}>
                <Icon name="electronic-medical-record" style={{ width: 18, height: 18 }} />
                <span className="vehicle-popup__lock-name">Stecker</span>
                <span className="vehicle-popup__lock-state">
                  {pluggedIn ? "Verbunden" : "Getrennt"}
                </span>
              </div>
              <div className={`vehicle-popup__lock-tile ${isOn(cableLocked) ? "locked" : ""}`}>
                <Icon name={isOn(cableLocked) ? "locked" : "unlocked"} style={{ width: 18, height: 18 }} />
                <span className="vehicle-popup__lock-name">Ladekabel</span>
                <span className="vehicle-popup__lock-state">
                  {cableLocked ? (isOn(cableLocked) ? "Verriegelt" : "Entriegelt") : "\u2013"}
                </span>
              </div>
            </div>

            {/* Individual Doors & Windows */}
            <div className="vehicle-popup__section-title">{"T\u00fcren & Fenster"}</div>
            <div className="vehicle-popup__door-list">
              {[
                { label: "Vorne Links", door: doorLF, window: windowLF },
                { label: "Vorne Rechts", door: doorRF, window: windowRF },
                { label: "Hinten Links", door: doorLB, window: windowLB },
                { label: "Hinten Rechts", door: doorRB, window: windowRB },
                { label: "Kofferraum", door: trunkClosed, window: undefined },
              ].map(({ label, door, window: win }) => (
                <div key={label} className="vehicle-popup__door-row">
                  <span className="vehicle-popup__door-label">{label}</span>
                  <div className="vehicle-popup__door-icons">
                    {door && (
                      <span className={`vehicle-popup__door-badge ${isClosed(door) ? "ok" : "warn"}`}>
                        <Icon name={isClosed(door) ? "accept" : "alert"} style={{ width: 12, height: 12 }} />
                        {isClosed(door) ? "Zu" : "Offen"}
                      </span>
                    )}
                    {win && (
                      <span className={`vehicle-popup__door-badge ${isClosed(win) ? "ok" : "warn"}`}>
                        <Icon name="windows-doors" style={{ width: 12, height: 12 }} />
                        {isClosed(win) ? "Zu" : "Offen"}
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>

            {/* Location */}
            {address && (
              <>
                <div className="vehicle-popup__section-title">Standort</div>
                <div className="vehicle-popup__location">
                  <Icon name="map" style={{ width: 16, height: 16, opacity: 0.5 }} />
                  <span>{address}</span>
                </div>
              </>
            )}
          </div>
        )}

        {/* Climate / Standheizung Tab */}
        {activeTab === "climate" && (
          <div className="vehicle-popup__climate">
            {/* Main Climate Toggle */}
            <div className="vehicle-popup__climate-main">
              <div className="vehicle-popup__climate-header">
                <Icon name="temperature" style={{ width: 20, height: 20 }} />
                <span>Standheizung</span>
              </div>
              <button
                className={`vehicle-popup__toggle ${climateIsOn ? "active" : ""}`}
                onClick={toggleClimate}
                disabled={!climate}
              >
                <div className="vehicle-popup__toggle-knob" />
              </button>
            </div>

            {/* Temperature Slider */}
            <div className="vehicle-popup__temp-section">
              <div className="vehicle-popup__temp-display">
                <span className="vehicle-popup__temp-val">{tempValue.toFixed(1)}&deg;C</span>
              </div>
              <input
                type="range"
                className="vehicle-popup__temp-slider"
                min={climateMin}
                max={climateMax}
                step={0.5}
                value={tempValue}
                onChange={(e) => setTempValue(parseFloat(e.target.value))}
                onMouseUp={() => setTemperature(tempValue)}
                onTouchEnd={() => setTemperature(tempValue)}
                disabled={!climate}
              />
              <div className="vehicle-popup__temp-range">
                <span>{climateMin}&deg;C</span>
                <span>{climateMax}&deg;C</span>
              </div>
            </div>

            {/* Zone Switches */}
            <div className="vehicle-popup__section-title">Zonen & Heizung</div>
            <div className="vehicle-popup__switch-list">
              <div className="vehicle-popup__switch-row">
                <span>Scheibenheizung</span>
                <button
                  className={`vehicle-popup__toggle sm ${isOn(windowHeater) ? "active" : ""}`}
                  onClick={() => toggleSwitch(windowHeater)}
                  disabled={!windowHeater}
                >
                  <div className="vehicle-popup__toggle-knob" />
                </button>
              </div>
              <div className="vehicle-popup__switch-row">
                <span>Zone Vorne Links</span>
                <button
                  className={`vehicle-popup__toggle sm ${isOn(zoneFrontLeft) ? "active" : ""}`}
                  onClick={() => toggleSwitch(zoneFrontLeft)}
                  disabled={!zoneFrontLeft}
                >
                  <div className="vehicle-popup__toggle-knob" />
                </button>
              </div>
              <div className="vehicle-popup__switch-row">
                <span>Zone Vorne Rechts</span>
                <button
                  className={`vehicle-popup__toggle sm ${isOn(zoneFrontRight) ? "active" : ""}`}
                  onClick={() => toggleSwitch(zoneFrontRight)}
                  disabled={!zoneFrontRight}
                >
                  <div className="vehicle-popup__toggle-knob" />
                </button>
              </div>
              <div className="vehicle-popup__switch-row">
                <span>Auxiliary AC</span>
                <button
                  className={`vehicle-popup__toggle sm ${isOn(auxAc) ? "active" : ""}`}
                  onClick={() => toggleSwitch(auxAc)}
                  disabled={!auxAc}
                >
                  <div className="vehicle-popup__toggle-knob" />
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Charging Tab */}
        {activeTab === "charging" && (
          <div className="vehicle-popup__charging">
            {/* Battery Display */}
            <div className="vehicle-popup__charge-display">
              <div className="vehicle-popup__charge-circle">
                <svg viewBox="0 0 120 120" className="vehicle-popup__charge-svg">
                  <circle cx="60" cy="60" r="52" fill="none" stroke="rgba(250,251,252,0.08)" strokeWidth="8" />
                  <circle
                    cx="60" cy="60" r="52"
                    fill="none"
                    stroke={batteryValid && batteryPct > 20 ? "var(--dh-green)" : "var(--dh-orange)"}
                    strokeWidth="8"
                    strokeLinecap="round"
                    strokeDasharray={`${(batteryValid ? batteryPct : 0) * 3.267} 326.7`}
                    transform="rotate(-90 60 60)"
                  />
                </svg>
                <div className="vehicle-popup__charge-text">
                  <span className="vehicle-popup__charge-pct">{batteryValid ? `${batteryPct}%` : "\u2013"}</span>
                  <span className="vehicle-popup__charge-km">
                    {rangeKm !== undefined && !isNaN(rangeKm) ? `${rangeKm} km` : ""}
                  </span>
                </div>
              </div>
            </div>

            {/* Charging Stats */}
            <div className="vehicle-popup__stats">
              <div className="vehicle-popup__stat-row">
                <Icon name="energy-saving-lightbulb" style={{ width: 16, height: 16, opacity: 0.5 }} />
                <span className="vehicle-popup__stat-label">Status</span>
                <span className="vehicle-popup__stat-val">{charging?.state || "\u2013"}</span>
              </div>
              {chargingPower && (
                <div className="vehicle-popup__stat-row">
                  <Icon name="measure" style={{ width: 16, height: 16, opacity: 0.5 }} />
                  <span className="vehicle-popup__stat-label">Ladeleistung</span>
                  <span className="vehicle-popup__stat-val">{chargingPower.state} kW</span>
                </div>
              )}
              {chargingTimeLeft && (
                <div className="vehicle-popup__stat-row">
                  <Icon name="history" style={{ width: 16, height: 16, opacity: 0.5 }} />
                  <span className="vehicle-popup__stat-label">Restzeit</span>
                  <span className="vehicle-popup__stat-val">
                    {parseInt(chargingTimeLeft.state, 10) > 0 ? `${chargingTimeLeft.state} min` : "\u2013"}
                  </span>
                </div>
              )}
              {targetLevel && (
                <div className="vehicle-popup__stat-row">
                  <Icon name="target-group" style={{ width: 16, height: 16, opacity: 0.5 }} />
                  <span className="vehicle-popup__stat-label">Ziel-Level</span>
                  <span className="vehicle-popup__stat-val">{targetLevel.state}%</span>
                </div>
              )}
              <div className="vehicle-popup__stat-row">
                <Icon name="electronic-medical-record" style={{ width: 16, height: 16, opacity: 0.5 }} />
                <span className="vehicle-popup__stat-label">Stecker</span>
                <span className="vehicle-popup__stat-val">
                  {pluggedIn ? "Verbunden" : "Getrennt"}
                </span>
              </div>
            </div>

            {/* Charging Switches */}
            <div className="vehicle-popup__switch-list">
              {chargingSwitch && (
                <div className="vehicle-popup__switch-row">
                  <span>Laden aktivieren</span>
                  <button
                    className={`vehicle-popup__toggle sm ${isOn(chargingSwitch) ? "active" : ""}`}
                    onClick={() => toggleSwitch(chargingSwitch)}
                  >
                    <div className="vehicle-popup__toggle-knob" />
                  </button>
                </div>
              )}
              {reducedCharging && (
                <div className="vehicle-popup__switch-row">
                  <span>Reduziertes AC-Laden</span>
                  <button
                    className={`vehicle-popup__toggle sm ${isOn(reducedCharging) ? "active" : ""}`}
                    onClick={() => toggleSwitch(reducedCharging)}
                  >
                    <div className="vehicle-popup__toggle-knob" />
                  </button>
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </PopupModal>
  );
}

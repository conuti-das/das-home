import { useState, useRef, useCallback, useEffect } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntity } from "@/hooks/useEntity";
import { PopupModal } from "@/components/layout/PopupModal";
import type { PopupProps } from "./PopupRegistry";
import "./LightDetailPopup.css";

type ColorMode = "brightness" | "color" | "color_temp";

const COLOR_PRESETS: Array<{ name: string; h: number; s: number; hex: string }> = [
  { name: "Warmweiß", h: 30, s: 20, hex: "#ffd6a5" },
  { name: "Kaltweiß", h: 220, s: 10, hex: "#e8edf5" },
  { name: "Orange", h: 30, s: 100, hex: "#ff9a3c" },
  { name: "Lachs", h: 12, s: 80, hex: "#fa8072" },
  { name: "Pink", h: 330, s: 90, hex: "#ff69b4" },
  { name: "Magenta", h: 300, s: 100, hex: "#ff00ff" },
  { name: "Blau", h: 240, s: 100, hex: "#4169e1" },
  { name: "Cyan", h: 180, s: 100, hex: "#00ced1" },
  { name: "Grün", h: 120, s: 100, hex: "#32cd32" },
  { name: "Rot", h: 0, s: 100, hex: "#ff3333" },
  { name: "Lila", h: 270, s: 80, hex: "#9370db" },
  { name: "Bernstein", h: 45, s: 100, hex: "#ffbf00" },
];

export function LightDetailPopup({ onClose, callService, props }: PopupProps) {
  const entityId = (props?.entityId as string) || "";
  const entity = useEntity(entityId);
  const attrs = entity?.attributes || {};
  const isOn = entity?.state === "on";
  const name = (attrs.friendly_name as string) || entityId;

  const brightness = attrs.brightness as number | undefined;
  const brightnessPct = brightness !== undefined ? Math.round((brightness / 255) * 100) : 0;
  const supportedModes = (attrs.supported_color_modes as string[]) || [];
  const effectList = (attrs.effect_list as string[]) || [];
  const currentEffect = (attrs.effect as string) || "";
  const colorTempKelvin = attrs.color_temp_kelvin as number | undefined;
  const minKelvin = (attrs.min_color_temp_kelvin as number) || 2000;
  const maxKelvin = (attrs.max_color_temp_kelvin as number) || 6500;
  const hsColor = attrs.hs_color as [number, number] | undefined;

  const hasColor = supportedModes.some((m) => m === "hs" || m === "xy" || m === "rgb" || m === "rgbw" || m === "rgbww");
  const hasColorTemp = supportedModes.includes("color_temp");
  const hasEffects = effectList.length > 0;

  const [activeTab, setActiveTab] = useState<ColorMode>("brightness");
  const [optimisticPct, setOptimisticPct] = useState<number | null>(null);
  const [optimisticTemp, setOptimisticTemp] = useState<number | null>(null);
  const [selectedColor, setSelectedColor] = useState<[number, number] | null>(hsColor || null);
  const [showEffects, setShowEffects] = useState(false);
  const isDraggingRef = useRef(false);
  const lastCallRef = useRef(0);
  const sliderRef = useRef<HTMLDivElement>(null);
  const tempSliderRef = useRef<HTMLDivElement>(null);

  // Clear optimistic values on HA update
  useEffect(() => {
    if (!isDraggingRef.current) {
      setOptimisticPct(null);
      setOptimisticTemp(null);
    }
  }, [brightness, colorTempKelvin]);

  const sendBrightness = useCallback((pct: number, force?: boolean) => {
    const clamped = Math.max(1, Math.min(100, Math.round(pct)));
    const now = Date.now();
    if (!force && now - lastCallRef.current < 100) return;
    lastCallRef.current = now;
    callService("light", "turn_on", { brightness_pct: clamped }, { entity_id: entityId });
  }, [callService, entityId]);

  const handleVerticalPointerDown = useCallback((e: React.PointerEvent) => {
    const el = sliderRef.current;
    if (!el) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;

    const calcPct = (clientY: number) => {
      const rect = el.getBoundingClientRect();
      return Math.max(1, Math.min(100, Math.round(((rect.bottom - clientY) / rect.height) * 100)));
    };

    const pct = calcPct(e.clientY);
    setOptimisticPct(pct);
    sendBrightness(pct);

    const onMove = (ev: PointerEvent) => {
      const p = calcPct(ev.clientY);
      setOptimisticPct(p);
      sendBrightness(p);
    };
    const onUp = (ev: PointerEvent) => {
      isDraggingRef.current = false;
      const p = calcPct(ev.clientY);
      setOptimisticPct(p);
      sendBrightness(p, true);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, [sendBrightness]);

  // Color temp slider
  const sendColorTemp = useCallback((kelvin: number, force?: boolean) => {
    const clamped = Math.max(minKelvin, Math.min(maxKelvin, Math.round(kelvin)));
    const now = Date.now();
    if (!force && now - lastCallRef.current < 100) return;
    lastCallRef.current = now;
    callService("light", "turn_on", { color_temp_kelvin: clamped }, { entity_id: entityId });
  }, [callService, entityId, minKelvin, maxKelvin]);

  const handleTempPointerDown = useCallback((e: React.PointerEvent) => {
    const el = tempSliderRef.current;
    if (!el) return;
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    isDraggingRef.current = true;

    const calcKelvin = (clientX: number) => {
      const rect = el.getBoundingClientRect();
      const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
      return Math.round(minKelvin + ratio * (maxKelvin - minKelvin));
    };

    const k = calcKelvin(e.clientX);
    setOptimisticTemp(k);
    sendColorTemp(k);

    const onMove = (ev: PointerEvent) => {
      const kv = calcKelvin(ev.clientX);
      setOptimisticTemp(kv);
      sendColorTemp(kv);
    };
    const onUp = (ev: PointerEvent) => {
      isDraggingRef.current = false;
      const kv = calcKelvin(ev.clientX);
      setOptimisticTemp(kv);
      sendColorTemp(kv, true);
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
    };
    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, [sendColorTemp, minKelvin, maxKelvin]);

  const handleColorPreset = useCallback((h: number, s: number) => {
    setSelectedColor([h, s]);
    callService("light", "turn_on", { hs_color: [h, s] }, { entity_id: entityId });
  }, [callService, entityId]);

  const handleEffectSelect = useCallback((effect: string) => {
    callService("light", "turn_on", { effect }, { entity_id: entityId });
    setShowEffects(false);
  }, [callService, entityId]);

  const togglePower = useCallback(() => {
    callService("light", isOn ? "turn_off" : "turn_on", {}, { entity_id: entityId });
  }, [callService, entityId, isOn]);

  const clearEffect = useCallback(() => {
    callService("light", "turn_on", { effect: "Solid" }, { entity_id: entityId });
    setShowEffects(false);
  }, [callService, entityId]);

  const displayPct = optimisticPct ?? (isOn ? brightnessPct : 0);
  const displayTemp = optimisticTemp ?? colorTempKelvin ?? Math.round((minKelvin + maxKelvin) / 2);
  const tempRatio = (displayTemp - minKelvin) / (maxKelvin - minKelvin);

  return (
    <PopupModal open title={name} icon="lightbulb" onClose={onClose}>
      <div className="light-detail">
        {/* Brightness display + power toggle */}
        <div className="light-detail__header-row">
          <div className="light-detail__brightness-label">
            {isOn ? `${displayPct}%` : "Aus"}
          </div>
          <button
            className={`light-detail__power-btn${isOn ? " active" : ""}`}
            onClick={togglePower}
            title={isOn ? "Ausschalten" : "Einschalten"}
          >
            <Icon name="lightbulb" style={{ width: 22, height: 22 }} />
          </button>
        </div>

        {/* Vertical brightness slider */}
        <div className="light-detail__slider-area">
          <div
            ref={sliderRef}
            className="light-detail__vslider"
            onPointerDown={handleVerticalPointerDown}
          >
            <div
              className="light-detail__vslider-fill"
              style={{ height: `${displayPct}%` }}
            />
            <div className="light-detail__vslider-icon">
              <Icon name="lightbulb" style={{ width: 28, height: 28, color: "rgba(255,255,255,0.9)" }} />
            </div>
          </div>
        </div>

        {/* Color mode tabs */}
        {(hasColor || hasColorTemp) && (
          <div className="light-detail__tabs">
            <button
              className={`light-detail__tab${activeTab === "brightness" ? " active" : ""}`}
              onClick={() => setActiveTab("brightness")}
            >
              <Icon name="lightbulb" style={{ width: 16, height: 16 }} />
            </button>
            {hasColor && (
              <button
                className={`light-detail__tab${activeTab === "color" ? " active" : ""}`}
                onClick={() => setActiveTab("color")}
              >
                <Icon name="palette" style={{ width: 16, height: 16 }} />
              </button>
            )}
            {hasColorTemp && (
              <button
                className={`light-detail__tab${activeTab === "color_temp" ? " active" : ""}`}
                onClick={() => setActiveTab("color_temp")}
              >
                <Icon name="temperature" style={{ width: 16, height: 16 }} />
              </button>
            )}
          </div>
        )}

        {/* Color presets view */}
        {activeTab === "color" && hasColor && (
          <div className="light-detail__colors">
            {COLOR_PRESETS.map((preset) => (
              <button
                key={preset.name}
                className={`light-detail__color-btn${
                  selectedColor && selectedColor[0] === preset.h && selectedColor[1] === preset.s ? " active" : ""
                }`}
                style={{ background: preset.hex }}
                onClick={() => handleColorPreset(preset.h, preset.s)}
                title={preset.name}
              />
            ))}
          </div>
        )}

        {/* Color temperature view */}
        {activeTab === "color_temp" && hasColorTemp && (
          <div className="light-detail__temp">
            <div className="light-detail__temp-labels">
              <span>Warm</span>
              <span>{Math.round(displayTemp)}K</span>
              <span>Kalt</span>
            </div>
            <div
              ref={tempSliderRef}
              className="light-detail__temp-slider"
              onPointerDown={handleTempPointerDown}
            >
              <div
                className="light-detail__temp-thumb"
                style={{ left: `${tempRatio * 100}%` }}
              />
            </div>
          </div>
        )}

        {/* Effects */}
        {hasEffects && (
          <div className="light-detail__effects">
            <button
              className="light-detail__effect-toggle"
              onClick={() => setShowEffects(!showEffects)}
            >
              <Icon name="media-play" style={{ width: 14, height: 14 }} />
              <span>{currentEffect || "Effekt"}</span>
              <Icon name={showEffects ? "slim-arrow-up" : "slim-arrow-down"} style={{ width: 12, height: 12, marginLeft: "auto" }} />
            </button>
            {showEffects && (
              <div className="light-detail__effect-list">
                <button
                  className={`light-detail__effect-chip${!currentEffect || currentEffect === "Solid" || currentEffect === "None" ? " active" : ""}`}
                  onClick={clearEffect}
                >
                  Keine
                </button>
                {effectList.map((effect) => (
                  <button
                    key={effect}
                    className={`light-detail__effect-chip${effect === currentEffect ? " active" : ""}`}
                    onClick={() => handleEffectSelect(effect)}
                  >
                    {effect}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </PopupModal>
  );
}

import { useState, useRef, useCallback, useEffect } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntity } from "@/hooks/useEntity";
import { getDomainStyle } from "@/utils/domainColors";
import { CardErrorBoundary } from "./CardErrorBoundary";
import type { CardComponentProps } from "./CardRegistry";
import "./LightSliderCard.css";

export function LightSliderCard({ card, callService, onCardAction }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const isOn = entity?.state === "on";
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const brightness = entity?.attributes?.brightness as number | undefined;
  const brightnessPct = brightness !== undefined ? Math.round((brightness / 255) * 100) : 0;
  const style = getDomainStyle(card.entity);
  const trackRef = useRef<HTMLDivElement>(null);

  // Optimistic state: shows target value immediately, clears when HA confirms
  const [optimisticPct, setOptimisticPct] = useState<number | null>(null);
  const lastCallRef = useRef(0);
  const isDraggingRef = useRef(false);

  // Clear optimistic value when HA sends new brightness
  useEffect(() => {
    if (!isDraggingRef.current) {
      setOptimisticPct(null);
    }
  }, [brightness]);

  const sendBrightness = useCallback((pct: number, force?: boolean) => {
    const clamped = Math.max(1, Math.min(100, Math.round(pct)));
    const now = Date.now();
    if (!force && now - lastCallRef.current < 100) return;
    lastCallRef.current = now;
    callService("light", "turn_on", { brightness_pct: clamped }, { entity_id: card.entity });
  }, [callService, card.entity]);

  const pctFromEvent = useCallback((clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(1, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const handleTrackPointerDown = useCallback((e: React.PointerEvent) => {
    const el = trackRef.current;
    if (!el) return;

    const isTouch = e.pointerType === "touch";
    const startX = e.clientX;
    const startY = e.clientY;
    let dragStarted = false;
    let aborted = false;

    // Mouse: capture immediately (no scroll conflict on desktop)
    if (!isTouch) {
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      isDraggingRef.current = true;
      dragStarted = true;
      const pct = pctFromEvent(startX);
      setOptimisticPct(pct);
      sendBrightness(pct);
    }

    const onMove = (ev: PointerEvent) => {
      if (aborted) return;

      if (!dragStarted) {
        const dx = Math.abs(ev.clientX - startX);
        const dy = Math.abs(ev.clientY - startY);
        // Vertical scroll intent → abort
        if (dy > dx + 3) {
          aborted = true;
          document.removeEventListener("pointermove", onMove);
          document.removeEventListener("pointerup", onUp);
          return;
        }
        // Not enough movement yet to decide
        if (dx < 6) return;
        // Horizontal drag confirmed → capture now
        dragStarted = true;
        isDraggingRef.current = true;
        (e.target as HTMLElement).setPointerCapture(e.pointerId);
        const pct = pctFromEvent(startX);
        setOptimisticPct(pct);
        sendBrightness(pct);
      }

      const p = pctFromEvent(ev.clientX);
      setOptimisticPct(p);
      sendBrightness(p);
    };

    const onUp = (ev: PointerEvent) => {
      isDraggingRef.current = false;
      document.removeEventListener("pointermove", onMove);
      document.removeEventListener("pointerup", onUp);
      if (aborted) return;
      const p = pctFromEvent(ev.clientX);
      setOptimisticPct(p);
      sendBrightness(p, true); // force final value
    };

    document.addEventListener("pointermove", onMove);
    document.addEventListener("pointerup", onUp);
  }, [pctFromEvent, sendBrightness]);

  const handleToggle = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isOn) {
      callService("light", "turn_off", {}, { entity_id: card.entity });
    } else {
      callService("light", "turn_on", {}, { entity_id: card.entity });
    }
  }, [isOn, callService, card.entity]);

  const handleSettings = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    onCardAction?.("light-detail", { entityId: card.entity });
  }, [onCardAction, card.entity]);

  const displayPct = optimisticPct ?? (isOn ? brightnessPct : 0);
  const fillPct = isOn || optimisticPct !== null ? displayPct : 0;
  const textColor = isOn ? "var(--dh-gray1000)" : "var(--dh-gray100)";

  return (
    <CardErrorBoundary cardType="light">
      <div className="light-slider" style={{ background: style.tint }}>
        {/* Slider track area (6/7) */}
        <div
          ref={trackRef}
          className="light-slider__track"
          onPointerDown={handleTrackPointerDown}
        >
          <div
            className="light-slider__fill"
            style={{ width: `${fillPct}%`, background: style.color }}
          />
          {isOn && fillPct > 5 && (
            <div className="light-slider__thumb" style={{ left: `${fillPct}%` }} />
          )}
          <div className="light-slider__content">
            <Icon name="lightbulb" className="light-slider__icon" style={{ color: textColor }} />
            <span className="light-slider__name" style={{ color: textColor }}>{name}</span>
            {isOn && (
              <span className="light-slider__pct" style={{ color: textColor }}>{displayPct}%</span>
            )}
          </div>
        </div>

        {/* Button column (1/7) */}
        <div className="light-slider__controls">
          <button
            className={`light-slider__btn light-slider__btn--on${isOn ? " active" : ""}`}
            onClick={handleToggle}
            title={isOn ? "Ausschalten" : "Einschalten"}
          >
            <Icon name="lightbulb" style={{ width: 18, height: 18 }} />
          </button>
          <button
            className="light-slider__btn light-slider__btn--settings"
            onClick={handleSettings}
            title="Einstellungen"
          >
            <Icon name="action-settings" style={{ width: 16, height: 16 }} />
          </button>
        </div>
      </div>
    </CardErrorBoundary>
  );
}

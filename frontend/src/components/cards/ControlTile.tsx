import { useState, useRef, useCallback, useEffect } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntity } from "@/hooks/useEntity";
import { getDomainStyle } from "@/utils/domainColors";
import type { CardComponentProps } from "./CardRegistry";
import "./ControlTile.css";

export interface ControlTileProps {
  entityId: string;
  callService: CardComponentProps["callService"];
  onCardAction?: CardComponentProps["onCardAction"];
}

/**
 * A single shared "pill" control for a light OR a switch/input_boolean,
 * used inside area popups. 58px tall, 14px radius, icon-in-circle on the left.
 *
 * - light.*        → amber horizontal brightness slider (drag) + % value,
 *                    tap name/icon toggles, gear on the right opens detail.
 * - switch.* /
 *   input_boolean.* → same pill, on = full --dh-blue fill + iOS toggle,
 *                     off = neutral. Tap anywhere toggles. No slider, no %.
 *
 * unavailable → opacity 0.55.
 */
export function ControlTile({ entityId, callService, onCardAction }: ControlTileProps) {
  const entity = useEntity(entityId);
  const domain = entityId.split(".")[0];
  const isLight = domain === "light";
  const isOn = entity?.state === "on";
  const isUnavailable = !entity || entity.state === "unavailable" || entity.state === "unknown";
  const name = (entity?.attributes?.friendly_name as string) || entityId.split(".")[1] || entityId;
  const style = getDomainStyle(entityId);

  const brightness = entity?.attributes?.brightness as number | undefined;
  const brightnessPct = brightness !== undefined ? Math.round((brightness / 255) * 100) : 0;

  const trackRef = useRef<HTMLDivElement>(null);

  // Optimistic brightness: shows target value immediately, clears when HA confirms.
  const [optimisticPct, setOptimisticPct] = useState<number | null>(null);
  const lastCallRef = useRef(0);
  const isDraggingRef = useRef(false);

  useEffect(() => {
    if (!isDraggingRef.current) {
      setOptimisticPct(null);
    }
  }, [brightness]);

  const sendBrightness = useCallback(
    (pct: number, force?: boolean) => {
      const clamped = Math.max(1, Math.min(100, Math.round(pct)));
      const now = Date.now();
      if (!force && now - lastCallRef.current < 100) return;
      lastCallRef.current = now;
      callService("light", "turn_on", { brightness_pct: clamped }, { entity_id: entityId });
    },
    [callService, entityId],
  );

  const pctFromEvent = useCallback((clientX: number): number => {
    const el = trackRef.current;
    if (!el) return 0;
    const rect = el.getBoundingClientRect();
    return Math.max(1, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
  }, []);

  const handleTrackPointerDown = useCallback(
    (e: React.PointerEvent) => {
      if (isUnavailable) return;
      const el = trackRef.current;
      if (!el) return;

      const isTouch = e.pointerType === "touch";
      const startX = e.clientX;
      const startY = e.clientY;
      let dragStarted = false;
      let aborted = false;

      // Mouse: capture immediately (no scroll conflict on desktop).
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
          // Vertical scroll intent → abort, let the list scroll.
          if (dy > dx + 3) {
            aborted = true;
            document.removeEventListener("pointermove", onMove);
            document.removeEventListener("pointerup", onUp);
            return;
          }
          if (dx < 6) return; // not enough movement yet to decide
          // Horizontal drag confirmed → capture now.
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
    },
    [isUnavailable, pctFromEvent, sendBrightness],
  );

  const handleToggle = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      if (isUnavailable) return;
      const service = isOn ? "turn_off" : "turn_on";
      callService(domain, service, {}, { entity_id: entityId });
    },
    [isOn, isUnavailable, callService, domain, entityId],
  );

  const handleSettings = useCallback(
    (e: React.MouseEvent) => {
      e.stopPropagation();
      onCardAction?.("light-detail", { entityId });
    },
    [onCardAction, entityId],
  );

  const tileClass = [
    "control-tile",
    isLight ? "control-tile--light" : "control-tile--switch",
    isOn ? "control-tile--on" : "control-tile--off",
    isUnavailable ? "control-tile--unavailable" : "",
  ]
    .filter(Boolean)
    .join(" ");

  // ----- Light variant: brightness slider -----
  if (isLight) {
    const displayPct = optimisticPct ?? (isOn ? brightnessPct : 0);
    const fillPct = isOn || optimisticPct !== null ? displayPct : 0;
    const textColor = fillPct > 12 ? "var(--dh-gray1000)" : "var(--dh-gray100)";

    return (
      <div className={tileClass}>
        <div
          ref={trackRef}
          className="control-tile__track"
          onPointerDown={handleTrackPointerDown}
        >
          <div
            className="control-tile__fill"
            style={{ width: `${fillPct}%`, background: style.color }}
          />
          <div className="control-tile__content">
            <button
              type="button"
              className="control-tile__icon-btn"
              onClick={handleToggle}
              title={isOn ? "Ausschalten" : "Einschalten"}
              style={{ color: textColor }}
            >
              <span
                className="control-tile__icon-circle"
                style={{
                  background: isOn ? "rgba(13,14,18,0.18)" : style.iconBg,
                  color: isOn ? "var(--dh-gray1000)" : style.color,
                }}
              >
                <Icon name="lightbulb" className="control-tile__icon" />
              </span>
            </button>
            <span
              className="control-tile__name"
              onClick={handleToggle}
              style={{ color: textColor }}
            >
              {name}
            </span>
            {(isOn || optimisticPct !== null) && (
              <span className="control-tile__pct" style={{ color: textColor }}>
                {displayPct}%
              </span>
            )}
            <button
              type="button"
              className="control-tile__settings"
              onClick={handleSettings}
              title="Einstellungen"
              style={{ color: textColor }}
            >
              <Icon name="action-settings" className="control-tile__settings-icon" />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ----- Switch / input_boolean variant: toggle -----
  return (
    <div
      className={tileClass}
      onClick={handleToggle}
      role="button"
      tabIndex={0}
      style={{
        background: isOn ? "var(--dh-blue)" : "var(--dh-gray300)",
      }}
    >
      <div className="control-tile__content">
        <span
          className="control-tile__icon-circle"
          style={{
            background: isOn ? "rgba(13,14,18,0.18)" : "rgba(86,204,242,0.15)",
            color: isOn ? "var(--dh-gray1000)" : "var(--dh-blue)",
          }}
        >
          <Icon name="switch-classes" className="control-tile__icon" />
        </span>
        <span
          className="control-tile__name"
          style={{ color: isOn ? "var(--dh-gray1000)" : "var(--dh-gray100)" }}
        >
          {name}
        </span>
        <span
          className={`control-tile__toggle${isOn ? " control-tile__toggle--on" : ""}`}
          aria-hidden="true"
        >
          <span className="control-tile__toggle-knob" />
        </span>
      </div>
    </div>
  );
}

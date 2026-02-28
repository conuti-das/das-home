import type { ReactNode } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useDashboardStore } from "@/stores/dashboardStore";
import { getDomainStyle } from "@/utils/domainColors";
import { CardErrorBoundary } from "./CardErrorBoundary";
import "./PillCard.css";

interface PillCardProps {
  entityId: string;
  label?: string;
  value?: string | number;
  symbol?: string;
  icon?: string;
  variant?: "big" | "small";
  isOn?: boolean;
  barValue?: number;
  barColor?: string;
  onClick?: () => void;
  children?: ReactNode;
  cardType: string;
}

export function PillCard({
  entityId,
  label,
  value,
  symbol,
  icon,
  variant = "big",
  isOn = false,
  barValue,
  barColor,
  onClick,
  children,
  cardType,
}: PillCardProps) {
  const editMode = useDashboardStore((s) => s.editMode);
  const style = getDomainStyle(entityId);

  const bg = isOn ? style.color : style.tint;
  const textColor = isOn ? "var(--dh-gray1000)" : "var(--dh-gray100)";
  const iconColor = isOn ? "var(--dh-gray1000)" : style.color;
  const actualBarColor = barColor || style.color;

  if (variant === "small") {
    return (
      <CardErrorBoundary cardType={cardType}>
        <div
          className="pill-card pill-card--small"
          style={{ background: bg, color: textColor }}
          onClick={onClick}
        >
          {icon && (
            <div className="pill-card__icon-circle" style={{ background: style.iconBg }}>
              <Icon name={icon} style={{ color: iconColor, width: "var(--dh-icon-size)", height: "var(--dh-icon-size)" }} />
            </div>
          )}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div className="pill-card__value--small" style={{ color: textColor }}>
              {value}{symbol && <span style={{ opacity: 0.7, marginLeft: 2 }}>{symbol}</span>}
            </div>
            {label && <div className="pill-card__label" style={{ color: textColor }}>{label}</div>}
          </div>
          {children}
          {editMode && <div className="pill-card__edit-overlay">{cardType}</div>}
        </div>
      </CardErrorBoundary>
    );
  }

  return (
    <CardErrorBoundary cardType={cardType}>
      <div
        className="pill-card pill-card--big"
        style={{ background: bg, color: textColor }}
        onClick={onClick}
      >
        <div className="pill-card__top">
          <div className="pill-card__label" style={{ color: textColor }}>{label}</div>
          {icon && (
            <div className="pill-card__icon-circle" style={{ background: style.iconBg }}>
              <Icon name={icon} style={{ color: iconColor, width: "var(--dh-icon-size)", height: "var(--dh-icon-size)" }} />
            </div>
          )}
        </div>
        <div>
          {value !== undefined && (
            <div className="pill-card__value" style={{ color: textColor }}>
              {value}
              {symbol && <span style={{ fontSize: 14, fontWeight: 400, opacity: 0.7, marginLeft: 2 }}>{symbol}</span>}
            </div>
          )}
        </div>
        {children}
        {barValue !== undefined && (
          <>
            <div className="pill-card__bar-track" />
            <div className="pill-card__bar" style={{ width: `${Math.min(100, Math.max(0, barValue))}%`, background: actualBarColor }} />
          </>
        )}
        {editMode && <div className="pill-card__edit-overlay">{cardType}</div>}
      </div>
    </CardErrorBoundary>
  );
}

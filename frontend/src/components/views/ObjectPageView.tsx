import { useMemo } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { getCardComponent } from "@/components/cards";
import type { ViewConfig, CardItem } from "@/types";

interface ObjectPageViewProps {
  view: ViewConfig;
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => void;
  onOpenPopup?: (popupId: string, props?: Record<string, unknown>) => void;
}

const SMALL_CARD_TYPES = new Set(["switch", "input_boolean", "button", "automation", "lock", "script", "scene", "binary_sensor", "update", "number", "select", "person"]);

/** Default favorite types: lights and media players */
const DEFAULT_FAVORITE_TYPES = new Set(["light", "media_player"]);

/** Filter out sub-entities like WLED segments */
function isMainEntity(card: CardItem): boolean {
  const id = card.entity;
  if (id.includes("_segment_") || id.includes("_channel_")) return false;
  return true;
}

function isFavorite(card: CardItem): boolean {
  if (card.favorite !== undefined) return card.favorite;
  if (!DEFAULT_FAVORITE_TYPES.has(card.type)) return false;
  return isMainEntity(card);
}

export function ObjectPageView({ view, callService, onOpenPopup }: ObjectPageViewProps) {
  // Collect all favorites across sections
  const favorites = useMemo(() => {
    const favs: CardItem[] = [];
    for (const section of view.sections) {
      for (const card of section.items) {
        if (isFavorite(card) && card.visible !== false) {
          favs.push(card);
        }
      }
    }
    return favs;
  }, [view.sections]);

  const hasFavorites = favorites.length > 0;

  return (
    <div style={{ padding: "0 12px 80px 12px", overflow: "auto", flex: 1 }}>
      <div style={{ padding: "20px 8px 8px 8px" }}>
        <h2 style={{
          fontSize: 24,
          fontWeight: 700,
          color: "var(--dh-gray100)",
          margin: 0,
        }}>
          {view.name}
        </h2>
      </div>

      {/* Favorites section */}
      {hasFavorites && (
        <div style={{ marginBottom: 16 }}>
          <div style={{
            fontSize: 13,
            fontWeight: 600,
            textTransform: "uppercase" as const,
            letterSpacing: 0.5,
            color: "var(--dh-yellow)",
            opacity: 0.6,
            padding: "8px 8px 4px 8px",
            display: "flex",
            alignItems: "center",
            gap: 6,
          }}>
            <Icon name="favorite" style={{ width: 12, height: 12, color: "var(--dh-yellow)" }} />
            Favoriten
          </div>
          <div style={{
            display: "grid",
            gridTemplateColumns: favorites.every((c) => SMALL_CARD_TYPES.has(c.type)) ? "1fr" : "repeat(2, 1fr)",
            gap: "var(--dh-grid-gap)",
          }}>
            {favorites.map((card) => {
              const CardComp = getCardComponent(card.type);
              if (!CardComp) return null;
              return <CardComp key={card.id} card={card} callService={callService} onCardAction={onOpenPopup} />;
            })}
          </div>
        </div>
      )}

      {/* Regular sections (non-favorites) */}
      {view.sections.map((section) => {
        const nonFavItems = section.items.filter((c) => !isFavorite(c) && c.visible !== false);
        if (nonFavItems.length === 0) return null;

        const allSmall = nonFavItems.every((c) => SMALL_CARD_TYPES.has(c.type));
        return (
          <div key={section.id} style={{ marginBottom: 16 }}>
            <div style={{
              fontSize: 13,
              fontWeight: 600,
              textTransform: "uppercase" as const,
              letterSpacing: 0.5,
              color: "var(--dh-gray100)",
              opacity: 0.4,
              padding: "8px 8px 4px 8px",
            }}>
              {section.title}
            </div>
            <div style={{
              display: "grid",
              gridTemplateColumns: allSmall ? "1fr" : "repeat(2, 1fr)",
              gap: "var(--dh-grid-gap)",
            }}>
              {nonFavItems.map((card) => {
                const CardComp = getCardComponent(card.type);
                if (!CardComp) return null;
                return <CardComp key={card.id} card={card} callService={callService} onCardAction={onOpenPopup} />;
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

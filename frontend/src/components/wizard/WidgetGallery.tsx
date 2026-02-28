import { useState, useMemo } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { getAllMetadata, type CardMetadata, type CardCategory } from "@/components/cards/CardRegistry";
import { useEntityStore } from "@/stores/entityStore";
import type { EntityState } from "@/types";

interface WidgetGalleryProps {
  onSelect: (widget: CardMetadata, matchingEntities: EntityState[]) => void;
}

const CATEGORIES: { key: CardCategory | "all"; label: string }[] = [
  { key: "all", label: "Alle" },
  { key: "anzeige", label: "Anzeige" },
  { key: "steuerung", label: "Steuerung" },
  { key: "komplex", label: "Komplex" },
  { key: "spezial", label: "Spezial" },
];

export function WidgetGallery({ onSelect }: WidgetGalleryProps) {
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState<CardCategory | "all">("all");
  const entities = useEntityStore((s) => s.entities);

  const allMetadata = useMemo(() => getAllMetadata(), []);

  const filtered = useMemo(() => {
    const searchLower = search.toLowerCase();
    return allMetadata.filter((m) => {
      if (category !== "all" && m.category !== category) return false;
      if (searchLower) {
        return (
          m.displayName.toLowerCase().includes(searchLower) ||
          m.description.toLowerCase().includes(searchLower) ||
          m.type.toLowerCase().includes(searchLower) ||
          m.compatibleDomains.some((d) => d.includes(searchLower))
        );
      }
      return true;
    });
  }, [allMetadata, search, category]);

  const handleSelect = (widget: CardMetadata) => {
    // Find matching entities
    const matching: EntityState[] = [];
    if (widget.compatibleDomains.length > 0) {
      for (const [id, state] of entities) {
        const domain = id.split(".")[0];
        if (widget.compatibleDomains.includes(domain)) {
          matching.push(state);
        }
      }
    }
    onSelect(widget, matching);
  };

  return (
    <div>
      <input
        className="widget-wizard__input"
        placeholder="Widget suchen..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        autoFocus
      />

      <div style={{ display: "flex", gap: 6, flexWrap: "wrap", margin: "12px 0" }}>
        {CATEGORIES.map((cat) => (
          <button
            key={cat.key}
            className={`widget-wizard__chip ${category === cat.key ? "widget-wizard__chip--active" : ""}`}
            onClick={() => setCategory(cat.key)}
          >
            {cat.label}
          </button>
        ))}
      </div>

      <div className="widget-wizard__card-grid">
        {filtered.map((meta) => {
          // Count matching entities
          let entityCount = 0;
          if (meta.compatibleDomains.length > 0) {
            for (const id of entities.keys()) {
              const domain = id.split(".")[0];
              if (meta.compatibleDomains.includes(domain)) entityCount++;
            }
          }

          return (
            <button
              key={meta.type}
              className="wg__card"
              onClick={() => handleSelect(meta)}
            >
              <div className="wg__card-icon">
                <Icon name={meta.iconName} style={{ width: 20, height: 20, color: "var(--dh-blue)" }} />
              </div>
              <div className="wg__card-name">{meta.displayName}</div>
              <div className="wg__card-desc">{meta.description}</div>
              {meta.compatibleDomains.length > 0 && (
                <div className="wg__card-domains">
                  {meta.compatibleDomains.slice(0, 3).map((d) => (
                    <span key={d} className="wg__domain-chip">{d}</span>
                  ))}
                </div>
              )}
              {entityCount > 0 && (
                <div className="wg__card-count">{entityCount} Entities</div>
              )}
            </button>
          );
        })}
      </div>

      {filtered.length === 0 && (
        <div style={{ textAlign: "center", padding: 32, opacity: 0.4, color: "var(--dh-gray100)", fontSize: 14 }}>
          Keine Widgets gefunden
        </div>
      )}

      <style>{`
        .wg__card {
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding: 14px;
          border-radius: var(--dh-card-radius);
          border: var(--dh-surface-border);
          background: var(--dh-gray300);
          cursor: pointer;
          transition: background 0.15s ease, border-color 0.15s ease;
          text-align: left;
          width: 100%;
          gap: 6px;
        }
        .wg__card:hover {
          background: rgba(250, 251, 252, 0.06);
          border-color: rgba(86, 204, 242, 0.3);
        }
        .wg__card-icon {
          width: 36px;
          height: 36px;
          border-radius: var(--dh-card-radius-sm);
          background: rgba(86, 204, 242, 0.12);
          display: flex;
          align-items: center;
          justify-content: center;
          margin-bottom: 2px;
        }
        .wg__card-name {
          font-size: 14px;
          font-weight: 600;
          color: var(--dh-gray100);
        }
        .wg__card-desc {
          font-size: 11px;
          color: var(--dh-gray100);
          opacity: 0.45;
          line-height: 1.4;
        }
        .wg__card-domains {
          display: flex;
          gap: 4px;
          flex-wrap: wrap;
          margin-top: 2px;
        }
        .wg__domain-chip {
          font-size: 10px;
          padding: 1px 6px;
          border-radius: 4px;
          background: rgba(250, 251, 252, 0.08);
          color: var(--dh-gray100);
          opacity: 0.6;
        }
        .wg__card-count {
          font-size: 11px;
          color: var(--dh-blue);
          opacity: 0.7;
          margin-top: 2px;
        }
      `}</style>
    </div>
  );
}

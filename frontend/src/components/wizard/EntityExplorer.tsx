import { useState, useCallback } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntityFilter } from "@/hooks/useEntityFilter";
import { useEntityStore } from "@/stores/entityStore";
import { getDomainStyle } from "@/utils/domainColors";
import { getRecommendedWidgets } from "@/utils/widgetRecommendation";
import type { EntityState } from "@/types";

interface EntityExplorerProps {
  onSelect: (entities: EntityState[]) => void;
}

export function EntityExplorer({ onSelect }: EntityExplorerProps) {
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const filter = useEntityFilter();
  const areasMap = useEntityStore((s) => s.areas);
  const entityAreaMap = useEntityStore((s) => s.entityAreaMap);
  const entities = useEntityStore((s) => s.entities);

  const toggleSelect = useCallback((entityId: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(entityId)) {
        next.delete(entityId);
      } else {
        next.add(entityId);
      }
      return next;
    });
  }, []);

  const toggleExpand = useCallback((entityId: string) => {
    setExpandedId((prev) => (prev === entityId ? null : entityId));
  }, []);

  const handleConfirm = useCallback(() => {
    const result: EntityState[] = [];
    for (const id of selected) {
      const entity = entities.get(id);
      if (entity) result.push(entity);
    }
    onSelect(result);
  }, [selected, entities, onSelect]);

  const selectAll = useCallback(() => {
    const allIds = new Set(filter.results.map((e) => e.entity_id));
    setSelected((prev) => {
      const next = new Set(prev);
      for (const id of allIds) next.add(id);
      return next;
    });
  }, [filter.results]);

  const deselectAll = useCallback(() => {
    setSelected(new Set());
  }, []);

  const getAreaName = (entityId: string) => {
    const areaId = entityAreaMap.get(entityId);
    if (!areaId) return "";
    return areasMap.get(areaId)?.name ?? "";
  };

  return (
    <div>
      {/* Search */}
      <input
        className="widget-wizard__input"
        placeholder="Entity suchen..."
        value={filter.search}
        onChange={(e) => filter.setSearch(e.target.value)}
        autoFocus
      />

      {/* Filters */}
      <div style={{ display: "flex", gap: 8, margin: "10px 0", flexWrap: "wrap" }}>
        <select
          className="ee__select"
          value={filter.domainFilter}
          onChange={(e) => filter.setDomainFilter(e.target.value)}
        >
          <option value="">Alle Domains</option>
          {filter.domains.map((d) => (
            <option key={d} value={d}>{d}</option>
          ))}
        </select>
        <select
          className="ee__select"
          value={filter.areaFilter}
          onChange={(e) => filter.setAreaFilter(e.target.value)}
        >
          <option value="">Alle Bereiche</option>
          {filter.areas.map((a) => (
            <option key={a} value={a}>{a}</option>
          ))}
        </select>
      </div>

      {/* Selection controls */}
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
        <button className="ee__link-btn" onClick={selectAll}>Alle waehlen</button>
        <span style={{ opacity: 0.3, color: "var(--dh-gray100)" }}>|</span>
        <button className="ee__link-btn" onClick={deselectAll}>Keine</button>
        <span style={{ flex: 1 }} />
        <span style={{ fontSize: 12, opacity: 0.5, color: "var(--dh-gray100)" }}>
          {filter.totalCount} Entities, {selected.size} gewaehlt
        </span>
      </div>

      {/* Table header */}
      <div className="ee__table-header">
        <div style={{ width: 28 }} />
        <button className="ee__th" onClick={() => filter.toggleSort("name")} style={{ flex: 2 }}>
          Name {filter.sortField === "name" ? (filter.sortDirection === "asc" ? "↑" : "↓") : ""}
        </button>
        <button className="ee__th ee__th--hide-mobile" onClick={() => filter.toggleSort("domain")} style={{ width: 80 }}>
          Domain {filter.sortField === "domain" ? (filter.sortDirection === "asc" ? "↑" : "↓") : ""}
        </button>
        <button className="ee__th ee__th--hide-mobile" onClick={() => filter.toggleSort("state")} style={{ width: 70 }}>
          State {filter.sortField === "state" ? (filter.sortDirection === "asc" ? "↑" : "↓") : ""}
        </button>
        <div style={{ width: 28 }} />
      </div>

      {/* Rows */}
      <div className="ee__table-body">
        {filter.results.map((entity) => {
          const name = (entity.attributes?.friendly_name as string) || entity.entity_id;
          const domain = entity.entity_id.split(".")[0];
          const style = getDomainStyle(domain);
          const isSelected = selected.has(entity.entity_id);
          const isExpanded = expandedId === entity.entity_id;
          const areaName = getAreaName(entity.entity_id);

          return (
            <div key={entity.entity_id}>
              <div
                className={`ee__row ${isSelected ? "ee__row--selected" : ""}`}
              >
                <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() => toggleSelect(entity.entity_id)}
                    className="ee__checkbox"
                  />
                </div>
                <div style={{ flex: 2, minWidth: 0, cursor: "pointer" }} onClick={() => toggleExpand(entity.entity_id)}>
                  <div style={{ fontSize: 13, fontWeight: 500, color: "var(--dh-gray100)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {name}
                  </div>
                  <div style={{ fontSize: 11, opacity: 0.35, color: "var(--dh-gray100)", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {entity.entity_id}
                  </div>
                </div>
                <div className="ee__cell--hide-mobile" style={{ width: 80 }}>
                  <span className="ee__domain-badge" style={{ background: style.iconBg, color: style.color }}>
                    {domain}
                  </span>
                </div>
                <div className="ee__cell--hide-mobile" style={{ width: 70, fontSize: 12, color: "var(--dh-gray100)", opacity: 0.6, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                  {entity.state}
                </div>
                <div style={{ width: 28, display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <button className="ee__expand-btn" onClick={() => toggleExpand(entity.entity_id)}>
                    <Icon
                      name={isExpanded ? "navigation-down-arrow" : "navigation-right-arrow"}
                      style={{ width: 12, height: 12 }}
                    />
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {isExpanded && (
                <div className="ee__details">
                  {areaName && (
                    <div className="ee__detail-row">
                      <span className="ee__detail-label">Bereich</span>
                      <span className="ee__detail-value">{areaName}</span>
                    </div>
                  )}
                  <div className="ee__detail-row">
                    <span className="ee__detail-label">State</span>
                    <span className="ee__detail-value">{entity.state}</span>
                  </div>
                  <div className="ee__detail-row">
                    <span className="ee__detail-label">Zuletzt geaendert</span>
                    <span className="ee__detail-value">{new Date(entity.last_changed).toLocaleString("de")}</span>
                  </div>
                  <div className="ee__detail-row">
                    <span className="ee__detail-label">Zuletzt aktualisiert</span>
                    <span className="ee__detail-value">{new Date(entity.last_updated).toLocaleString("de")}</span>
                  </div>

                  {/* Attributes */}
                  {entity.attributes && Object.keys(entity.attributes).length > 0 && (
                    <>
                      <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, color: "var(--dh-gray100)", marginTop: 8, marginBottom: 4 }}>
                        Attribute
                      </div>
                      {Object.entries(entity.attributes).map(([key, value]) => (
                        <div key={key} className="ee__detail-row">
                          <span className="ee__detail-label">{key}</span>
                          <span className="ee__detail-value">
                            {typeof value === "object" ? JSON.stringify(value) : String(value)}
                          </span>
                        </div>
                      ))}
                    </>
                  )}

                  {/* Widget recommendations */}
                  <div style={{ fontSize: 11, fontWeight: 600, opacity: 0.5, color: "var(--dh-gray100)", marginTop: 8, marginBottom: 4 }}>
                    Empfohlene Widgets
                  </div>
                  <div style={{ display: "flex", gap: 4, flexWrap: "wrap" }}>
                    {getRecommendedWidgets(domain).slice(0, 5).map((meta) => (
                      <span key={meta.type} className="ee__widget-chip">
                        {meta.displayName}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Pagination */}
      {filter.totalPages > 1 && (
        <div className="ee__pagination">
          <button
            className="ee__page-btn"
            disabled={filter.page === 0}
            onClick={() => filter.setPage(filter.page - 1)}
          >
            ←
          </button>
          <span style={{ fontSize: 12, color: "var(--dh-gray100)", opacity: 0.6 }}>
            {filter.page + 1} / {filter.totalPages}
          </span>
          <button
            className="ee__page-btn"
            disabled={filter.page >= filter.totalPages - 1}
            onClick={() => filter.setPage(filter.page + 1)}
          >
            →
          </button>
        </div>
      )}

      {/* Confirm button */}
      <div style={{ marginTop: 16 }}>
        <button
          className="widget-wizard__btn widget-wizard__btn--primary"
          style={{ width: "100%" }}
          disabled={selected.size === 0}
          onClick={handleConfirm}
        >
          {selected.size} {selected.size === 1 ? "Entity" : "Entities"} weiter
        </button>
      </div>

      <style>{`
        .ee__select {
          padding: 6px 10px;
          border-radius: var(--dh-card-radius-sm);
          border: var(--dh-surface-border);
          background: var(--dh-gray300);
          color: var(--dh-gray100);
          font-size: 12px;
          outline: none;
          cursor: pointer;
        }
        .ee__link-btn {
          background: none;
          border: none;
          color: var(--dh-blue);
          font-size: 12px;
          cursor: pointer;
          padding: 0;
        }
        .ee__link-btn:hover {
          text-decoration: underline;
        }
        .ee__table-header {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 6px 4px;
          border-bottom: 1px solid rgba(250, 251, 252, 0.08);
        }
        .ee__th {
          font-size: 11px;
          font-weight: 600;
          text-transform: uppercase;
          letter-spacing: 0.3px;
          color: var(--dh-gray100);
          opacity: 0.4;
          background: none;
          border: none;
          cursor: pointer;
          padding: 0;
          text-align: left;
        }
        .ee__th:hover {
          opacity: 0.7;
        }
        .ee__table-body {
          max-height: 350px;
          overflow-y: auto;
        }
        .ee__row {
          display: flex;
          align-items: center;
          gap: 8px;
          padding: 8px 4px;
          border-bottom: 1px solid rgba(250, 251, 252, 0.04);
          transition: background 0.1s ease;
        }
        .ee__row:hover {
          background: rgba(250, 251, 252, 0.03);
        }
        .ee__row--selected {
          background: rgba(86, 204, 242, 0.08);
        }
        .ee__checkbox {
          width: 16px;
          height: 16px;
          accent-color: var(--dh-blue);
          cursor: pointer;
        }
        .ee__domain-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;
          font-weight: 500;
        }
        .ee__expand-btn {
          background: none;
          border: none;
          color: var(--dh-gray100);
          opacity: 0.4;
          cursor: pointer;
          padding: 2px;
        }
        .ee__details {
          padding: 8px 12px 12px 40px;
          background: rgba(250, 251, 252, 0.02);
          border-bottom: 1px solid rgba(250, 251, 252, 0.06);
        }
        .ee__detail-row {
          display: flex;
          justify-content: space-between;
          padding: 2px 0;
          gap: 8px;
        }
        .ee__detail-label {
          font-size: 11px;
          color: var(--dh-gray100);
          opacity: 0.4;
          flex-shrink: 0;
        }
        .ee__detail-value {
          font-size: 11px;
          color: var(--dh-gray100);
          opacity: 0.7;
          text-align: right;
          word-break: break-all;
          min-width: 0;
        }
        .ee__widget-chip {
          font-size: 10px;
          padding: 2px 8px;
          border-radius: 4px;
          background: rgba(86, 204, 242, 0.12);
          color: var(--dh-blue);
        }
        .ee__pagination {
          display: flex;
          align-items: center;
          justify-content: center;
          gap: 12px;
          margin-top: 12px;
        }
        .ee__page-btn {
          width: 32px;
          height: 32px;
          border-radius: var(--dh-card-radius-sm);
          border: var(--dh-surface-border);
          background: var(--dh-gray300);
          color: var(--dh-gray100);
          cursor: pointer;
          font-size: 14px;
        }
        .ee__page-btn:disabled {
          opacity: 0.3;
          cursor: not-allowed;
        }
        @media (max-width: 639px) {
          .ee__th--hide-mobile,
          .ee__cell--hide-mobile {
            display: none;
          }
        }
      `}</style>
    </div>
  );
}

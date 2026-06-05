import { useMemo, useState, useCallback } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { getDomainStyle } from "@/utils/domainColors";
import type { EntityState } from "@/types";
import "./EntityPickerList.css";

export interface EntityPickerListProps {
  /** Room light/switch entities (the auto-visible candidates). */
  roomEntities: EntityState[];
  /** All light/switch entities of the instance (for the add-search). */
  allCandidates: EntityState[];
  /** Currently hidden room entity ids. */
  hidden: string[];
  /** Currently added extra entity ids (may be foreign-area). */
  extra: string[];
  /** Emits the next { hidden, extra } whenever the user edits. */
  onChange: (next: { hidden: string[]; extra: string[] }) => void;
}

function entityName(e: EntityState): string {
  return (e.attributes?.friendly_name as string) || e.entity_id.split(".")[1] || e.entity_id;
}

function domainIcon(entityId: string): string {
  return entityId.startsWith("switch.") ? "switch-classes" : "lightbulb";
}

/**
 * Editor list for curating which controls appear in a room popup.
 *
 * - Room entities are shown with an eye toggle (visible <-> hidden); hidden
 *   rows are dimmed. Toggling writes the entity id into/out of `hidden`.
 * - "➕ Entity hinzufügen" reveals a searchable list of ALL instance
 *   light/switch entities; picking one appends it to `extra`.
 *   Already-shown entities (room-visible or already-extra) are not offered.
 */
export function EntityPickerList({
  roomEntities,
  allCandidates,
  hidden,
  extra,
  onChange,
}: EntityPickerListProps) {
  const [adding, setAdding] = useState(false);
  const [query, setQuery] = useState("");

  const hiddenSet = useMemo(() => new Set(hidden), [hidden]);
  const extraSet = useMemo(() => new Set(extra), [extra]);
  const roomIds = useMemo(() => new Set(roomEntities.map((e) => e.entity_id)), [roomEntities]);

  const toggleHidden = useCallback(
    (entityId: string) => {
      const next = new Set(hidden);
      if (next.has(entityId)) next.delete(entityId);
      else next.add(entityId);
      onChange({ hidden: [...next], extra });
    },
    [hidden, extra, onChange],
  );

  const addExtra = useCallback(
    (entityId: string) => {
      if (extra.includes(entityId)) return;
      onChange({ hidden, extra: [...extra, entityId] });
      setQuery("");
      setAdding(false);
    },
    [hidden, extra, onChange],
  );

  const removeExtra = useCallback(
    (entityId: string) => {
      onChange({ hidden, extra: extra.filter((id) => id !== entityId) });
    },
    [hidden, extra, onChange],
  );

  // Resolve extra ids to entities (for the "added" section), preserving order.
  const candidatesById = useMemo(() => {
    const m = new Map<string, EntityState>();
    for (const e of allCandidates) m.set(e.entity_id, e);
    for (const e of roomEntities) if (!m.has(e.entity_id)) m.set(e.entity_id, e);
    return m;
  }, [allCandidates, roomEntities]);

  const extraEntities = useMemo(
    () =>
      extra
        .map((id) => candidatesById.get(id))
        .filter((e): e is EntityState => e !== undefined),
    [extra, candidatesById],
  );

  // Candidates offered in the add-search: not already room-visible, not extra.
  const addable = useMemo(() => {
    const q = query.trim().toLowerCase();
    return allCandidates.filter((e) => {
      if (extraSet.has(e.entity_id)) return false;
      // A room entity that is currently visible is already shown; offer only if hidden.
      if (roomIds.has(e.entity_id) && !hiddenSet.has(e.entity_id)) return false;
      if (!q) return true;
      return (
        e.entity_id.toLowerCase().includes(q) ||
        entityName(e).toLowerCase().includes(q)
      );
    });
  }, [allCandidates, extraSet, roomIds, hiddenSet, query]);

  return (
    <div className="epl">
      <div className="epl__section-label">Raum-Schalter &amp; Lampen</div>
      <div className="epl__list">
        {roomEntities.length === 0 && (
          <div className="epl__empty">Keine Lampen oder Schalter in diesem Raum.</div>
        )}
        {roomEntities.map((e) => {
          const isHidden = hiddenSet.has(e.entity_id);
          const style = getDomainStyle(e.entity_id);
          return (
            <div
              key={e.entity_id}
              className={`epl__row${isHidden ? " epl__row--hidden" : ""}`}
            >
              <span
                className="epl__row-icon"
                style={{ background: style.iconBg, color: style.color }}
              >
                <Icon name={domainIcon(e.entity_id)} className="epl__icon" />
              </span>
              <span className="epl__row-name">{entityName(e)}</span>
              <button
                type="button"
                className="epl__eye"
                onClick={() => toggleHidden(e.entity_id)}
                title={isHidden ? "Einblenden" : "Ausblenden"}
                aria-pressed={!isHidden}
              >
                <Icon name={isHidden ? "hide" : "show"} className="epl__icon" />
              </button>
            </div>
          );
        })}
      </div>

      {extraEntities.length > 0 && (
        <>
          <div className="epl__section-label">Zusätzlich hinzugefügt</div>
          <div className="epl__list">
            {extraEntities.map((e) => {
              const style = getDomainStyle(e.entity_id);
              return (
                <div key={e.entity_id} className="epl__row epl__row--extra">
                  <span
                    className="epl__row-icon"
                    style={{ background: style.iconBg, color: style.color }}
                  >
                    <Icon name={domainIcon(e.entity_id)} className="epl__icon" />
                  </span>
                  <span className="epl__row-name">{entityName(e)}</span>
                  <button
                    type="button"
                    className="epl__eye"
                    onClick={() => removeExtra(e.entity_id)}
                    title="Entfernen"
                  >
                    <Icon name="decline" className="epl__icon" />
                  </button>
                </div>
              );
            })}
          </div>
        </>
      )}

      {!adding ? (
        <button type="button" className="epl__add-btn" onClick={() => setAdding(true)}>
          <Icon name="add" className="epl__icon" /> Entity hinzufügen
        </button>
      ) : (
        <div className="epl__add-panel">
          <input
            className="epl__search"
            type="text"
            placeholder="Lampe oder Schalter suchen…"
            value={query}
            autoFocus
            onChange={(ev) => setQuery(ev.target.value)}
          />
          <div className="epl__add-list">
            {addable.length === 0 && (
              <div className="epl__empty">Keine passenden Entities.</div>
            )}
            {addable.map((e) => {
              const style = getDomainStyle(e.entity_id);
              return (
                <button
                  key={e.entity_id}
                  type="button"
                  className="epl__add-row"
                  onClick={() => addExtra(e.entity_id)}
                >
                  <span
                    className="epl__row-icon"
                    style={{ background: style.iconBg, color: style.color }}
                  >
                    <Icon name={domainIcon(e.entity_id)} className="epl__icon" />
                  </span>
                  <span className="epl__row-name">{entityName(e)}</span>
                  <span className="epl__add-id">{e.entity_id}</span>
                </button>
              );
            })}
          </div>
          <button
            type="button"
            className="epl__add-close"
            onClick={() => {
              setAdding(false);
              setQuery("");
            }}
          >
            Schließen
          </button>
        </div>
      )}
    </div>
  );
}

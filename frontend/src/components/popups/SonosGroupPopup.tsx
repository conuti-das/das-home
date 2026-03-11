import { useMemo, useState } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { PopupModal } from "@/components/layout/PopupModal";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import { useEntityStore } from "@/stores/entityStore";
import type { PopupProps } from "./PopupRegistry";
import "./SonosGroupPopup.css";

/** Extract the room slug from a Sonos media_player entity_id (e.g. "media_player.schlafzimmer" → "schlafzimmer") */
function getRoomSlug(entityId: string): string {
  return entityId.split(".")[1] || "";
}

/** Find related Sonos sub-entities for a given room slug */
function useRelatedEntities(roomSlug: string) {
  const entities = useEntityStore((s) => s.entities);
  return useMemo(() => {
    if (!roomSlug) return { bass: null, balance: null, treble: null, loudness: null };
    return {
      bass: entities.get(`number.${roomSlug}_bass`) ?? null,
      balance: entities.get(`number.${roomSlug}_balance`) ?? null,
      treble: entities.get(`number.${roomSlug}_hohen`) ?? entities.get(`number.${roomSlug}_treble`) ?? null,
      loudness: entities.get(`switch.${roomSlug}_loudness`) ?? null,
    };
  }, [entities, roomSlug]);
}

export function SonosGroupPopup({ onClose, callService, props }: PopupProps) {
  const masterEntityId = (props?.entityId as string) || "";
  const allPlayers = useEntitiesByDomain("media_player");

  const sonosPlayers = useMemo(
    () => allPlayers.filter(
      (e) => e.entity_id.includes("sonos") || (e.attributes.friendly_name as string || "").toLowerCase().includes("sonos")
    ),
    [allPlayers]
  );

  const master = sonosPlayers.find((e) => e.entity_id === masterEntityId) || sonosPlayers[0];
  const masterAttrs = master?.attributes || {};
  const isPlaying = master?.state === "playing";

  const groupMembers = (masterAttrs.group_members as string[]) || [];
  const isGrouped = groupMembers.length > 1;

  const volume = (masterAttrs.volume_level as number) ?? 0;
  const volumePercent = Math.round(volume * 100);

  const sourceList = (masterAttrs.source_list as string[]) || [];
  const currentSource = (masterAttrs.source as string) || "";
  const mediaTitle = (masterAttrs.media_title as string) || "";
  const mediaArtist = (masterAttrs.media_artist as string) || "";
  const masterName = (masterAttrs.friendly_name as string) || master?.entity_id || "Sonos";

  const [selectedSource, setSelectedSource] = useState(currentSource);
  const [expandedPlayer, setExpandedPlayer] = useState<string | null>(null);

  const handleGroupAll = () => {
    if (!master) return;
    const otherIds = sonosPlayers
      .filter((e) => e.entity_id !== master.entity_id)
      .map((e) => e.entity_id);
    if (otherIds.length === 0) return;
    callService("media_player", "join", { group_members: otherIds }, { entity_id: master.entity_id });
  };

  const handleUngroupAll = () => {
    if (!master) return;
    const otherIds = sonosPlayers
      .filter((e) => e.entity_id !== master.entity_id)
      .map((e) => e.entity_id);
    for (const id of otherIds) {
      callService("media_player", "unjoin", {}, { entity_id: id });
    }
  };

  const handlePlayPause = () => {
    if (!master) return;
    callService("media_player", "media_play_pause", {}, { entity_id: master.entity_id });
  };

  const handleNext = () => {
    if (!master) return;
    callService("media_player", "media_next_track", {}, { entity_id: master.entity_id });
  };

  const handlePrev = () => {
    if (!master) return;
    callService("media_player", "media_previous_track", {}, { entity_id: master.entity_id });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (!master) return;
    const val = parseInt(e.target.value, 10) / 100;
    callService("media_player", "volume_set", { volume_level: val }, { entity_id: master.entity_id });
  };

  const handleSourceChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    if (!master) return;
    setSelectedSource(e.target.value);
    callService("media_player", "select_source", { source: e.target.value }, { entity_id: master.entity_id });
  };

  return (
    <PopupModal open title={masterName} icon="media-play" onClose={onClose}>
      {/* Now playing */}
      {mediaTitle && (
        <div className="sonos-popup__now-playing">
          <div className="sonos-popup__now-playing-title">{mediaTitle}</div>
          {mediaArtist && <div className="sonos-popup__now-playing-artist">{mediaArtist}</div>}
        </div>
      )}

      {/* Playback controls */}
      <div className="sonos-popup__controls">
        <button className="sonos-popup__control-btn" onClick={handlePrev}>
          <Icon name="media-rewind" style={{ width: 20, height: 20 }} />
        </button>
        <button className="sonos-popup__control-btn sonos-popup__control-btn--play" onClick={handlePlayPause}>
          <Icon name={isPlaying ? "media-pause" : "media-play"} style={{ width: 24, height: 24 }} />
        </button>
        <button className="sonos-popup__control-btn" onClick={handleNext}>
          <Icon name="media-forward" style={{ width: 20, height: 20 }} />
        </button>
      </div>

      {/* Volume */}
      <div className="sonos-popup__volume">
        <Icon name="sound" style={{ width: 16, height: 16, color: "rgba(250,251,252,0.4)" }} />
        <input
          type="range"
          className="sonos-popup__volume-slider"
          min={0}
          max={100}
          value={volumePercent}
          onChange={handleVolumeChange}
        />
        <span className="sonos-popup__volume-label">{volumePercent}%</span>
      </div>

      {/* Source */}
      {sourceList.length > 0 && (
        <div className="sonos-popup__source-row">
          <span className="sonos-popup__source-label">Quelle</span>
          <select
            className="sonos-popup__source-select"
            value={selectedSource}
            onChange={handleSourceChange}
          >
            {sourceList.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </div>
      )}

      {/* Players */}
      <div className="sonos-popup__section-title">Player</div>
      <div className="sonos-popup__players">
        {sonosPlayers.map((player) => (
          <PlayerRow
            key={player.entity_id}
            player={player}
            inGroup={groupMembers.includes(player.entity_id)}
            isMaster={player.entity_id === master?.entity_id}
            expanded={expandedPlayer === player.entity_id}
            onToggleExpand={() => setExpandedPlayer(
              expandedPlayer === player.entity_id ? null : player.entity_id
            )}
            callService={callService}
          />
        ))}
      </div>

      <div className="sonos-popup__actions">
        {isGrouped ? (
          <button className="sonos-popup__btn sonos-popup__btn--secondary" onClick={handleUngroupAll}>
            Gruppe aufloesen
          </button>
        ) : (
          <button className="sonos-popup__btn sonos-popup__btn--primary" onClick={handleGroupAll}>
            Alle gruppieren
          </button>
        )}
      </div>
    </PopupModal>
  );
}

/** Individual player row with expandable settings */
function PlayerRow({
  player,
  inGroup,
  isMaster,
  expanded,
  onToggleExpand,
  callService,
}: {
  player: { entity_id: string; state: string; attributes: Record<string, unknown> };
  inGroup: boolean;
  isMaster: boolean;
  expanded: boolean;
  onToggleExpand: () => void;
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => void;
}) {
  const name = (player.attributes.friendly_name as string) || player.entity_id;
  const isActive = player.state === "playing" || player.state === "paused";
  const source = (player.attributes.source as string) || "";
  const volume = Math.round(((player.attributes.volume_level as number) ?? 0) * 100);

  const roomSlug = getRoomSlug(player.entity_id);
  const related = useRelatedEntities(roomSlug);

  const handlePlayerVolume = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value, 10) / 100;
    callService("media_player", "volume_set", { volume_level: val }, { entity_id: player.entity_id });
  };

  const handleNumberChange = (entityId: string, value: number) => {
    callService("number", "set_value", { value }, { entity_id: entityId });
  };

  const handleSwitchToggle = (entityId: string, currentState: string) => {
    callService("switch", currentState === "on" ? "turn_off" : "turn_on", {}, { entity_id: entityId });
  };

  const stateLabel = isActive
    ? source ? `${player.state === "playing" ? "Spielt" : "Pausiert"} · ${source}` : (player.state === "playing" ? "Spielt" : "Pausiert")
    : player.state === "idle" ? "Bereit" : player.state;

  return (
    <div className={`sonos-popup__player ${isActive ? "sonos-popup__player--active" : ""}`}>
      <div className="sonos-popup__player-main" onClick={onToggleExpand}>
        <div className="sonos-popup__player-icon">
          <Icon
            name={inGroup ? "chain-link" : "media-play"}
            style={{ width: 16, height: 16, color: inGroup ? "var(--dh-blue)" : "rgba(250,251,252,0.4)" }}
          />
        </div>
        <div className="sonos-popup__player-info">
          <div className="sonos-popup__player-name">
            {name}
            {isMaster && <span className="sonos-popup__master-badge">Master</span>}
          </div>
          <div className="sonos-popup__player-state">{stateLabel}</div>
        </div>
        <Icon
          name={expanded ? "navigation-down-arrow" : "navigation-right-arrow"}
          style={{ width: 12, height: 12, color: "rgba(250,251,252,0.3)" }}
        />
      </div>

      {expanded && (
        <div className="sonos-popup__player-settings">
          {/* Per-player volume */}
          <div className="sonos-popup__setting-row">
            <span className="sonos-popup__setting-label">Lautstaerke</span>
            <input
              type="range"
              className="sonos-popup__setting-slider"
              min={0}
              max={100}
              value={volume}
              onChange={handlePlayerVolume}
            />
            <span className="sonos-popup__setting-value">{volume}%</span>
          </div>

          {/* Bass */}
          {related.bass && (
            <NumberSlider
              label="Bass"
              entity={related.bass}
              onChange={(val) => handleNumberChange(related.bass!.entity_id, val)}
            />
          )}

          {/* Treble / Hoehen */}
          {related.treble && (
            <NumberSlider
              label="Hoehen"
              entity={related.treble}
              onChange={(val) => handleNumberChange(related.treble!.entity_id, val)}
            />
          )}

          {/* Balance */}
          {related.balance && (
            <NumberSlider
              label="Balance"
              entity={related.balance}
              onChange={(val) => handleNumberChange(related.balance!.entity_id, val)}
            />
          )}

          {/* Loudness */}
          {related.loudness && (
            <div className="sonos-popup__setting-row">
              <span className="sonos-popup__setting-label">Loudness</span>
              <button
                className={`sonos-popup__toggle ${related.loudness.state === "on" ? "sonos-popup__toggle--on" : ""}`}
                onClick={() => handleSwitchToggle(related.loudness!.entity_id, related.loudness!.state)}
              >
                {related.loudness.state === "on" ? "An" : "Aus"}
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/** Slider for number entities (bass, balance, treble) */
function NumberSlider({
  label,
  entity,
  onChange,
}: {
  label: string;
  entity: { state: string; attributes: Record<string, unknown> };
  onChange: (val: number) => void;
}) {
  const min = (entity.attributes.min as number) ?? -10;
  const max = (entity.attributes.max as number) ?? 10;
  const step = (entity.attributes.step as number) ?? 1;
  const value = parseFloat(entity.state) || 0;

  return (
    <div className="sonos-popup__setting-row">
      <span className="sonos-popup__setting-label">{label}</span>
      <input
        type="range"
        className="sonos-popup__setting-slider"
        min={min}
        max={max}
        step={step}
        value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
      />
      <span className="sonos-popup__setting-value">{value}</span>
    </div>
  );
}

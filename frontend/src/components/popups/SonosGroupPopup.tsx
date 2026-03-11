import { useMemo, useState } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { PopupModal } from "@/components/layout/PopupModal";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import type { PopupProps } from "./PopupRegistry";
import "./SonosGroupPopup.css";

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

  const [selectedSource, setSelectedSource] = useState(currentSource);

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
    <PopupModal open title="Sonos Gruppe" icon="media-play" onClose={onClose}>
      <div className="sonos-popup__section-title">Player</div>
      <div className="sonos-popup__players">
        {sonosPlayers.map((player) => {
          const name = (player.attributes.friendly_name as string) || player.entity_id;
          const isActive = player.state === "playing" || player.state === "paused";
          const inGroup = groupMembers.includes(player.entity_id);
          return (
            <div key={player.entity_id} className={`sonos-popup__player ${isActive ? "sonos-popup__player--active" : ""}`}>
              <div className="sonos-popup__player-icon">
                <Icon
                  name={inGroup ? "chain-link" : "media-play"}
                  style={{ width: 16, height: 16, color: inGroup ? "var(--dh-blue)" : "rgba(250,251,252,0.4)" }}
                />
              </div>
              <div className="sonos-popup__player-info">
                <div className="sonos-popup__player-name">{name}</div>
                <div className="sonos-popup__player-state">{player.state}</div>
              </div>
            </div>
          );
        })}
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

      {mediaTitle && (
        <>
          <div className="sonos-popup__section-title">Wiedergabe</div>
          <div style={{ padding: "4px 0 8px 0", color: "var(--dh-gray100)", fontSize: 13 }}>
            <strong>{mediaTitle}</strong>
            {mediaArtist && <span style={{ opacity: 0.5 }}> — {mediaArtist}</span>}
          </div>
        </>
      )}

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

      <div className="sonos-popup__section-title">Lautstaerke</div>
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

      {sourceList.length > 0 && (
        <>
          <div className="sonos-popup__section-title">Quelle</div>
          <select
            className="sonos-popup__source-select"
            value={selectedSource}
            onChange={handleSourceChange}
          >
            {sourceList.map((src) => (
              <option key={src} value={src}>{src}</option>
            ))}
          </select>
        </>
      )}
    </PopupModal>
  );
}

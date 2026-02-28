import { Icon } from "@ui5/webcomponents-react";
import { useEntity } from "@/hooks/useEntity";
import { apiUrl } from "@/utils/basePath";
import type { CardComponentProps } from "./CardRegistry";
import "./MediaPlayerCard.css";

export function MediaPlayerCard({ card, callService, onCardAction }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const attrs = entity?.attributes || {};
  const name = (attrs.friendly_name as string) || card.entity;
  const state = entity?.state || "off";
  const mediaTitle = (attrs.media_title as string) || "";
  const mediaArtist = (attrs.media_artist as string) || "";
  const entityPicture = attrs.entity_picture as string | undefined;
  const isPlaying = state === "playing";
  const isPaused = state === "paused";
  const isActive = isPlaying || isPaused;

  const isSonos = card.entity.includes("sonos") ||
    (name.toLowerCase().includes("sonos"));

  const useArtwork = (card.config?.artworkBackground !== false) && !!entityPicture;
  const artworkUrl = entityPicture ? apiUrl(`/api/media/artwork?entity_id=${encodeURIComponent(card.entity)}`) : "";

  const handlePlayPause = (e: React.MouseEvent) => {
    e.stopPropagation();
    callService("media_player", "media_play_pause", {}, { entity_id: card.entity });
  };

  const handleCardClick = () => {
    onCardAction?.("media-detail", { entityId: card.entity });
  };

  return (
    <div
      className={`media-card${useArtwork ? "" : " media-card--no-art"}`}
      onClick={handleCardClick}
    >
      {useArtwork && (
        <>
          <div
            className="media-card__bg"
            style={{ backgroundImage: `url(${artworkUrl})` }}
          />
          <div className="media-card__overlay" />
        </>
      )}

      {isSonos && <span className="media-card__sonos-badge">Sonos</span>}

      <div className="media-card__content">
        {artworkUrl ? (
          <img
            className="media-card__thumb"
            src={artworkUrl}
            alt=""
            loading="lazy"
          />
        ) : (
          <div className="media-card__thumb-placeholder">
            <Icon name="play" style={{ width: 22, height: 22, color: "rgba(250,251,252,0.4)" }} />
          </div>
        )}

        <div className="media-card__info">
          {isActive && mediaTitle ? (
            <>
              <span className="media-card__title">{mediaTitle}</span>
              <span className="media-card__artist">{mediaArtist || name}</span>
            </>
          ) : (
            <>
              <span className="media-card__title">{name}</span>
              <span className="media-card__state">{state}</span>
            </>
          )}
        </div>
      </div>

      <div className="media-card__controls">
        <button
          className={`media-card__play-btn${isPlaying ? " playing" : ""}`}
          onClick={handlePlayPause}
          title={isPlaying ? "Pause" : "Play"}
        >
          <Icon
            name={isPlaying ? "media-pause" : "media-play"}
            style={{ width: 24, height: 24 }}
          />
        </button>
      </div>
    </div>
  );
}

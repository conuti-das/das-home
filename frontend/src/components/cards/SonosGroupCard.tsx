import { Icon } from "@ui5/webcomponents-react";
import { useEntitiesByDomain } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";
import "./SonosGroupCard.css";

export function SonosGroupCard({ card, onCardAction }: CardComponentProps) {
  const allPlayers = useEntitiesByDomain("media_player");
  const sonosPlayers = allPlayers.filter(
    (e) => e.entity_id.includes("sonos") || (e.attributes.friendly_name as string || "").toLowerCase().includes("sonos")
  );

  const activePlayers = sonosPlayers.filter((e) => e.state === "playing" || e.state === "paused");
  const activePlayer = activePlayers[0];
  const mediaTitle = activePlayer ? (activePlayer.attributes.media_title as string) || "" : "";
  const mediaArtist = activePlayer ? (activePlayer.attributes.media_artist as string) || "" : "";
  const nowPlaying = mediaTitle ? `${mediaTitle}${mediaArtist ? ` - ${mediaArtist}` : ""}` : "";

  const handleClick = () => {
    onCardAction?.("sonos-group", { entityId: card.entity });
  };

  return (
    <div className="sonos-card" onClick={handleClick}>
      <div className="sonos-card__icon">
        <Icon name="media-play" style={{ width: 18, height: 18, color: "var(--dh-blue)" }} />
      </div>
      <div className="sonos-card__info">
        <span className="sonos-card__label">{card.customLabel || "Sonos"}</span>
        {nowPlaying ? (
          <span className="sonos-card__now-playing">{nowPlaying}</span>
        ) : (
          <span className="sonos-card__now-playing">{sonosPlayers.length} Player</span>
        )}
      </div>
      {activePlayers.length > 0 && (
        <span className="sonos-card__count">{activePlayers.length} aktiv</span>
      )}
    </div>
  );
}

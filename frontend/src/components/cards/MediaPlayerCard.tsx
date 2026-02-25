import { Button, Slider } from "@ui5/webcomponents-react";
import "@ui5/webcomponents-icons/dist/media-play.js";
import "@ui5/webcomponents-icons/dist/media-pause.js";
import "@ui5/webcomponents-icons/dist/media-forward.js";
import "@ui5/webcomponents-icons/dist/media-rewind.js";
import "@ui5/webcomponents-icons/dist/sound.js";
import { BaseCard } from "./BaseCard";
import { useEntity } from "@/hooks/useEntity";
import type { CardComponentProps } from "./CardRegistry";

export function MediaPlayerCard({ card, callService }: CardComponentProps) {
  const entity = useEntity(card.entity);
  const name = (entity?.attributes?.friendly_name as string) || card.entity;
  const state = entity?.state || "off";
  const mediaTitle = (entity?.attributes?.media_title as string) || "";
  const mediaArtist = (entity?.attributes?.media_artist as string) || "";
  const volume = (entity?.attributes?.volume_level as number) ?? 0.5;
  const isPlaying = state === "playing";

  const cmd = (service: string, data?: Record<string, unknown>) => {
    callService("media_player", service, data, { entity_id: card.entity });
  };

  return (
    <BaseCard title={name} status={state} cardType="media_player" size={card.size}>
      <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem", padding: "0.5rem 0" }}>
        {(mediaTitle || mediaArtist) && (
          <div style={{ textAlign: "center" }}>
            {mediaTitle && <div style={{ fontWeight: "bold" }}>{mediaTitle}</div>}
            {mediaArtist && <div style={{ color: "var(--sapContent_LabelColor)", fontSize: "0.75rem" }}>{mediaArtist}</div>}
          </div>
        )}
        <div style={{ display: "flex", justifyContent: "center", gap: "0.5rem" }}>
          <Button icon="media-rewind" design="Transparent" onClick={() => cmd("media_previous_track")} />
          <Button
            icon={isPlaying ? "media-pause" : "media-play"}
            design="Emphasized"
            onClick={() => cmd(isPlaying ? "media_pause" : "media_play")}
          />
          <Button icon="media-forward" design="Transparent" onClick={() => cmd("media_next_track")} />
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
          <span style={{ fontSize: "0.75rem", color: "var(--sapContent_LabelColor)" }}>Vol</span>
          <Slider
            value={Math.round(volume * 100)}
            min={0}
            max={100}
            showTooltip
            onInput={(e) => {
              const val = Number((e.target as unknown as { value: number }).value) / 100;
              cmd("volume_set", { volume_level: val });
            }}
            style={{ flex: 1 }}
          />
        </div>
      </div>
    </BaseCard>
  );
}

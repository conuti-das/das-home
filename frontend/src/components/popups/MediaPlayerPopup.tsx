import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import { Icon } from "@ui5/webcomponents-react";
import { useEntity, useEntitiesByDomain } from "@/hooks/useEntity";
import { apiUrl } from "@/utils/basePath";
import { PopupModal } from "@/components/layout/PopupModal";
import type { PopupProps } from "./PopupRegistry";
import "./MediaPlayerPopup.css";

type TabId = "player" | "favorites" | "speakers" | "queue";

interface BrowseItem {
  title: string;
  media_content_id: string;
  media_content_type: string;
  media_class: string;
  can_play: boolean;
  can_expand: boolean;
  thumbnail?: string;
  children?: BrowseItem[];
}

function formatTime(seconds: number | undefined): string {
  if (seconds === undefined || seconds === null || isNaN(seconds)) return "--:--";
  const m = Math.floor(seconds / 60);
  const s = Math.floor(seconds % 60);
  return `${m}:${s.toString().padStart(2, "0")}`;
}

export function MediaPlayerPopup({ onClose, callService, props }: PopupProps) {
  const [entityId, setEntityId] = useState<string>((props?.entityId as string) || "");
  const entity = useEntity(entityId);
  const attrs = entity?.attributes || {};
  const state = entity?.state || "off";
  const isPlaying = state === "playing";
  const isPaused = state === "paused";
  const isActive = isPlaying || isPaused;

  const name = (attrs.friendly_name as string) || entityId;
  const mediaTitle = (attrs.media_title as string) || "";
  const mediaArtist = (attrs.media_artist as string) || "";
  const mediaAlbum = (attrs.media_album_name as string) || "";
  const entityPicture = attrs.entity_picture as string | undefined;
  const mediaDuration = attrs.media_duration as number | undefined;
  const mediaPosition = attrs.media_position as number | undefined;
  const mediaPositionUpdatedAt = attrs.media_position_updated_at as string | undefined;
  const volumeLevel = attrs.volume_level as number | undefined;
  const isMuted = attrs.is_volume_muted as boolean | undefined;
  const shuffle = attrs.shuffle as boolean | undefined;
  const repeat = attrs.repeat as string | undefined;

  const artworkUrl = entityPicture
    ? apiUrl(`/api/media/artwork?entity_id=${encodeURIComponent(entityId)}`)
    : "";

  // Tabs
  const [activeTab, setActiveTab] = useState<TabId>("player");

  // Volume slider refs
  const volTrackRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);
  const lastCallRef = useRef(0);
  const [optimisticVol, setOptimisticVol] = useState<number | null>(null);

  // Browse media state
  const [browseItems, setBrowseItems] = useState<BrowseItem[]>([]);
  const [browseTitle, setBrowseTitle] = useState<string>("");
  const [browseStack, setBrowseStack] = useState<Array<{ title: string; contentId: string; contentType: string }>>([]);
  const [browseLoading, setBrowseLoading] = useState(false);

  // Computed position (interpolated from last update)
  const [currentPosition, setCurrentPosition] = useState<number>(mediaPosition || 0);

  useEffect(() => {
    if (!isPlaying || !mediaPosition || !mediaPositionUpdatedAt) {
      setCurrentPosition(mediaPosition || 0);
      return;
    }
    const updatedAt = new Date(mediaPositionUpdatedAt).getTime();
    const elapsed = (Date.now() - updatedAt) / 1000;
    setCurrentPosition(mediaPosition + elapsed);

    const interval = setInterval(() => {
      const el = (Date.now() - updatedAt) / 1000;
      setCurrentPosition(mediaPosition + el);
    }, 1000);
    return () => clearInterval(interval);
  }, [isPlaying, mediaPosition, mediaPositionUpdatedAt]);

  // Clear optimistic volume when HA updates
  useEffect(() => {
    if (!isDraggingRef.current) setOptimisticVol(null);
  }, [volumeLevel]);

  const displayVol = optimisticVol ?? (volumeLevel !== undefined ? Math.round(volumeLevel * 100) : 0);

  // Fetch browse media when switching to favorites tab
  const fetchBrowse = useCallback(
    async (contentId = "", contentType = "") => {
      setBrowseLoading(true);
      try {
        const params = new URLSearchParams({ entity_id: entityId });
        if (contentId) params.set("media_content_id", contentId);
        if (contentType) params.set("media_content_type", contentType);
        const resp = await fetch(apiUrl(`/api/media/browse?${params}`));
        if (!resp.ok) throw new Error("Browse failed");
        const data = await resp.json();
        setBrowseTitle(data.title || "Medien");
        setBrowseItems(data.children || []);
      } catch {
        setBrowseItems([]);
        setBrowseTitle("Fehler beim Laden");
      } finally {
        setBrowseLoading(false);
      }
    },
    [entityId],
  );

  useEffect(() => {
    if (activeTab === "favorites") {
      setBrowseStack([]);
      fetchBrowse();
    }
  }, [activeTab, entityId, fetchBrowse]);

  const browseTo = (item: BrowseItem) => {
    if (item.can_expand) {
      setBrowseStack((s) => [...s, { title: browseTitle, contentId: "", contentType: "" }]);
      fetchBrowse(item.media_content_id, item.media_content_type);
    } else if (item.can_play) {
      callService(
        "media_player",
        "play_media",
        { media_content_id: item.media_content_id, media_content_type: item.media_content_type },
        { entity_id: entityId },
      );
    }
  };

  const browseBack = () => {
    const stack = [...browseStack];
    stack.pop();
    setBrowseStack(stack);
    fetchBrowse();
  };

  // Service calls
  const togglePlayPause = () =>
    callService("media_player", "media_play_pause", {}, { entity_id: entityId });
  const prevTrack = () =>
    callService("media_player", "media_previous_track", {}, { entity_id: entityId });
  const nextTrack = () =>
    callService("media_player", "media_next_track", {}, { entity_id: entityId });
  const toggleShuffle = () =>
    callService("media_player", "shuffle_set", { shuffle: !shuffle }, { entity_id: entityId });
  const toggleRepeat = () => {
    const modes = ["off", "all", "one"];
    const idx = modes.indexOf(repeat || "off");
    const next = modes[(idx + 1) % modes.length];
    callService("media_player", "repeat_set", { repeat: next }, { entity_id: entityId });
  };
  const toggleMute = () =>
    callService("media_player", "volume_mute", { is_volume_muted: !isMuted }, { entity_id: entityId });

  const sendVolume = useCallback(
    (pct: number, force?: boolean) => {
      const clamped = Math.max(0, Math.min(100, Math.round(pct)));
      const now = Date.now();
      if (!force && now - lastCallRef.current < 100) return;
      lastCallRef.current = now;
      callService("media_player", "volume_set", { volume_level: clamped / 100 }, { entity_id: entityId });
    },
    [callService, entityId],
  );

  const handleVolPointerDown = useCallback(
    (e: React.PointerEvent) => {
      const el = volTrackRef.current;
      if (!el) return;
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      isDraggingRef.current = true;

      const calcPct = (clientX: number) => {
        const rect = el.getBoundingClientRect();
        return Math.max(0, Math.min(100, Math.round(((clientX - rect.left) / rect.width) * 100)));
      };

      const pct = calcPct(e.clientX);
      setOptimisticVol(pct);
      sendVolume(pct);

      const onMove = (ev: PointerEvent) => {
        const p = calcPct(ev.clientX);
        setOptimisticVol(p);
        sendVolume(p);
      };
      const onUp = (ev: PointerEvent) => {
        isDraggingRef.current = false;
        const p = calcPct(ev.clientX);
        setOptimisticVol(p);
        sendVolume(p, true);
        document.removeEventListener("pointermove", onMove);
        document.removeEventListener("pointerup", onUp);
      };
      document.addEventListener("pointermove", onMove);
      document.addEventListener("pointerup", onUp);
    },
    [sendVolume],
  );

  // Speakers: all media_player entities (filter sonos if current is sonos)
  const allMediaPlayers = useEntitiesByDomain("media_player");
  const sonosSpeakers = useMemo(() => {
    // Show all media players that are actual sonos speakers (not groups/unavailable)
    return allMediaPlayers.filter(
      (e) => e.state !== "unavailable" && e.entity_id !== "media_player.alle_sonos",
    );
  }, [allMediaPlayers]);

  const progressPct =
    mediaDuration && currentPosition ? Math.min(100, (currentPosition / mediaDuration) * 100) : 0;

  return (
    <PopupModal open title={name} icon="play" onClose={onClose}>
      <div className="media-popup">
        {/* Player Tab */}
        {activeTab === "player" && (
          <>
            {/* Artwork */}
            <div className="media-popup__artwork-wrap">
              {artworkUrl ? (
                <img className="media-popup__artwork" src={artworkUrl} alt="" />
              ) : (
                <div className="media-popup__artwork-placeholder">
                  <Icon name="play" style={{ width: 48, height: 48, color: "rgba(250,251,252,0.2)" }} />
                </div>
              )}
            </div>

            {/* Song info */}
            <div className="media-popup__song-info">
              <span className="media-popup__song-title">{mediaTitle || name}</span>
              {mediaArtist && <span className="media-popup__song-artist">{mediaArtist}</span>}
              {mediaAlbum && <span className="media-popup__song-album">{mediaAlbum}</span>}
            </div>

            {/* Progress bar */}
            {isActive && mediaDuration !== undefined && (
              <div className="media-popup__progress">
                <div className="media-popup__progress-bar">
                  <div className="media-popup__progress-fill" style={{ width: `${progressPct}%` }} />
                </div>
                <div className="media-popup__progress-times">
                  <span>{formatTime(currentPosition)}</span>
                  <span>{formatTime(mediaDuration)}</span>
                </div>
              </div>
            )}

            {/* Playback controls */}
            <div className="media-popup__playback">
              <button
                className={`media-popup__ctrl-btn${shuffle ? " active" : ""}`}
                onClick={toggleShuffle}
                title="Shuffle"
              >
                <Icon name="sort" style={{ width: 20, height: 20 }} />
              </button>
              <button className="media-popup__ctrl-btn" onClick={prevTrack} title="Previous">
                <Icon name="media-rewind" style={{ width: 28, height: 28 }} />
              </button>
              <button className="media-popup__play-main" onClick={togglePlayPause} title={isPlaying ? "Pause" : "Play"}>
                <Icon name={isPlaying ? "media-pause" : "media-play"} style={{ width: 28, height: 28 }} />
              </button>
              <button className="media-popup__ctrl-btn" onClick={nextTrack} title="Next">
                <Icon name="media-forward" style={{ width: 28, height: 28 }} />
              </button>
              <button
                className={`media-popup__ctrl-btn${repeat && repeat !== "off" ? " active" : ""}`}
                onClick={toggleRepeat}
                title={`Repeat: ${repeat || "off"}`}
              >
                <Icon name="refresh" style={{ width: 20, height: 20 }} />
              </button>
            </div>

            {/* Volume */}
            <div className="media-popup__volume">
              <button
                className={`media-popup__vol-btn${isMuted ? " muted" : ""}`}
                onClick={toggleMute}
                title={isMuted ? "Unmute" : "Mute"}
              >
                <Icon name={isMuted ? "sound-off" : "sound-loud"} style={{ width: 20, height: 20 }} />
              </button>
              <div ref={volTrackRef} className="media-popup__vol-track" onPointerDown={handleVolPointerDown}>
                <div className="media-popup__vol-fill" style={{ width: `${displayVol}%` }} />
                <div className="media-popup__vol-thumb" style={{ left: `${displayVol}%` }} />
              </div>
              <span className="media-popup__vol-label">{displayVol}%</span>
            </div>
          </>
        )}

        {/* Favorites / Browse Tab */}
        {activeTab === "favorites" && (
          <div className="media-popup__browse">
            {browseStack.length > 0 && (
              <button className="media-popup__browse-back" onClick={browseBack}>
                <Icon name="slim-arrow-left" style={{ width: 14, height: 14 }} />
                <span>Zurück</span>
              </button>
            )}
            {browseTitle && <div className="media-popup__browse-title">{browseTitle}</div>}
            {browseLoading ? (
              <div className="media-popup__empty">Laden...</div>
            ) : browseItems.length > 0 ? (
              <div className="media-popup__favorites">
                {browseItems.map((item, i) => (
                  <button
                    key={`${item.media_content_id}-${i}`}
                    className={`media-popup__fav-chip${item.can_expand ? " expandable" : ""}`}
                    onClick={() => browseTo(item)}
                    title={item.title}
                  >
                    {item.can_expand && (
                      <Icon name="open-folder" style={{ width: 14, height: 14, flexShrink: 0 }} />
                    )}
                    {item.can_play && !item.can_expand && (
                      <Icon name="media-play" style={{ width: 12, height: 12, flexShrink: 0 }} />
                    )}
                    <span>{item.title}</span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="media-popup__empty">Keine Medien verfügbar</div>
            )}
          </div>
        )}

        {/* Speakers Tab */}
        {activeTab === "speakers" && (
          <div className="media-popup__speakers">
            {sonosSpeakers.map((speaker) => {
              const sAttrs = speaker.attributes;
              const sName = (sAttrs.friendly_name as string) || speaker.entity_id;
              const sSong = (sAttrs.media_title as string) || "";
              const sVol = sAttrs.volume_level as number | undefined;
              const sVolPct = sVol !== undefined ? Math.round(sVol * 100) : 0;
              const isCurrent = speaker.entity_id === entityId;

              return (
                <div
                  key={speaker.entity_id}
                  className={`media-popup__speaker${isCurrent ? " current" : ""}`}
                  onClick={() => setEntityId(speaker.entity_id)}
                >
                  <Icon name="sound-loud" style={{ width: 18, height: 18, opacity: 0.5, flexShrink: 0 }} />
                  <div className="media-popup__speaker-info">
                    <div className="media-popup__speaker-name">{sName}</div>
                    {sSong && <div className="media-popup__speaker-song">{sSong}</div>}
                  </div>
                  <div className="media-popup__speaker-vol">
                    <div className="media-popup__speaker-vol-track">
                      <div className="media-popup__speaker-vol-fill" style={{ width: `${sVolPct}%` }} />
                    </div>
                  </div>
                </div>
              );
            })}
            {sonosSpeakers.length === 0 && (
              <div className="media-popup__empty">Keine Speaker gefunden</div>
            )}
          </div>
        )}

        {/* Queue Tab */}
        {activeTab === "queue" && (
          <div className="media-popup__queue">
            {isActive && mediaTitle ? (
              <div className="media-popup__queue-item">
                <span className="media-popup__queue-num">1</span>
                <span className="media-popup__queue-title">{mediaTitle}</span>
                <span className="media-popup__queue-artist">{mediaArtist}</span>
              </div>
            ) : (
              <div className="media-popup__empty">Keine Wiedergabeliste verfügbar</div>
            )}
          </div>
        )}

        {/* Footer Tabs */}
        <div className="media-popup__tabs">
          <button
            className={`media-popup__tab${activeTab === "player" ? " active" : ""}`}
            onClick={() => setActiveTab("player")}
          >
            <Icon name="home" style={{ width: 16, height: 16 }} />
            <span>Player</span>
          </button>
          <button
            className={`media-popup__tab${activeTab === "favorites" ? " active" : ""}`}
            onClick={() => setActiveTab("favorites")}
          >
            <Icon name="favorite" style={{ width: 16, height: 16 }} />
            <span>Quellen</span>
          </button>
          <button
            className={`media-popup__tab${activeTab === "speakers" ? " active" : ""}`}
            onClick={() => setActiveTab("speakers")}
          >
            <Icon name="sound-loud" style={{ width: 16, height: 16 }} />
            <span>Speaker</span>
          </button>
          <button
            className={`media-popup__tab${activeTab === "queue" ? " active" : ""}`}
            onClick={() => setActiveTab("queue")}
          >
            <Icon name="list" style={{ width: 16, height: 16 }} />
            <span>Queue</span>
          </button>
        </div>
      </div>
    </PopupModal>
  );
}

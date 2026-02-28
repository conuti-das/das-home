import { PillCard } from "./PillCard";
import type { CardComponentProps } from "./CardRegistry";

export function IframeCard({ card }: CardComponentProps) {
  const url = (card.config?.url as string) || "";

  return (
    <PillCard entityId={card.entity || "iframe"} label="Iframe" cardType="iframe">
      {url && (
        <iframe
          src={url}
          style={{ width: "100%", height: 120, border: "none", borderRadius: 16 }}
          title="embedded"
        />
      )}
    </PillCard>
  );
}

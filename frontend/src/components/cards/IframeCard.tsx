import { BaseCard } from "./BaseCard";
import type { CardComponentProps } from "./CardRegistry";

export function IframeCard({ card }: CardComponentProps) {
  const url = (card.config?.url as string) || "";
  const title = (card.config?.title as string) || "Iframe";

  return (
    <BaseCard title={title} cardType="iframe" size={card.size}>
      {url ? (
        <iframe
          src={url}
          title={title}
          style={{ width: "100%", height: "300px", border: "none", borderRadius: "var(--sapElement_BorderCornerRadius)" }}
          sandbox="allow-scripts allow-same-origin"
        />
      ) : (
        <div style={{ padding: "1rem", color: "var(--sapContent_LabelColor)" }}>No URL configured</div>
      )}
    </BaseCard>
  );
}

import { PillCard } from "./PillCard";
import type { CardComponentProps } from "./CardRegistry";

export function MarkdownCard({ card }: CardComponentProps) {
  const content = (card.config?.content as string) || "";

  return (
    <PillCard entityId={card.entity || "markdown"} label="Markdown" cardType="markdown">
      <div style={{ fontSize: 13, opacity: 0.8, lineHeight: 1.5, overflow: "hidden", maxHeight: 100 }}>
        {content}
      </div>
    </PillCard>
  );
}

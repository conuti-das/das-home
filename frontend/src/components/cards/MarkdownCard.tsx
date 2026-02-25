import { BaseCard } from "./BaseCard";
import type { CardComponentProps } from "./CardRegistry";

export function MarkdownCard({ card }: CardComponentProps) {
  const content = (card.config?.content as string) || "";
  const title = (card.config?.title as string) || "Markdown";

  return (
    <BaseCard title={title} cardType="markdown" size={card.size}>
      <div
        style={{
          padding: "0.5rem",
          whiteSpace: "pre-wrap",
          fontFamily: "var(--sapFontFamily)",
          fontSize: "var(--sapFontSize)",
          color: "var(--sapTextColor)",
        }}
      >
        {content}
      </div>
    </BaseCard>
  );
}

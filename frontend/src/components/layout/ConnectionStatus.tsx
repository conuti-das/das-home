import { MessageStrip } from "@ui5/webcomponents-react";
import { useConnectionStore } from "@/stores/connectionStore";

export function ConnectionStatus() {
  const status = useConnectionStore((s) => s.status);

  if (status === "connected") return null;

  return (
    <MessageStrip
      design={status === "connecting" ? "Information" : "Negative"}
      hideCloseButton
      style={{ borderRadius: 0 }}
    >
      {status === "connecting"
        ? "Connecting to Home Assistant..."
        : "Disconnected from Home Assistant. Reconnecting..."}
    </MessageStrip>
  );
}

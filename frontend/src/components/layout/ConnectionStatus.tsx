import { useConnectionStore } from "@/stores/connectionStore";

export function ConnectionStatus() {
  const status = useConnectionStore((s) => s.status);

  if (status === "connected") return null;

  const color = status === "connecting" ? "var(--dh-orange)" : "var(--dh-red)";

  return (
    <div style={{
      position: "fixed",
      top: 12,
      right: 12,
      zIndex: 300,
      display: "flex",
      alignItems: "center",
      gap: 8,
      padding: "6px 12px",
      borderRadius: 20,
      background: "var(--dh-gray200)",
      fontSize: 12,
      color: "var(--dh-gray100)",
    }}>
      <div style={{
        width: 8,
        height: 8,
        borderRadius: "50%",
        background: color,
        animation: status === "connecting" ? "pulse 1.5s infinite" : undefined,
      }} />
      {status === "connecting" ? "Connecting..." : "Disconnected"}
      <style>{`@keyframes pulse { 0%,100% { opacity: 1; } 50% { opacity: 0.3; } }`}</style>
    </div>
  );
}

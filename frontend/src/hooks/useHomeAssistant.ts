import { useEffect, useRef, useCallback } from "react";
import { useConnectionStore } from "@/stores/connectionStore";
import { useEntityStore } from "@/stores/entityStore";
import type { EntityState } from "@/types";

export function useHomeAssistant() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectDelay = useRef(1000);

  const setStatus = useConnectionStore((s) => s.setStatus);
  const setEntity = useEntityStore((s) => s.setEntity);
  const setEntities = useEntityStore((s) => s.setEntities);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    const protocol = window.location.protocol === "https:" ? "wss:" : "ws:";
    const ws = new WebSocket(`${protocol}//${window.location.host}/ws`);

    ws.onopen = () => {
      setStatus("connected");
      reconnectDelay.current = 1000;
      // Request all current states
      ws.send(JSON.stringify({ type: "get_states" }));
    };

    ws.onmessage = (event) => {
      const msg = JSON.parse(event.data);

      if (msg.type === "state_changed" && msg.new_state) {
        setEntity(msg.entity_id, msg.new_state as EntityState);
      }

      if (msg.type === "states_result" && Array.isArray(msg.result)) {
        const map = new Map<string, EntityState>();
        for (const state of msg.result) {
          map.set(state.entity_id, state);
        }
        setEntities(map);
      }
    };

    ws.onclose = () => {
      setStatus("disconnected");
      wsRef.current = null;
      // Exponential backoff reconnect
      reconnectTimer.current = setTimeout(() => {
        reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
        connect();
      }, reconnectDelay.current);
    };

    ws.onerror = () => {
      ws.close();
    };

    wsRef.current = ws;
  }, [setStatus, setEntity, setEntities]);

  const callService = useCallback(
    (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => {
      if (wsRef.current?.readyState === WebSocket.OPEN) {
        wsRef.current.send(
          JSON.stringify({ type: "call_service", domain, service, data, target })
        );
      }
    },
    []
  );

  useEffect(() => {
    connect();
    return () => {
      clearTimeout(reconnectTimer.current);
      wsRef.current?.close();
    };
  }, [connect]);

  return { callService };
}

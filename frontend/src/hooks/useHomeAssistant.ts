import { useEffect, useRef, useCallback } from "react";
import { useConnectionStore } from "@/stores/connectionStore";
import { useEntityStore } from "@/stores/entityStore";
import { apiUrl, wsUrl } from "@/utils/basePath";
import type { EntityState } from "@/types";

export function useHomeAssistant() {
  const wsRef = useRef<WebSocket | null>(null);
  const reconnectTimer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const reconnectDelay = useRef(1000);

  const setStatus = useConnectionStore((s) => s.setStatus);
  const setEntity = useEntityStore((s) => s.setEntity);
  const setEntities = useEntityStore((s) => s.setEntities);
  const setAreas = useEntityStore((s) => s.setAreas);
  const setEntityAreaMap = useEntityStore((s) => s.setEntityAreaMap);

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;

    setStatus("connecting");
    const ws = new WebSocket(wsUrl("/ws"));

    ws.onopen = () => {
      setStatus("connected");
      reconnectDelay.current = 1000;
      // Request all current states
      ws.send(JSON.stringify({ type: "get_states" }));
      // Fetch entity-area mapping from discovery endpoint
      fetch(apiUrl("/api/discovery"))
        .then((r) => r.json())
        .then((data) => {
          if (data.entity_area_map) setEntityAreaMap(data.entity_area_map);
          if (data.areas) setAreas(data.areas);
        })
        .catch(() => { /* discovery not available */ });
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
  }, [setStatus, setEntity, setEntities, setAreas, setEntityAreaMap]);

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

  const sendCommand = useCallback(
    (command: Record<string, unknown>): Promise<unknown> => {
      return new Promise((resolve, reject) => {
        if (wsRef.current?.readyState !== WebSocket.OPEN) {
          reject(new Error("WebSocket not connected"));
          return;
        }
        const id = Math.random().toString(36).slice(2);
        const handler = (event: MessageEvent) => {
          const msg = JSON.parse(event.data);
          if (msg.id === id) {
            wsRef.current?.removeEventListener("message", handler);
            if (msg.success === false) {
              reject(new Error(msg.error?.message || "Command failed"));
            } else {
              resolve(msg.result);
            }
          }
        };
        wsRef.current.addEventListener("message", handler);
        wsRef.current.send(JSON.stringify({ ...command, id }));
        // Timeout after 10s
        setTimeout(() => {
          wsRef.current?.removeEventListener("message", handler);
          reject(new Error("Command timeout"));
        }, 10000);
      });
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

  return { callService, sendCommand };
}

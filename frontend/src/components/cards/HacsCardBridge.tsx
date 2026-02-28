import { useEffect, useRef, useState } from "react";
import { BaseCard } from "./BaseCard";
import { useEntityStore } from "@/stores/entityStore";
import { useConnectionStore } from "@/stores/connectionStore";
import { apiUrl } from "@/utils/basePath";
import type { CardComponentProps } from "./CardRegistry";

interface HassShim {
  states: Record<string, unknown>;
  callService: (domain: string, service: string, data: unknown) => void;
  connection: { connected: boolean };
}

export function HacsCardBridge({ card, callService }: CardComponentProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const shadowRef = useRef<ShadowRoot | null>(null);
  const elementRef = useRef<HTMLElement | null>(null);
  const [error, setError] = useState<string>("");
  const [loaded, setLoaded] = useState(false);

  const entities = useEntityStore((s) => s.entities);
  const connectionStatus = useConnectionStore((s) => s.status);

  const cardTag = (card.config?.tag as string) || "";
  const jsUrl = (card.config?.js_url as string) || "";

  // Load the custom element JS
  useEffect(() => {
    if (!jsUrl || !cardTag) {
      setError("Missing tag or js_url in card config");
      return;
    }

    const proxyUrl = apiUrl(`/api/hacs/proxy/${jsUrl.replace(/^\//, "")}`);

    // Check if already loaded
    if (customElements.get(cardTag)) {
      setLoaded(true);
      return;
    }

    const script = document.createElement("script");
    script.type = "module";
    script.src = proxyUrl;
    script.onload = () => {
      // Wait for custom element registration
      const check = setInterval(() => {
        if (customElements.get(cardTag)) {
          clearInterval(check);
          setLoaded(true);
        }
      }, 100);
      // Timeout after 5 seconds
      setTimeout(() => {
        clearInterval(check);
        if (!customElements.get(cardTag)) {
          setError(`Custom element <${cardTag}> not registered after loading JS`);
        }
      }, 5000);
    };
    script.onerror = () => setError(`Failed to load ${proxyUrl}`);
    document.head.appendChild(script);
  }, [jsUrl, cardTag]);

  // Create and configure the custom element
  useEffect(() => {
    if (!loaded || !containerRef.current || !cardTag) return;

    // Create shadow DOM container
    if (!shadowRef.current) {
      shadowRef.current = containerRef.current.attachShadow({ mode: "open" });
    }

    // Create the element if not yet created
    if (!elementRef.current) {
      const el = document.createElement(cardTag);
      shadowRef.current.innerHTML = "";
      shadowRef.current.appendChild(el);
      elementRef.current = el;
    }

    // Set card config
    const cardConfig = { ...(card.config || {}), type: cardTag, entity: card.entity };
    try {
      (elementRef.current as unknown as { setConfig: (c: unknown) => void }).setConfig(cardConfig);
    } catch {
      // Some cards don't have setConfig
    }
  }, [loaded, cardTag, card.config, card.entity]);

  // Update hass object when entities change
  useEffect(() => {
    if (!elementRef.current) return;

    const statesObj: Record<string, unknown> = {};
    for (const [id, state] of entities) {
      statesObj[id] = state;
    }

    const hass: HassShim = {
      states: statesObj,
      callService: (domain, service, data) => {
        callService(domain, service, data as Record<string, unknown>);
      },
      connection: { connected: connectionStatus === "connected" },
    };

    try {
      (elementRef.current as unknown as { hass: HassShim }).hass = hass;
    } catch {
      // Some elements may not accept hass directly
    }
  }, [entities, connectionStatus, callService]);

  if (error) {
    return (
      <BaseCard title={cardTag || "HACS Card"} status="Error" cardType="hacs" size={card.size}>
        <div style={{ color: "var(--sapNegativeColor)", padding: "0.5rem" }}>{error}</div>
      </BaseCard>
    );
  }

  return (
    <BaseCard title={cardTag || "HACS Card"} cardType="hacs" size={card.size}>
      <div ref={containerRef} style={{ minHeight: "100px" }}>
        {!loaded && <span style={{ color: "var(--sapContent_LabelColor)" }}>Loading...</span>}
      </div>
    </BaseCard>
  );
}

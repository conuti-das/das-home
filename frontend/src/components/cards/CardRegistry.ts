import type { ComponentType } from "react";
import type { CardItem } from "@/types";

export interface CardComponentProps {
  card: CardItem;
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => void;
  onCardAction?: (popupId: string, props?: Record<string, unknown>) => void;
}

export type CardCategory = "anzeige" | "steuerung" | "komplex" | "spezial";

export interface CardMetadata {
  type: string;
  displayName: string;
  description: string;
  category: CardCategory;
  compatibleDomains: string[];
  defaultSize: string;
  iconName: string;
}

interface RegistryEntry {
  component: ComponentType<CardComponentProps>;
  metadata?: CardMetadata;
}

const registry = new Map<string, RegistryEntry>();

export function registerCard(
  type: string,
  component: ComponentType<CardComponentProps>,
  metadata?: Omit<CardMetadata, "type">,
) {
  registry.set(type, {
    component,
    metadata: metadata ? { ...metadata, type } : undefined,
  });
}

export function getCardComponent(type: string): ComponentType<CardComponentProps> | undefined {
  return registry.get(type)?.component;
}

export function getCardMetadata(type: string): CardMetadata | undefined {
  return registry.get(type)?.metadata;
}

export function getAllMetadata(): CardMetadata[] {
  const result: CardMetadata[] = [];
  for (const entry of registry.values()) {
    if (entry.metadata) result.push(entry.metadata);
  }
  return result;
}

export function getCardsByCategory(category: CardCategory): CardMetadata[] {
  return getAllMetadata().filter((m) => m.category === category);
}

export function getRegisteredTypes(): string[] {
  return Array.from(registry.keys());
}

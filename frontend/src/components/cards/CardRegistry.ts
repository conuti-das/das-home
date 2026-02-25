import type { ComponentType } from "react";
import type { CardItem } from "@/types";

export interface CardComponentProps {
  card: CardItem;
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => void;
}

const registry = new Map<string, ComponentType<CardComponentProps>>();

export function registerCard(type: string, component: ComponentType<CardComponentProps>) {
  registry.set(type, component);
}

export function getCardComponent(type: string): ComponentType<CardComponentProps> | undefined {
  return registry.get(type);
}

export function getRegisteredTypes(): string[] {
  return Array.from(registry.keys());
}

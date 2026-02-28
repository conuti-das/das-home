import type { ComponentType } from "react";

export interface PopupProps {
  onClose: () => void;
  callService: (domain: string, service: string, data?: Record<string, unknown>, target?: Record<string, unknown>) => void;
  onOpenPopup?: (popupId: string, props?: Record<string, unknown>) => void;
  props?: Record<string, unknown>;
}

const registry = new Map<string, ComponentType<PopupProps>>();

export function registerPopup(id: string, component: ComponentType<PopupProps>) {
  registry.set(id, component);
}

export function getPopupComponent(id: string): ComponentType<PopupProps> | undefined {
  return registry.get(id);
}

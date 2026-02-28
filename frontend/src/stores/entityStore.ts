import { create } from "zustand";
import type { EntityState, Area, Device, Floor } from "@/types";

interface EntityStore {
  entities: Map<string, EntityState>;
  areas: Map<string, Area>;
  devices: Map<string, Device>;
  floors: Map<string, Floor>;
  entityAreaMap: Map<string, string>;
  setEntity: (entityId: string, state: EntityState) => void;
  setEntities: (entities: Map<string, EntityState>) => void;
  setAreas: (areas: Area[]) => void;
  setDevices: (devices: Device[]) => void;
  setFloors: (floors: Floor[]) => void;
  setEntityAreaMap: (map: Record<string, string>) => void;
}

export const useEntityStore = create<EntityStore>((set) => ({
  entities: new Map(),
  areas: new Map(),
  devices: new Map(),
  floors: new Map(),
  entityAreaMap: new Map(),
  setEntity: (entityId, state) =>
    set((prev) => {
      const next = new Map(prev.entities);
      next.set(entityId, state);
      return { entities: next };
    }),
  setEntities: (entities) => set({ entities }),
  setAreas: (areas) =>
    set({ areas: new Map(areas.map((a) => [a.area_id, a])) }),
  setDevices: (devices) =>
    set({ devices: new Map(devices.map((d) => [d.id, d])) }),
  setFloors: (floors) =>
    set({ floors: new Map(floors.map((f) => [f.floor_id, f])) }),
  setEntityAreaMap: (map) =>
    set({ entityAreaMap: new Map(Object.entries(map)) }),
}));

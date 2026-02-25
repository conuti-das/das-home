import { useEntityStore } from "@/stores/entityStore";
import type { EntityState } from "@/types";

export function useEntity(entityId: string): EntityState | undefined {
  return useEntityStore((s) => s.entities.get(entityId));
}

export function useEntitiesByDomain(domain: string): EntityState[] {
  return useEntityStore((s) => {
    const result: EntityState[] = [];
    for (const [id, state] of s.entities) {
      if (id.startsWith(`${domain}.`)) {
        result.push(state);
      }
    }
    return result;
  });
}

export function useEntitiesByArea(_areaId: string): EntityState[] {
  // TODO: filter by device-area mapping once available
  return useEntityStore((s) => Array.from(s.entities.values()));
}
